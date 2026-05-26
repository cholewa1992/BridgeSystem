package com.bridgesystem.convention;

import com.bridgesystem.user.AppUser;
import org.springframework.lang.Nullable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Centralized authorization for convention operations. All controllers
 * should funnel through this rather than re-implementing the ownership /
 * sharing check inline.
 */
@Component
public class ConventionAccessGuard {

    public enum Permission { READ, WRITE, OWNER }

    private final ConventionRepository conventionRepository;
    private final ConventionShareRepository shareRepository;

    public ConventionAccessGuard(ConventionRepository conventionRepository,
                                 ConventionShareRepository shareRepository) {
        this.conventionRepository = conventionRepository;
        this.shareRepository = shareRepository;
    }

    @Transactional(readOnly = true)
    public Convention requireAccess(UUID conventionId, @Nullable AppUser user, Permission required) {
        Convention convention = conventionRepository.findById(conventionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Convention not found"));

        // Anonymous users may only read public conventions; all mutations require auth.
        if (user == null) {
            if (required == Permission.READ && convention.isPublic()) {
                return convention;
            }
            throw new AccessDeniedException("Not authenticated");
        }

        boolean isOwner = convention.getOwner().getId().equals(user.getId());

        switch (required) {
            case OWNER:
                if (!isOwner) throw new AccessDeniedException("Owner permission required");
                break;
            case WRITE:
                if (isOwner) break;
                ConventionShare share = shareRepository.findByConventionAndSharedWith(convention, user)
                        .orElseThrow(() -> new AccessDeniedException("Not authorized"));
                if (share.getPermission() != ConventionShare.Permission.WRITE) {
                    throw new AccessDeniedException("Write permission required");
                }
                break;
            case READ:
                if (isOwner) break;
                if (convention.isPublic()) break;
                shareRepository.findByConventionAndSharedWith(convention, user)
                        .orElseThrow(() -> new AccessDeniedException("Not authorized"));
                break;
        }

        return convention;
    }
}
