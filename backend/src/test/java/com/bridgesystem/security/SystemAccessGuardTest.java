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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemAccessGuardTest {

    @Mock
    private BiddingSystemRepository systemRepository;

    @Mock
    private SystemShareRepository shareRepository;

    private SystemAccessGuard guard;

    private AppUser owner;
    private AppUser readSharer;
    private AppUser writeSharer;
    private AppUser stranger;
    private BiddingSystem system;
    private UUID systemId;

    @BeforeEach
    void setUp() {
        guard = new SystemAccessGuard(systemRepository, shareRepository);
        systemId = UUID.randomUUID();

        owner = new AppUser(UUID.randomUUID(), "owner", "Owner", randomHandle());
        readSharer = new AppUser(UUID.randomUUID(), "reader", "Reader", randomHandle());
        writeSharer = new AppUser(UUID.randomUUID(), "writer", "Writer", randomHandle());
        stranger = new AppUser(UUID.randomUUID(), "stranger", "Stranger", randomHandle());

        system = new BiddingSystem(systemId, owner, "Test System", "desc", "{\"children\":[]}");
    }

    // ── OWNER permission ───────────────────────────────────────────────────

    @Test
    void requireAccess_OWNER_ownerIsGranted() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));

        BiddingSystem result = guard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER);
        assertThat(result).isSameAs(system);
    }

    @Test
    void requireAccess_OWNER_readerIsDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));

        assertThatThrownBy(() -> guard.requireAccess(systemId, readSharer, SystemAccessGuard.Permission.OWNER))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Owner permission required");
    }

    @Test
    void requireAccess_OWNER_writerIsDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));

        assertThatThrownBy(() -> guard.requireAccess(systemId, writeSharer, SystemAccessGuard.Permission.OWNER))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void requireAccess_OWNER_strangerIsDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));

        assertThatThrownBy(() -> guard.requireAccess(systemId, stranger, SystemAccessGuard.Permission.OWNER))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── WRITE permission ───────────────────────────────────────────────────

    @Test
    void requireAccess_WRITE_ownerIsGranted() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));

        BiddingSystem result = guard.requireAccess(systemId, owner, SystemAccessGuard.Permission.WRITE);
        assertThat(result).isSameAs(system);
    }

    @Test
    void requireAccess_WRITE_writeSharerIsGranted() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));
        SystemShare share = new SystemShare(system, writeSharer, SystemShare.Permission.WRITE);
        when(shareRepository.findBySystemAndSharedWith(system, writeSharer))
                .thenReturn(Optional.of(share));

        BiddingSystem result = guard.requireAccess(systemId, writeSharer, SystemAccessGuard.Permission.WRITE);
        assertThat(result).isSameAs(system);
    }

    @Test
    void requireAccess_WRITE_readSharerIsDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));
        SystemShare share = new SystemShare(system, readSharer, SystemShare.Permission.READ);
        when(shareRepository.findBySystemAndSharedWith(system, readSharer))
                .thenReturn(Optional.of(share));

        assertThatThrownBy(() -> guard.requireAccess(systemId, readSharer, SystemAccessGuard.Permission.WRITE))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Write permission required");
    }

    @Test
    void requireAccess_WRITE_strangerIsDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));
        when(shareRepository.findBySystemAndSharedWith(system, stranger))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> guard.requireAccess(systemId, stranger, SystemAccessGuard.Permission.WRITE))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Not authorized");
    }

    // ── READ permission ────────────────────────────────────────────────────

    @Test
    void requireAccess_READ_ownerIsGranted() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));

        BiddingSystem result = guard.requireAccess(systemId, owner, SystemAccessGuard.Permission.READ);
        assertThat(result).isSameAs(system);
    }

    @Test
    void requireAccess_READ_readSharerIsGranted() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));
        SystemShare share = new SystemShare(system, readSharer, SystemShare.Permission.READ);
        when(shareRepository.findBySystemAndSharedWith(system, readSharer))
                .thenReturn(Optional.of(share));

        BiddingSystem result = guard.requireAccess(systemId, readSharer, SystemAccessGuard.Permission.READ);
        assertThat(result).isSameAs(system);
    }

    @Test
    void requireAccess_READ_writeSharerIsGranted() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));
        SystemShare share = new SystemShare(system, writeSharer, SystemShare.Permission.WRITE);
        when(shareRepository.findBySystemAndSharedWith(system, writeSharer))
                .thenReturn(Optional.of(share));

        BiddingSystem result = guard.requireAccess(systemId, writeSharer, SystemAccessGuard.Permission.READ);
        assertThat(result).isSameAs(system);
    }

    @Test
    void requireAccess_READ_strangerIsDenied() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.of(system));
        when(shareRepository.findBySystemAndSharedWith(system, stranger))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> guard.requireAccess(systemId, stranger, SystemAccessGuard.Permission.READ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Not authorized");
    }

    // ── System not found ───────────────────────────────────────────────────

    @Test
    void requireAccess_nonExistentSystem_throwsNotFound() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> guard.requireAccess(systemId, owner, SystemAccessGuard.Permission.READ))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void requireAccess_nonExistentSystem_404_forAnyPermission() {
        when(systemRepository.findById(systemId)).thenReturn(Optional.empty());

        for (SystemAccessGuard.Permission perm : SystemAccessGuard.Permission.values()) {
            assertThatThrownBy(() -> guard.requireAccess(systemId, stranger, perm))
                    .isInstanceOf(ResponseStatusException.class);
        }
    }

    private static byte[] randomHandle() {
        byte[] handle = new byte[32];
        new java.security.SecureRandom().nextBytes(handle);
        return handle;
    }
}
