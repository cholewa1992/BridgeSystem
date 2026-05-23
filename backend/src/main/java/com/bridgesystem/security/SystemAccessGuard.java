package com.bridgesystem.security;

import com.bridgesystem.sharing.SystemShare;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.system.BiddingSystemRepository;
import com.bridgesystem.user.AppUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Centralized authorization for bidding-system operations. All controllers
 * should funnel through this rather than re-implementing the ownership /
 * sharing check inline.
 */
@Component
public class SystemAccessGuard {

    public enum Permission { READ, WRITE, OWNER }

    private final BiddingSystemRepository systemRepository;
    private final SystemShareRepository shareRepository;

    public SystemAccessGuard(BiddingSystemRepository systemRepository,
                             SystemShareRepository shareRepository) {
        this.systemRepository = systemRepository;
        this.shareRepository = shareRepository;
    }

    @Transactional(readOnly = true)
    public BiddingSystem requireAccess(UUID systemId, AppUser user, Permission required) {
        BiddingSystem system = systemRepository.findById(systemId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "System not found"));

        boolean isOwner = system.getOwner().getId().equals(user.getId());

        switch (required) {
            case OWNER:
                if (!isOwner) throw new AccessDeniedException("Owner permission required");
                break;
            case WRITE:
                if (isOwner) break;
                SystemShare share = shareRepository.findBySystemAndSharedWith(system, user)
                        .orElseThrow(() -> new AccessDeniedException("Not authorized"));
                if (share.getPermission() != SystemShare.Permission.WRITE) {
                    throw new AccessDeniedException("Write permission required");
                }
                break;
            case READ:
                if (isOwner) break;
                shareRepository.findBySystemAndSharedWith(system, user)
                        .orElseThrow(() -> new AccessDeniedException("Not authorized"));
                break;
        }

        return system;
    }
}
