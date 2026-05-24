package com.bridgesystem.sharing;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.security.SystemAccessGuard.Permission;
import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

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
    private AppUser otherUser;
    private BiddingSystem system;
    private UUID systemId;

    @BeforeEach
    void setUp() {
        service = new SharingService(shareRepository, userRepository, accessGuard);

        owner = new AppUser(UUID.randomUUID(), "owner", "Owner", new byte[32]);
        otherUser = new AppUser(UUID.randomUUID(), "bob", "Bob", new byte[32]);
        systemId = UUID.randomUUID();
        system = new BiddingSystem(systemId, owner, "My System", "desc", "{\"children\":[]}");
    }

    // ── list ──────────────────────────────────────────────────────────────

    @Test
    void list_requiresOwner_returnsMappedShares() {
        SystemShare share = new SystemShare(system, otherUser, SystemShare.Permission.READ);
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(shareRepository.findBySystem(system)).thenReturn(List.of(share));

        List<SharingDtos.ShareDto> result = service.list(systemId, owner);

        verify(accessGuard).requireAccess(systemId, owner, Permission.OWNER);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).username()).isEqualTo("bob");
        assertThat(result.get(0).displayName()).isEqualTo("Bob");
        assertThat(result.get(0).permission()).isEqualTo("READ");
    }

    @Test
    void list_emptyShares_returnsEmptyList() {
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(shareRepository.findBySystem(system)).thenReturn(List.of());

        List<SharingDtos.ShareDto> result = service.list(systemId, owner);

        assertThat(result).isEmpty();
    }

    // ── add ───────────────────────────────────────────────────────────────

    @Test
    void add_newShare_savesAndReturnsDto() {
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(otherUser));
        when(shareRepository.findBySystemAndSharedWith(system, otherUser)).thenReturn(Optional.empty());
        SystemShare saved = new SystemShare(system, otherUser, SystemShare.Permission.READ);
        when(shareRepository.save(any(SystemShare.class))).thenReturn(saved);

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("bob", "READ");
        SharingDtos.ShareDto result = service.add(systemId, owner, req);

        ArgumentCaptor<SystemShare> captor = ArgumentCaptor.forClass(SystemShare.class);
        verify(shareRepository).save(captor.capture());
        assertThat(captor.getValue().getPermission()).isEqualTo(SystemShare.Permission.READ);
        assertThat(result.username()).isEqualTo("bob");
        assertThat(result.permission()).isEqualTo("READ");
    }

    @Test
    void add_existingShare_updatesPermissionInsteadOfSavingNew() {
        SystemShare existing = new SystemShare(system, otherUser, SystemShare.Permission.READ);
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(otherUser));
        when(shareRepository.findBySystemAndSharedWith(system, otherUser)).thenReturn(Optional.of(existing));
        when(shareRepository.save(existing)).thenReturn(existing);

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("bob", "WRITE");
        SharingDtos.ShareDto result = service.add(systemId, owner, req);

        verify(shareRepository, times(1)).save(existing);
        assertThat(existing.getPermission()).isEqualTo(SystemShare.Permission.WRITE);
        assertThat(result.permission()).isEqualTo("WRITE");
    }

    @Test
    void add_targetUserNotFound_throws404() {
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("nobody", "READ");

        assertThatThrownBy(() -> service.add(systemId, owner, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(NOT_FOUND));
    }

    @Test
    void add_sharingWithSelf_throwsBadRequest() {
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("owner", "READ");

        assertThatThrownBy(() -> service.add(systemId, owner, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(BAD_REQUEST))
                .hasMessageContaining("yourself");
    }

    @Test
    void add_invalidPermissionString_throwsBadRequest() {
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(otherUser));

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("bob", "ADMIN");

        assertThatThrownBy(() -> service.add(systemId, owner, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(BAD_REQUEST))
                .hasMessageContaining("Permission must be READ or WRITE");
    }

    @Test
    void add_permissionIsCaseInsensitive_succeeds() {
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(otherUser));
        when(shareRepository.findBySystemAndSharedWith(system, otherUser)).thenReturn(Optional.empty());
        SystemShare saved = new SystemShare(system, otherUser, SystemShare.Permission.WRITE);
        when(shareRepository.save(any(SystemShare.class))).thenReturn(saved);

        SharingDtos.CreateShare req = new SharingDtos.CreateShare("bob", "write");
        SharingDtos.ShareDto result = service.add(systemId, owner, req);

        assertThat(result.permission()).isEqualTo("WRITE");
    }

    // ── remove ────────────────────────────────────────────────────────────

    @Test
    void remove_requiresOwner_deletesShare() {
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(otherUser));

        service.remove(systemId, owner, "bob");

        verify(accessGuard).requireAccess(systemId, owner, Permission.OWNER);
        verify(shareRepository).deleteBySystemAndSharedWith(system, otherUser);
    }

    @Test
    void remove_targetUserNotFound_throws404() {
        when(accessGuard.requireAccess(systemId, owner, Permission.OWNER)).thenReturn(system);
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.remove(systemId, owner, "ghost"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(NOT_FOUND));
    }
}
