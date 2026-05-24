package com.bridgesystem.system;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.sharing.SystemLike;
import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.sharing.SystemShare;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GalleryService {

    private record SystemStats(long likeCount, int forkCount, Boolean likedByMe) {}

    private final BiddingSystemRepository systemRepository;
    private final SystemLikeRepository likeRepository;
    private final SystemShareRepository shareRepository;
    private final SystemAccessGuard accessGuard;
    private final ObjectMapper objectMapper;

    public GalleryService(BiddingSystemRepository systemRepository,
                          SystemLikeRepository likeRepository,
                          SystemShareRepository shareRepository,
                          SystemAccessGuard accessGuard,
                          ObjectMapper objectMapper) {
        this.systemRepository = systemRepository;
        this.likeRepository = likeRepository;
        this.shareRepository = shareRepository;
        this.accessGuard = accessGuard;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<BiddingSystemDtos.SystemSummary> getPublicSystems(String sort, @Nullable AppUser viewer) {
        List<BiddingSystem> systems = switch (sort) {
            case "most_liked" -> systemRepository.findAllPublicOrderByLikesDesc();
            default -> systemRepository.findAllByIsPublicTrueOrderByUpdatedAtDesc();
        };
        Map<UUID, SystemStats> stats = statsFor(systems, viewer);
        return systems.stream()
                .map(s -> toSummary(s, viewer, stats.get(s.getId())))
                .toList();
    }

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

    // ── Private helpers ────────────────────────────────────────────────────

    private Map<UUID, SystemStats> statsFor(List<BiddingSystem> systems, @Nullable AppUser viewer) {
        if (systems.isEmpty()) return Map.of();
        List<UUID> ids = systems.stream().map(BiddingSystem::getId).toList();
        Map<UUID, Long> likeCounts = likeRepository.countsBySystemIds(ids).stream()
                .collect(Collectors.toMap(r -> (UUID) r[0], r -> (Long) r[1]));
        Map<UUID, Long> forkCounts = systemRepository.forkCountsBySystemIds(ids).stream()
                .collect(Collectors.toMap(r -> (UUID) r[0], r -> (Long) r[1]));
        Set<UUID> likedIds = viewer != null
                ? new HashSet<>(likeRepository.systemIdsLikedByUser(ids, viewer))
                : Set.of();
        return systems.stream().collect(Collectors.toMap(
                BiddingSystem::getId,
                s -> new SystemStats(
                        likeCounts.getOrDefault(s.getId(), 0L),
                        (int) (long) forkCounts.getOrDefault(s.getId(), 0L),
                        viewer != null ? likedIds.contains(s.getId()) : null
                )
        ));
    }

    private BiddingSystemDtos.SystemSummary toSummary(BiddingSystem s, @Nullable AppUser viewer, SystemStats stats) {
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
                stats.likeCount(),
                stats.forkCount(),
                stats.likedByMe()
        );
    }

    private String permissionFor(BiddingSystem s, AppUser viewer) {
        if (s.getOwner().getId().equals(viewer.getId())) return "OWNER";
        return shareRepository.findBySystemAndSharedWith(s, viewer)
                .map(SystemShare::getPermission)
                .map(Enum::name)
                .orElse(s.isPublic() ? "READ" : "NONE");
    }
}
