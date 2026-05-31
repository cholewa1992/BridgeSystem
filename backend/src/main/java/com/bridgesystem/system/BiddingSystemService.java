package com.bridgesystem.system;

import com.bridgesystem.convention.ConventionDtos;
import com.bridgesystem.convention.ConventionRepository;
import com.bridgesystem.convention.ConventionService;
import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;

@Service
public class BiddingSystemService {

    private static final String EMPTY_TREE = "{\"children\":[]}";

    private final BiddingSystemRepository systemRepository;
    private final SystemShareRepository shareRepository;
    private final SystemLikeRepository likeRepository;
    private final SystemAccessGuard accessGuard;
    private final ObjectMapper objectMapper;
    private final ConventionRepository conventionRepository;
    private final ConventionService conventionService;
    private final SystemSummaryMapper summaryMapper;

    public BiddingSystemService(BiddingSystemRepository systemRepository,
                                SystemShareRepository shareRepository,
                                SystemLikeRepository likeRepository,
                                SystemAccessGuard accessGuard,
                                ObjectMapper objectMapper,
                                ConventionRepository conventionRepository,
                                ConventionService conventionService,
                                SystemSummaryMapper summaryMapper) {
        this.systemRepository = systemRepository;
        this.shareRepository = shareRepository;
        this.likeRepository = likeRepository;
        this.accessGuard = accessGuard;
        this.objectMapper = objectMapper;
        this.conventionRepository = conventionRepository;
        this.conventionService = conventionService;
        this.summaryMapper = summaryMapper;
    }

    @Transactional(readOnly = true)
    public List<BiddingSystemDtos.SystemSummary> listAccessible(AppUser user) {
        List<BiddingSystem> systems = systemRepository.findAccessibleBy(user.getId());
        Map<UUID, SystemSummaryMapper.SystemStats> stats = summaryMapper.statsFor(systems, user);
        return systems.stream()
                .map(s -> summaryMapper.toSummary(s, user, stats.get(s.getId())))
                .toList();
    }

    @Transactional
    public BiddingSystemDtos.SystemDetail create(AppUser user, BiddingSystemDtos.CreateRequest req) {
        BiddingSystem system = new BiddingSystem(
                UUID.randomUUID(),
                user,
                req.name(),
                req.description(),
                EMPTY_TREE
        );
        systemRepository.save(system);
        return toDetail(system, user);
    }

    @Transactional(readOnly = true)
    public BiddingSystemDtos.SystemDetail get(UUID id, @Nullable AppUser user) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.READ);
        return toDetail(system, user);
    }

    @Transactional
    public BiddingSystemDtos.SystemDetail update(UUID id, AppUser user, BiddingSystemDtos.UpdateRequest req) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.WRITE);
        if (req.tree() != null) {
            try {
                BidTree tree = BidTree.from(req.tree());
                system.updateContent(req.name(), req.description(), tree.toJson(objectMapper));
            } catch (IllegalArgumentException | IllegalStateException e) {
                throw new ResponseStatusException(BAD_REQUEST, e.getMessage(), e);
            }
        } else {
            system.updateContent(req.name(), req.description(), system.getTreeJson());
        }
        return toDetail(system, user);
    }

    @Transactional
    public void delete(UUID id, AppUser user) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.OWNER);
        long forkCount = systemRepository.countByForkedFrom(system);
        try {
            system.ensureDeletable(forkCount);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(CONFLICT, e.getMessage());
        }
        systemRepository.delete(system);
    }

    @Transactional
    public BiddingSystemDtos.SystemDetail updateVisibility(UUID id, AppUser user, boolean isPublic) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.OWNER);
        if (isPublic) {
            system.publish();
        } else {
            system.unpublish();
        }
        return toDetail(system, user);
    }

    @Transactional
    public BiddingSystemDtos.SystemDetail fork(UUID originalId, AppUser caller) {
        BiddingSystem original = accessGuard.requireAccess(originalId, caller, SystemAccessGuard.Permission.READ);
        BiddingSystem forked = original.fork(UUID.randomUUID(), caller);
        systemRepository.save(forked);
        return toDetail(forked, caller);
    }

    // ── Mapping ────────────────────────────────────────────────────────────

    private BiddingSystemDtos.SystemDetail toDetail(BiddingSystem s, @Nullable AppUser viewer) {
        JsonNode tree;
        try {
            tree = objectMapper.readTree(s.getTreeJson());
        } catch (JsonProcessingException e) {
            tree = objectMapper.createObjectNode().putArray("children").arrayNode();
        }
        long likeCount = likeRepository.countBySystem(s);
        int forkCount = (int) systemRepository.countByForkedFrom(s);
        Boolean likedByMe = viewer != null ? likeRepository.existsBySystemAndUser(s, viewer) : null;
        boolean ownedByMe = viewer != null && s.getOwner().getId().equals(viewer.getId());
        String permission = viewer != null ? summaryMapper.permissionFor(s, viewer) : "NONE";
        BiddingSystemDtos.ForkedFromRef forkedFromRef = null;
        if (s.getForkedFrom() != null) {
            BiddingSystem ff = s.getForkedFrom();
            forkedFromRef = new BiddingSystemDtos.ForkedFromRef(
                    ff.getId().toString(),
                    ff.getName(),
                    ff.getOwner().getUsername()
            );
        }
        // Resolve convention references embedded in tree_json
        Set<String> refStrings = collectConventionRefs(tree);
        List<ConventionDtos.ConventionDetail> conventions = new ArrayList<>();
        for (String refStr : refStrings) {
            try {
                UUID refId = UUID.fromString(refStr);
                conventionRepository.findById(refId)
                        .ifPresent(c -> conventions.add(conventionService.toDetail(c, viewer)));
            } catch (IllegalArgumentException ignored) {
                // skip non-UUID strings
            }
        }
        return new BiddingSystemDtos.SystemDetail(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getOwner().getUsername(),
                ownedByMe,
                permission,
                tree,
                s.getCreatedAt(),
                s.getUpdatedAt(),
                s.isPublic(),
                likeCount,
                forkCount,
                likedByMe,
                forkedFromRef,
                conventions
        );
    }

    private Set<String> collectConventionRefs(JsonNode node) {
        Set<String> refs = new HashSet<>();
        if (node.isArray()) {
            node.forEach(child -> refs.addAll(collectConventionRefs(child)));
        } else if (node.isObject()) {
            if (node.has("conventionRef")) refs.add(node.get("conventionRef").asText());
            node.fields().forEachRemaining(e -> refs.addAll(collectConventionRefs(e.getValue())));
        }
        return refs;
    }
}
