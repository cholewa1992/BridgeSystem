package com.bridgesystem.sharing;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SharingServiceTest {

    @Mock
    private SystemShareRepository shareRepository;

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private SystemAccessGuard accessGuard;

    private SharingService service;

    private AppUser owner;
    private AppUser target;
    private BiddingSystem system;

    @BeforeEach
    void setUp() {
        service = new SharingService(shareRepository, userRepository, accessGuard);

        owner = new AppUser(UUID.randomUUID(), "owner", "Owner", randomHandle());
        target = new AppUser(UUID.randomUUID(), "target", "Target", randomHandle());
        system = new BiddingSystem(UUID.randomUUID(), owner, "System", "desc", "{}");
    }

    // ── list ───────────────────────────────────────────────────────────────

    @Test
    void list_requiresOwnerPermission() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(shareRepository.findBySystem(system)).thenReturn(List.of());

        service.list(systemId, owner);

        verify(accessGuard).requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER);
    }

    @Test
    void list_returnsShares() {
        UUID systemId = system.getId();
        SystemShare share = new SystemShare(system, target, SystemShare.Permission.READ);
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(shareRepository.findBySystem(system)).thenReturn(List.of(share));

        List<SharingDtos.ShareDto> result = service.list(systemId, owner);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).username()).isEqualTo("target");
        assertThat(result.get(0).displayName()).isEqualTo("Target");
        assertThat(result.get(0).permission()).isEqualTo("READ");
    }

    // ── add ────────────────────────────────────────────────────────────────

    @Test
    void add_requiresOwnerPermission() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("target")).thenReturn(Optional.of(target));

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("target", "READ");
        when(shareRepository.findBySystemAndSharedWith(system, target)).thenReturn(Optional.empty());
        when(shareRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.add(systemId, owner, req);

        verify(accessGuard).requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER);
    }

    @Test
    void add_userNotFound_throwsNotFound() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("nobody", "READ");

        assertThatThrownBy(() -> service.add(systemId, owner, req))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void add_shareWithSelf_throwsBadRequest() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("owner", "READ");

        assertThatThrownBy(() -> service.add(systemId, owner, req))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void add_invalidPermission_throwsBadRequest() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("target")).thenReturn(Optional.of(target));

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("target", "ADMIN");

        assertThatThrownBy(() -> service.add(systemId, owner, req))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void add_createsNewShare() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("target")).thenReturn(Optional.of(target));
        when(shareRepository.findBySystemAndSharedWith(system, target)).thenReturn(Optional.empty());
        when(shareRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("target", "WRITE");
        SharingDtos.ShareDto result = service.add(systemId, owner, req);

        assertThat(result.username()).isEqualTo("target");
        assertThat(result.permission()).isEqualTo("WRITE");
        verify(shareRepository).save(argThat(share ->
                share.getPermission() == SystemShare.Permission.WRITE
        ));
    }

    @Test
    void add_upsertsExistingShare() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("target")).thenReturn(Optional.of(target));

        SystemShare existing = new SystemShare(system, target, SystemShare.Permission.READ);
        when(shareRepository.findBySystemAndSharedWith(system, target)).thenReturn(Optional.of(existing));

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("target", "WRITE");
        SharingDtos.ShareDto result = service.add(systemId, owner, req);

        assertThat(result.permission()).isEqualTo("WRITE");
        assertThat(existing.getPermission()).isEqualTo(SystemShare.Permission.WRITE);
        verify(shareRepository, never()).save(any());
    }

    // ── remove ─────────────────────────────────────────────────────────────

    @Test
    void remove_requiresOwnerPermission() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("target")).thenReturn(Optional.of(target));

        service.remove(systemId, owner, "target");

        verify(accessGuard).requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER);
    }

    @Test
    void remove_userNotFound_throwsNotFound() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.remove(systemId, owner, "nobody"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void remove_deletesShare() {
        UUID systemId = system.getId();
        when(accessGuard.requireAccess(systemId, owner, SystemAccessGuard.Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("target")).thenReturn(Optional.of(target));

        service.remove(systemId, owner, "target");

        verify(shareRepository).deleteBySystemAndSharedWith(system, target);
    }

    private static byte[] randomHandle() {
        byte[] handle = new byte[32];
        new java.security.SecureRandom().nextBytes(handle);
        return handle;
    }
}
