package com.bridgesystem.system;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.sharing.SystemLike;
import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.sharing.SystemShare;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class BiddingSystemService {

    private static final String EMPTY_TREE = "{\"children\":[]}";

    private final BiddingSystemRepository systemRepository;
    private final SystemShareRepository shareRepository;
    private final SystemLikeRepository likeRepository;
    private final SystemAccessGuard accessGuard;
    private final ObjectMapper objectMapper;
    private final AppUserRepository userRepository;

    public BiddingSystemService(BiddingSystemRepository systemRepository,
                                SystemShareRepository shareRepository,
                                SystemLikeRepository likeRepository,
                                SystemAccessGuard accessGuard,
                                ObjectMapper objectMapper,
                                AppUserRepository userRepository) {
        this.systemRepository = systemRepository;
        this.shareRepository = shareRepository;
        this.likeRepository = likeRepository;
        this.accessGuard = accessGuard;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<BiddingSystemDtos.SystemSummary> listAccessible(AppUser user) {
        return systemRepository.findAccessibleBy(user.getId()).stream()
                .map(s -> toSummary(s, user))
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
        system.setName(req.name());
        system.setDescription(req.description());
        if (req.tree() != null) {
            try {
                system.setTreeJson(objectMapper.writeValueAsString(req.tree()));
            } catch (JsonProcessingException e) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid tree JSON", e);
            }
        }
        return toDetail(system, user);
    }

    @Transactional
    public void delete(UUID id, AppUser user) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.OWNER);
        systemRepository.delete(system);
    }

    @Transactional
    public BiddingSystemDtos.SystemDetail updateVisibility(UUID id, AppUser user, boolean isPublic) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.OWNER);
        system.setIsPublic(isPublic);
        return toDetail(system, user);
    }

    @Transactional
    public BiddingSystemDtos.SystemDetail fork(UUID originalId, AppUser caller) {
        BiddingSystem original = accessGuard.requireAccess(originalId, caller, SystemAccessGuard.Permission.READ);
        BiddingSystem forked = new BiddingSystem(
                UUID.randomUUID(),
                caller,
                original.getName() + " (fork)",
                original.getDescription(),
                original.getTreeJson(),
                original
        );
        systemRepository.save(forked);
        return toDetail(forked, caller);
    }

    @Transactional(readOnly = true)
    public List<BiddingSystemDtos.SystemSummary> getPublicSystems(String sort, @Nullable AppUser viewer) {
        List<BiddingSystem> systems = switch (sort) {
            case "most_liked" -> systemRepository.findAllPublicOrderByLikesDesc();
            default -> systemRepository.findAllByIsPublicTrueOrderByUpdatedAtDesc();
        };
        return systems.stream()
                .map(s -> toSummary(s, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BiddingSystemDtos.SystemSummary> getPublicSystemsForUser(String username, @Nullable AppUser viewer) {
        AppUser owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        return systemRepository.findAllByOwnerAndIsPublicTrueOrderByUpdatedAtDesc(owner).stream()
                .map(s -> toSummary(s, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public BiddingSystemDtos.UserProfileDto getUserProfile(String username) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        int publicCount = systemRepository.findAllByOwnerAndIsPublicTrueOrderByUpdatedAtDesc(user).size();
        return new BiddingSystemDtos.UserProfileDto(
                user.getUsername(),
                user.getDisplayName(),
                user.getCreatedAt(),
                publicCount
        );
    }

    // ── Like operations ────────────────────────────────────────────────────

    @Transactional
    public BiddingSystemDtos.LikeResponse addLike(UUID systemId, AppUser user) {
        BiddingSystem system = accessGuard.requireAccess(systemId, user, SystemAccessGuard.Permission.READ);
        if (!likeRepository.existsBySystemAndUser(system, user)) {
            likeRepository.save(new SystemLike(system, user));
        }
        long count = likeRepository.countBySystem(system);
        return new BiddingSystemDtos.LikeResponse(count, true);
    }

    @Transactional
    public BiddingSystemDtos.LikeResponse removeLike(UUID systemId, AppUser user) {
        BiddingSystem system = accessGuard.requireAccess(systemId, user, SystemAccessGuard.Permission.READ);
        likeRepository.deleteBySystemAndUser(system, user);
        long count = likeRepository.countBySystem(system);
        return new BiddingSystemDtos.LikeResponse(count, false);
    }

    // ── Mapping ────────────────────────────────────────────────────────────

    private BiddingSystemDtos.SystemSummary toSummary(BiddingSystem s, @Nullable AppUser viewer) {
        long likeCount = likeRepository.countBySystem(s);
        int forkCount = (int) systemRepository.countByForkedFrom(s);
        Boolean likedByMe = viewer != null ? likeRepository.existsBySystemAndUser(s, viewer) : null;
        boolean ownedByMe = viewer != null && s.getOwner().getId().equals(viewer.getId());
        String permission = viewer != null ? permissionFor(s, viewer) : "NONE";
        return new BiddingSystemDtos.SystemSummary(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getOwner().getUsername(),
                ownedByMe,
                permission,
                s.getUpdatedAt(),
                s.isPublic(),
                likeCount,
                forkCount,
                likedByMe
        );
    }

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
        String permission = viewer != null ? permissionFor(s, viewer) : "NONE";
        BiddingSystemDtos.ForkedFromRef forkedFromRef = null;
        if (s.getForkedFrom() != null) {
            BiddingSystem ff = s.getForkedFrom();
            forkedFromRef = new BiddingSystemDtos.ForkedFromRef(
                    ff.getId().toString(),
                    ff.getName(),
                    ff.getOwner().getUsername()
            );
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
                forkedFromRef
        );
    }

    private String permissionFor(BiddingSystem s, AppUser viewer) {
        if (s.getOwner().getId().equals(viewer.getId())) return "OWNER";
        return shareRepository.findBySystemAndSharedWith(s, viewer)
                .map(SystemShare::getPermission)
                .map(Enum::name)
                .orElse("NONE");
    }
}
