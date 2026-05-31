package com.bridgesystem.system;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.sharing.SystemLike;
import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.user.AppUser;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GalleryService {

    private final BiddingSystemRepository systemRepository;
    private final SystemLikeRepository likeRepository;
    private final SystemAccessGuard accessGuard;
    private final SystemSummaryMapper summaryMapper;

    public GalleryService(BiddingSystemRepository systemRepository,
                          SystemLikeRepository likeRepository,
                          SystemAccessGuard accessGuard,
                          SystemSummaryMapper summaryMapper) {
        this.systemRepository = systemRepository;
        this.likeRepository = likeRepository;
        this.accessGuard = accessGuard;
        this.summaryMapper = summaryMapper;
    }

    @Transactional(readOnly = true)
    public List<BiddingSystemDtos.SystemSummary> getPublicSystems(String sort, @Nullable AppUser viewer) {
        List<BiddingSystem> systems = switch (sort) {
            case "most_liked" -> systemRepository.findAllPublicOrderByLikesDesc();
            default -> systemRepository.findAllByIsPublicTrueOrderByUpdatedAtDesc();
        };
        Map<UUID, SystemSummaryMapper.SystemStats> stats = summaryMapper.statsFor(systems, viewer);
        return systems.stream()
                .map(s -> summaryMapper.toSummary(s, viewer, stats.get(s.getId())))
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
}
