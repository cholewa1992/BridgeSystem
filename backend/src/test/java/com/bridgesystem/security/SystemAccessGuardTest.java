package com.bridgesystem.security;

import com.bridgesystem.sharing.SystemShare;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.system.BiddingSystemRepository;
import com.bridgesystem.user.AppUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@ExtendWith(MockitoExtension.class)
class SystemAccessGuardTest {

    @Mock
    private BiddingSystemRepository systemRepository;

    @Mock
    private SystemShareRepository shareRepository;

    private SystemAccessGuard guard;

    private AppUser owner;
    private AppUser otherUser;
    private BiddingSystem privateSystem;
    private BiddingSystem publicSystem;
    private UUID systemId;

    @BeforeEach
    void setUp() {
        guard = new SystemAccessGuard(systemRepository, shareRepository);

        owner = new AppUser(UUID.randomUUID(), "owner", "Owner User", new byte[32]);
        otherUser = new AppUser(UUID.randomUUID(), "other", "Other User", new byte[32]);

        systemId = UUID.randomUUID();
        privateSystem = new BiddingSystem(systemId, owner, "Private System", "desc", "{\"children\":[]}");
        publicSystem = new BiddingSystem(systemId, owner, "Public System", "desc", "{\"children\":[]}");
        publicSystem.setIsPublic(true);
    }

    // ── system not found ──────────────────────────────────────────────────

    @Test
    void systemNotFound_throws404() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> guard.requireAccess(systemId, owner, SystemAccessGuard.Permission.READ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(404));
    }

    // ── anonymous user ────────────────────────────────────────────────────

    @Test
    void anonymous_readPublicSystem_returnsSystem() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(publicSystem));

        BiddingSystem result = guard.requireAccess(systemId, null, SystemAccessGuard.Permission.READ);

        assertThat(result).isSameAs(publicSystem);
    }

    @Test
    void anonymous_readPrivateSystem_throwsAccessDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));

        assertThatThrownBy(() -> guard.requireAccess(systemId, null, SystemAccessGuard.Permission.READ))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void anonymous_writePermission_throwsAccessDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(publicSystem));

        assertThatThrownBy(() -> guard.requireAccess(systemId, null, SystemAccessGuard.Permission.WRITE))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void anonymous_ownerPermission_throwsAccessDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(publicSystem));

        assertThatThrownBy(() -> guard.requireAccess(systemId, null, SystemAccessGuard.Permission.OWNER))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── owner ─────────────────────────────────────────────────────────────

    @Test
    void owner_readPermission_succeeds() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));

        BiddingSystem result = guard.requireAccess(systemId, owner, SystemAccessGuard.Permission.READ);

        assertThat(result).isSameAs(privateSystem);
    }

    @Test
    void owner_writePermission_succeeds() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));

        BiddingSystem result = guard.requireAccess(systemId, owner, SystemAccessGuard.Permission.WRITE);

        assertThat(result).isSameAs(privateSystem);
    }

    @Test
    void owner_ownerPermission_succeeds() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));

        BiddingSystem result = guard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER);

        assertThat(result).isSameAs(privateSystem);
    }

    // ── non-owner, no share ───────────────────────────────────────────────

    @Test
    void nonOwner_noShare_readPrivate_throwsAccessDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));
        when(shareRepository.findBySystemAndSharedWith(privateSystem, otherUser)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> guard.requireAccess(systemId, otherUser, SystemAccessGuard.Permission.READ))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void nonOwner_noShare_readPublic_succeeds() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(publicSystem));

        BiddingSystem result = guard.requireAccess(systemId, otherUser, SystemAccessGuard.Permission.READ);

        assertThat(result).isSameAs(publicSystem);
    }

    @Test
    void nonOwner_noShare_write_throwsAccessDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));
        when(shareRepository.findBySystemAndSharedWith(privateSystem, otherUser)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> guard.requireAccess(systemId, otherUser, SystemAccessGuard.Permission.WRITE))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void nonOwner_noShare_owner_throwsAccessDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));

        assertThatThrownBy(() -> guard.requireAccess(systemId, otherUser, SystemAccessGuard.Permission.OWNER))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── non-owner with READ share ─────────────────────────────────────────

    @Test
    void nonOwner_readShare_readPrivate_succeeds() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));
        SystemShare readShare = new SystemShare(privateSystem, otherUser, SystemShare.Permission.READ);
        when(shareRepository.findBySystemAndSharedWith(privateSystem, otherUser)).thenReturn(Optional.of(readShare));

        BiddingSystem result = guard.requireAccess(systemId, otherUser, SystemAccessGuard.Permission.READ);

        assertThat(result).isSameAs(privateSystem);
    }

    @Test
    void nonOwner_readShare_write_throwsAccessDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));
        SystemShare readShare = new SystemShare(privateSystem, otherUser, SystemShare.Permission.READ);
        when(shareRepository.findBySystemAndSharedWith(privateSystem, otherUser)).thenReturn(Optional.of(readShare));

        assertThatThrownBy(() -> guard.requireAccess(systemId, otherUser, SystemAccessGuard.Permission.WRITE))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Write permission required");
    }

    // ── non-owner with WRITE share ────────────────────────────────────────

    @Test
    void nonOwner_writeShare_write_succeeds() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));
        SystemShare writeShare = new SystemShare(privateSystem, otherUser, SystemShare.Permission.WRITE);
        when(shareRepository.findBySystemAndSharedWith(privateSystem, otherUser)).thenReturn(Optional.of(writeShare));

        BiddingSystem result = guard.requireAccess(systemId, otherUser, SystemAccessGuard.Permission.WRITE);

        assertThat(result).isSameAs(privateSystem);
    }

    @Test
    void nonOwner_writeShare_read_succeeds() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(privateSystem));
        SystemShare writeShare = new SystemShare(privateSystem, otherUser, SystemShare.Permission.WRITE);
        when(shareRepository.findBySystemAndSharedWith(privateSystem, otherUser)).thenReturn(Optional.of(writeShare));

        BiddingSystem result = guard.requireAccess(systemId, otherUser, SystemAccessGuard.Permission.READ);

        assertThat(result).isSameAs(privateSystem);
    }
}
