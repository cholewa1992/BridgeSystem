package com.bridgesystem.system;

import com.bridgesystem.sharing.SystemShare;
import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class SystemSummaryMapper {

    record SystemStats(long likeCount, int forkCount, Boolean likedByMe) {}

    private final SystemLikeRepository likeRepository;
    private final BiddingSystemRepository systemRepository;
    private final SystemShareRepository shareRepository;

    public SystemSummaryMapper(SystemLikeRepository likeRepository,
                               BiddingSystemRepository systemRepository,
                               SystemShareRepository shareRepository) {
        this.likeRepository = likeRepository;
        this.systemRepository = systemRepository;
        this.shareRepository = shareRepository;
    }

    Map<UUID, SystemStats> statsFor(List<BiddingSystem> systems, @Nullable AppUser viewer) {
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

    BiddingSystemDtos.SystemSummary toSummary(BiddingSystem s, @Nullable AppUser viewer, SystemStats stats) {
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

    String permissionFor(BiddingSystem s, AppUser viewer) {
        if (s.getOwner().getId().equals(viewer.getId())) return "OWNER";
        return shareRepository.findBySystemAndSharedWith(s, viewer)
                .map(SystemShare::getPermission)
                .map(Enum::name)
                .orElse(s.isPublic() ? "READ" : "NONE");
    }
}
