package com.bridgesystem.sharing;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class SharingService {

    private final SystemShareRepository shareRepository;
    private final AppUserRepository userRepository;
    private final SystemAccessGuard accessGuard;

    public SharingService(SystemShareRepository shareRepository,
                          AppUserRepository userRepository,
                          SystemAccessGuard accessGuard) {
        this.shareRepository = shareRepository;
        this.userRepository = userRepository;
        this.accessGuard = accessGuard;
    }

    @Transactional(readOnly = true)
    public List<SharingDtos.ShareDto> list(UUID systemId, AppUser caller) {
        BiddingSystem system = accessGuard.requireAccess(systemId, caller, SystemAccessGuard.Permission.OWNER);
        return shareRepository.findBySystem(system).stream()
                .map(SharingService::toDto)
                .toList();
    }

    @Transactional
    public SharingDtos.ShareDto add(UUID systemId, AppUser caller, SharingDtos.CreateShare req) {
        BiddingSystem system = accessGuard.requireAccess(systemId, caller, SystemAccessGuard.Permission.OWNER);
        AppUser target = userRepository.findByUsername(req.username())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No such user: " + req.username()));
        if (target.getId().equals(caller.getId())) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot share a system with yourself");
        }
        SystemShare.Permission permission;
        try {
            permission = SystemShare.Permission.valueOf(req.permission().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, "Permission must be READ or WRITE");
        }

        SystemShare share = shareRepository.findBySystemAndSharedWith(system, target)
                .map(existing -> {
                    existing.setPermission(permission);
                    return shareRepository.save(existing);
                })
                .orElseGet(() -> shareRepository.save(new SystemShare(system, target, permission)));

        return toDto(share);
    }

    @Transactional
    public void remove(UUID systemId, AppUser caller, String username) {
        BiddingSystem system = accessGuard.requireAccess(systemId, caller, SystemAccessGuard.Permission.OWNER);
        AppUser target = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No such user: " + username));
        shareRepository.deleteBySystemAndSharedWith(system, target);
    }

    private static SharingDtos.ShareDto toDto(SystemShare share) {
        return new SharingDtos.ShareDto(
                share.getSharedWith().getUsername(),
                share.getSharedWith().getDisplayName(),
                share.getPermission().name(),
                share.getCreatedAt()
        );
    }
}
