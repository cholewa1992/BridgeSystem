package com.bridgesystem.system;

import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class UserProfileService {

    private final AppUserRepository userRepository;
    private final BiddingSystemRepository systemRepository;
    private final SystemSummaryMapper summaryMapper;

    public UserProfileService(AppUserRepository userRepository,
                              BiddingSystemRepository systemRepository,
                              SystemSummaryMapper summaryMapper) {
        this.userRepository = userRepository;
        this.systemRepository = systemRepository;
        this.summaryMapper = summaryMapper;
    }

    @Transactional(readOnly = true)
    public BiddingSystemDtos.UserProfileDto getUserProfile(String username) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        int publicCount = (int) systemRepository.countByOwnerAndIsPublicTrue(user);
        return new BiddingSystemDtos.UserProfileDto(
                user.getUsername(),
                user.getDisplayName(),
                user.getCreatedAt(),
                publicCount
        );
    }

    @Transactional(readOnly = true)
    public List<BiddingSystemDtos.SystemSummary> getPublicSystemsForUser(String username, @Nullable AppUser viewer) {
        AppUser owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        List<BiddingSystem> systems = systemRepository.findAllByOwnerAndIsPublicTrueOrderByUpdatedAtDesc(owner);
        Map<UUID, SystemSummaryMapper.SystemStats> stats = summaryMapper.statsFor(systems, viewer);
        return systems.stream()
                .map(s -> summaryMapper.toSummary(s, viewer, stats.get(s.getId())))
                .toList();
    }
}
