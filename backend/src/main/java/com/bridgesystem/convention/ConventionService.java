package com.bridgesystem.convention;

import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ConventionService {

    private static final String EMPTY_PARAMETERS = "[]";
    private static final String EMPTY_ROOT = "{\"id\":\"root\",\"bids\":[],\"meaning\":\"\",\"children\":[]}";

    private final ConventionRepository conventionRepository;
    private final ConventionShareRepository shareRepository;
    private final ConventionLikeRepository likeRepository;
    private final ConventionAccessGuard accessGuard;
    private final ObjectMapper objectMapper;
    private final AppUserRepository userRepository;

    public ConventionService(ConventionRepository conventionRepository,
                             ConventionShareRepository shareRepository,
                             ConventionLikeRepository likeRepository,
                             ConventionAccessGuard accessGuard,
                             ObjectMapper objectMapper,
                             AppUserRepository userRepository) {
        this.conventionRepository = conventionRepository;
        this.shareRepository = shareRepository;
        this.likeRepository = likeRepository;
        this.accessGuard = accessGuard;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ConventionDtos.ConventionSummary> listLibrary(AppUser user) {
        List<Convention> owned = conventionRepository.findByOwnerOrderByUpdatedAtDesc(user);
        List<Convention> shared = conventionRepository.findSharedWith(user);

        // Deduplicate (owner may also have a share row), preserving order: owned first, then shared
        Map<UUID, Convention> seen = new LinkedHashMap<>();
        for (Convention c : owned) seen.put(c.getId(), c);
        for (Convention c : shared) seen.putIfAbsent(c.getId(), c);

        List<Convention> all = new ArrayList<>(seen.values());
        all.sort(Comparator.comparing(Convention::getUpdatedAt).reversed());

        List<UUID> ids = all.stream().map(Convention::getId).toList();
        Map<UUID, Long> likeCounts = buildLikeCountMap(ids);
        Map<UUID, Integer> forkCounts = buildForkCountMap(ids);
        List<UUID> likedIds = ids.isEmpty() ? List.of() : conventionRepository.conventionIdsLikedByUser(ids, user);

        return all.stream()
                .map(c -> toSummary(c, user, likeCounts, forkCounts, likedIds))
                .toList();
    }

    @Transactional
    public ConventionDtos.ConventionDetail create(AppUser owner, ConventionDtos.CreateRequest req) {
        Convention convention = new Convention(UUID.randomUUID(), owner, req.name(), req.description());
        conventionRepository.save(convention);
        return toDetail(convention, owner);
    }

    @Transactional(readOnly = true)
    public ConventionDtos.ConventionDetail get(UUID id, @Nullable AppUser user) {
        Convention convention = accessGuard.requireAccess(id, user, ConventionAccessGuard.Permission.READ);
        return toDetail(convention, user);
    }

    @Transactional
    public ConventionDtos.ConventionDetail update(UUID id, AppUser user, ConventionDtos.UpdateRequest req) {
        Convention convention = accessGuard.requireAccess(id, user, ConventionAccessGuard.Permission.WRITE);
        String parametersJson = EMPTY_PARAMETERS;
        String rootJson = EMPTY_ROOT;
        if (req.parameters() != null) {
            try {
                parametersJson = objectMapper.writeValueAsString(req.parameters());
            } catch (JsonProcessingException e) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid parameters JSON", e);
            }
        }
        if (req.root() != null) {
            try {
                rootJson = objectMapper.writeValueAsString(req.root());
            } catch (JsonProcessingException e) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid root JSON", e);
            }
        }
        convention.updateContent(req.name(), req.description(), parametersJson, rootJson);
        return toDetail(convention, user);
    }

    @Transactional
    public void delete(UUID id, AppUser user) {
        Convention convention = accessGuard.requireAccess(id, user, ConventionAccessGuard.Permission.OWNER);
        conventionRepository.delete(convention);
    }

    @Transactional
    public ConventionDtos.ConventionDetail updateVisibility(UUID id, AppUser user, boolean isPublic) {
        Convention convention = accessGuard.requireAccess(id, user, ConventionAccessGuard.Permission.OWNER);
        convention.setIsPublic(isPublic);
        return toDetail(convention, user);
    }

    @Transactional
    public ConventionDtos.ConventionDetail fork(UUID originalId, AppUser caller) {
        Convention original = accessGuard.requireAccess(originalId, caller, ConventionAccessGuard.Permission.READ);
        Convention forked = original.fork(UUID.randomUUID(), caller);
        conventionRepository.save(forked);
        return toDetail(forked, caller);
    }

    // ── Like operations ────────────────────────────────────────────────────

    @Transactional
    public ConventionDtos.LikeResponse addLike(UUID conventionId, AppUser user) {
        Convention convention = accessGuard.requireAccess(conventionId, user, ConventionAccessGuard.Permission.READ);
        if (!likeRepository.existsByConventionAndUser(convention, user)) {
            likeRepository.save(new ConventionLike(convention, user));
        }
        long count = likeRepository.countByConvention(convention);
        return new ConventionDtos.LikeResponse(count, true);
    }

    @Transactional
    public ConventionDtos.LikeResponse removeLike(UUID conventionId, AppUser user) {
        Convention convention = accessGuard.requireAccess(conventionId, user, ConventionAccessGuard.Permission.READ);
        likeRepository.deleteByConventionAndUser(convention, user);
        long count = likeRepository.countByConvention(convention);
        return new ConventionDtos.LikeResponse(count, false);
    }

    // ── Share operations ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConventionDtos.ShareDto> listShares(UUID conventionId, AppUser user) {
        Convention convention = accessGuard.requireAccess(conventionId, user, ConventionAccessGuard.Permission.OWNER);
        return shareRepository.findByConvention(convention).stream()
                .map(s -> new ConventionDtos.ShareDto(
                        s.getSharedWith().getUsername(),
                        s.getSharedWith().getDisplayName(),
                        s.getPermission().name(),
                        s.getCreatedAt()))
                .toList();
    }

    @Transactional
    public ConventionDtos.ShareDto addShare(UUID conventionId, AppUser user, ConventionDtos.CreateShareRequest req) {
        Convention convention = accessGuard.requireAccess(conventionId, user, ConventionAccessGuard.Permission.OWNER);
        AppUser target = userRepository.findByUsername(req.username())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        ConventionShare.Permission perm;
        try {
            perm = ConventionShare.Permission.valueOf(req.permission().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid permission value");
        }
        ConventionShare share = shareRepository.findByConventionAndSharedWith(convention, target)
                .orElse(null);
        if (share == null) {
            share = new ConventionShare(convention, target, perm);
            shareRepository.save(share);
        } else {
            share.setPermission(perm);
        }
        return new ConventionDtos.ShareDto(
                target.getUsername(),
                target.getDisplayName(),
                share.getPermission().name(),
                share.getCreatedAt());
    }

    @Transactional
    public void removeShare(UUID conventionId, AppUser user, String username) {
        Convention convention = accessGuard.requireAccess(conventionId, user, ConventionAccessGuard.Permission.OWNER);
        AppUser target = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        shareRepository.deleteByConventionAndSharedWith(convention, target);
    }

    // ── Public gallery helper ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConventionDtos.ConventionSummary> getPublicConventions(String sort, @Nullable AppUser viewer) {
        List<Convention> conventions = switch (sort) {
            case "most_liked" -> conventionRepository.findAllPublicOrderByLikesDesc();
            default -> conventionRepository.findAllByIsPublicTrueOrderByUpdatedAtDesc();
        };

        List<UUID> ids = conventions.stream().map(Convention::getId).toList();
        Map<UUID, Long> likeCounts = buildLikeCountMap(ids);
        Map<UUID, Integer> forkCounts = buildForkCountMap(ids);
        List<UUID> likedIds = (viewer != null && !ids.isEmpty())
                ? conventionRepository.conventionIdsLikedByUser(ids, viewer)
                : List.of();

        return conventions.stream()
                .map(c -> toSummary(c, viewer, likeCounts, forkCounts, likedIds))
                .toList();
    }

    // ── Mapping ────────────────────────────────────────────────────────────

    public ConventionDtos.ConventionDetail toDetail(Convention c, @Nullable AppUser viewer) {
        JsonNode parameters;
        JsonNode root;
        try {
            parameters = objectMapper.readTree(c.getParametersJson());
        } catch (JsonProcessingException e) {
            parameters = objectMapper.createArrayNode();
        }
        try {
            root = objectMapper.readTree(c.getRootJson());
        } catch (JsonProcessingException e) {
            root = objectMapper.createObjectNode();
        }
        long likeCount = likeRepository.countByConvention(c);
        int forkCount = (int) conventionRepository.countByForkedFrom(c);
        Boolean likedByMe = viewer != null ? likeRepository.existsByConventionAndUser(c, viewer) : null;
        boolean ownedByMe = viewer != null && c.getOwner().getId().equals(viewer.getId());
        String permission = viewer != null ? permissionFor(c, viewer) : "NONE";
        ConventionDtos.ForkedFromRef forkedFromRef = null;
        if (c.getForkedFrom() != null) {
            Convention ff = c.getForkedFrom();
            forkedFromRef = new ConventionDtos.ForkedFromRef(ff.getId().toString(), ff.getName());
        }
        return new ConventionDtos.ConventionDetail(
                c.getId(),
                c.getName(),
                c.getDescription(),
                parameters,
                root,
                c.isPublic(),
                c.getOwner().getUsername(),
                ownedByMe,
                permission,
                forkedFromRef,
                c.getCreatedAt(),
                c.getUpdatedAt(),
                likeCount,
                forkCount,
                likedByMe
        );
    }

    private ConventionDtos.ConventionSummary toSummary(Convention c, @Nullable AppUser viewer,
                                                       Map<UUID, Long> likeCounts,
                                                       Map<UUID, Integer> forkCounts,
                                                       List<UUID> likedIds) {
        int paramCount = 0;
        try {
            JsonNode params = objectMapper.readTree(c.getParametersJson());
            if (params.isArray()) paramCount = params.size();
        } catch (JsonProcessingException ignored) {
        }
        long likeCount = likeCounts.getOrDefault(c.getId(), 0L);
        int forkCount = forkCounts.getOrDefault(c.getId(), 0);
        Boolean likedByMe = viewer != null ? likedIds.contains(c.getId()) : null;
        boolean ownedByMe = viewer != null && c.getOwner().getId().equals(viewer.getId());
        return new ConventionDtos.ConventionSummary(
                c.getId(),
                c.getName(),
                c.getDescription(),
                paramCount,
                c.getOwner().getUsername(),
                ownedByMe,
                c.isPublic(),
                c.getUpdatedAt(),
                likeCount,
                forkCount,
                likedByMe
        );
    }

    private String permissionFor(Convention c, AppUser viewer) {
        if (c.getOwner().getId().equals(viewer.getId())) return "OWNER";
        return shareRepository.findByConventionAndSharedWith(c, viewer)
                .map(ConventionShare::getPermission)
                .map(Enum::name)
                .orElse("NONE");
    }

    private Map<UUID, Long> buildLikeCountMap(List<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        Map<UUID, Long> map = new LinkedHashMap<>();
        for (Object[] row : conventionRepository.countsByConventionIds(ids)) {
            map.put((UUID) row[0], (Long) row[1]);
        }
        return map;
    }

    private Map<UUID, Integer> buildForkCountMap(List<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        Map<UUID, Integer> map = new LinkedHashMap<>();
        for (Object[] row : conventionRepository.forkCountsByConventionIds(ids)) {
            map.put((UUID) row[0], ((Long) row[1]).intValue());
        }
        return map;
    }
}
