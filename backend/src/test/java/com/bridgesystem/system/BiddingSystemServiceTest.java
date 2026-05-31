package com.bridgesystem.system;

import com.bridgesystem.convention.ConventionRepository;
import com.bridgesystem.convention.ConventionService;
import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.security.SystemAccessGuard.Permission;
import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@ExtendWith(MockitoExtension.class)
class BiddingSystemServiceTest {

    @Mock private BiddingSystemRepository systemRepository;
    @Mock private SystemShareRepository shareRepository;
    @Mock private SystemLikeRepository likeRepository;
    @Mock private SystemAccessGuard accessGuard;
    @Mock private ConventionRepository conventionRepository;
    @Mock private ConventionService conventionService;
    @Mock private SystemSummaryMapper summaryMapper;

    private ObjectMapper objectMapper;
    private BiddingSystemService service;

    private AppUser user;
    private UUID systemId;
    private BiddingSystem system;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new BiddingSystemService(
                systemRepository, shareRepository, likeRepository,
                accessGuard, objectMapper, conventionRepository, conventionService, summaryMapper);

        user = new AppUser(UUID.randomUUID(), "alice", "Alice", new byte[32]);
        systemId = UUID.randomUUID();
        system = new BiddingSystem(systemId, user, "Test System", "A description", "{\"children\":[]}");
    }

    // ── create ────────────────────────────────────────────────────────────

    @Test
    void create_savesNewSystemAndReturnsDetail() {
        when(systemRepository.save(any(BiddingSystem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(likeRepository.countBySystem(any())).thenReturn(0L);
        when(likeRepository.existsBySystemAndUser(any(), any())).thenReturn(false);
        when(systemRepository.countByForkedFrom(any())).thenReturn(0L);

        BiddingSystemDtos.CreateRequest req = new BiddingSystemDtos.CreateRequest("My System", "A nice system");
        BiddingSystemDtos.SystemDetail detail = service.create(user, req);

        assertThat(detail.name()).isEqualTo("My System");
        assertThat(detail.ownerUsername()).isEqualTo("alice");
        assertThat(detail.ownedByMe()).isTrue();
        ArgumentCaptor<BiddingSystem> captor = ArgumentCaptor.forClass(BiddingSystem.class);
        verify(systemRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("My System");
    }

    // ── get ───────────────────────────────────────────────────────────────

    @Test
    void get_delegatesToAccessGuardWithRead() {
        when(accessGuard.requireAccess(systemId, user, Permission.READ)).thenReturn(system);
        when(likeRepository.countBySystem(system)).thenReturn(5L);
        when(likeRepository.existsBySystemAndUser(system, user)).thenReturn(true);
        when(systemRepository.countByForkedFrom(system)).thenReturn(2L);

        BiddingSystemDtos.SystemDetail detail = service.get(systemId, user);

        verify(accessGuard).requireAccess(systemId, user, Permission.READ);
        assertThat(detail.name()).isEqualTo("Test System");
        assertThat(detail.likeCount()).isEqualTo(5L);
    }

    @Test
    void get_accessDenied_propagates() {
        when(accessGuard.requireAccess(systemId, user, Permission.READ))
                .thenThrow(new AccessDeniedException("Not authorized"));

        assertThatThrownBy(() -> service.get(systemId, user))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── update ────────────────────────────────────────────────────────────

    @Test
    void update_requiresWrite_setsNameAndDescription() {
        when(accessGuard.requireAccess(systemId, user, Permission.WRITE)).thenReturn(system);
        when(likeRepository.countBySystem(system)).thenReturn(0L);
        when(likeRepository.existsBySystemAndUser(system, user)).thenReturn(false);
        when(systemRepository.countByForkedFrom(system)).thenReturn(0L);

        BiddingSystemDtos.UpdateRequest req = new BiddingSystemDtos.UpdateRequest("New Name", "New Desc", null);
        BiddingSystemDtos.SystemDetail detail = service.update(systemId, user, req);

        verify(accessGuard).requireAccess(systemId, user, Permission.WRITE);
        assertThat(detail.name()).isEqualTo("New Name");
        assertThat(detail.description()).isEqualTo("New Desc");
    }

    @Test
    void update_withTree_serializesTreeJson() throws Exception {
        when(accessGuard.requireAccess(systemId, user, Permission.WRITE)).thenReturn(system);
        when(likeRepository.countBySystem(system)).thenReturn(0L);
        when(likeRepository.existsBySystemAndUser(system, user)).thenReturn(false);
        when(systemRepository.countByForkedFrom(system)).thenReturn(0L);

        JsonNode treeNode = objectMapper.readTree("{\"children\":[{\"bid\":\"1N\"}]}");
        BiddingSystemDtos.UpdateRequest req = new BiddingSystemDtos.UpdateRequest("Updated", "desc", treeNode);
        BiddingSystemDtos.SystemDetail detail = service.update(systemId, user, req);

        assertThat(system.getTreeJson()).contains("1N");
        assertThat(detail.tree()).isNotNull();
    }

    @Test
    void update_treeSerializationFailure_throwsBadRequest() throws Exception {
        ObjectMapper brokenMapper = mock(ObjectMapper.class);
        BiddingSystemService svcWithBrokenMapper = new BiddingSystemService(
                systemRepository, shareRepository, likeRepository,
                accessGuard, brokenMapper, conventionRepository, conventionService, summaryMapper);

        when(accessGuard.requireAccess(systemId, user, Permission.WRITE)).thenReturn(system);
        JsonNode treeNode = mock(JsonNode.class);
        when(treeNode.has("children")).thenReturn(true);
        when(brokenMapper.writeValueAsString(treeNode)).thenThrow(new JsonProcessingException("bad") {});

        BiddingSystemDtos.UpdateRequest req = new BiddingSystemDtos.UpdateRequest("Name", "desc", treeNode);

        assertThatThrownBy(() -> svcWithBrokenMapper.update(systemId, user, req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(BAD_REQUEST));
    }

    // ── delete ────────────────────────────────────────────────────────────

    @Test
    void delete_requiresOwner_callsRepositoryDelete() {
        when(accessGuard.requireAccess(systemId, user, Permission.OWNER)).thenReturn(system);
        when(systemRepository.countByForkedFrom(system)).thenReturn(0L);

        service.delete(systemId, user);

        verify(accessGuard).requireAccess(systemId, user, Permission.OWNER);
        verify(systemRepository).delete(system);
    }

    @Test
    void delete_withActiveForks_throwsConflict() {
        when(accessGuard.requireAccess(systemId, user, Permission.OWNER)).thenReturn(system);
        when(systemRepository.countByForkedFrom(system)).thenReturn(2L);

        assertThatThrownBy(() -> service.delete(systemId, user))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(409));
    }

    // ── updateVisibility ──────────────────────────────────────────────────

    @Test
    void updateVisibility_requiresOwner_flipsIsPublic() {
        when(accessGuard.requireAccess(systemId, user, Permission.OWNER)).thenReturn(system);
        when(likeRepository.countBySystem(system)).thenReturn(0L);
        when(likeRepository.existsBySystemAndUser(system, user)).thenReturn(false);
        when(systemRepository.countByForkedFrom(system)).thenReturn(0L);

        assertThat(system.isPublic()).isFalse();

        BiddingSystemDtos.SystemDetail detail = service.updateVisibility(systemId, user, true);

        verify(accessGuard).requireAccess(systemId, user, Permission.OWNER);
        assertThat(system.isPublic()).isTrue();
        assertThat(detail.isPublic()).isTrue();
    }

    // ── fork ─────────────────────────────────────────────────────────────

    @Test
    void fork_requiresRead_createsNewSystemWithForkSuffix() {
        AppUser forker = new AppUser(UUID.randomUUID(), "bob", "Bob", new byte[32]);
        when(accessGuard.requireAccess(systemId, forker, Permission.READ)).thenReturn(system);
        when(systemRepository.save(any(BiddingSystem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(likeRepository.countBySystem(any())).thenReturn(0L);
        when(likeRepository.existsBySystemAndUser(any(), any())).thenReturn(false);
        when(systemRepository.countByForkedFrom(any())).thenReturn(0L);

        BiddingSystemDtos.SystemDetail detail = service.fork(systemId, forker);

        assertThat(detail.name()).endsWith(" (fork)");
        assertThat(detail.forkedFrom()).isNotNull();
        assertThat(detail.forkedFrom().id()).isEqualTo(systemId.toString());
        assertThat(detail.ownerUsername()).isEqualTo("bob");
    }
}
