package com.bridgesystem.system;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.security.SystemAccessGuard.Permission;
import com.bridgesystem.sharing.SystemLike;
import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.sharing.SystemShare;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@ExtendWith(MockitoExtension.class)
class BiddingSystemServiceTest {

    @Mock
    private BiddingSystemRepository systemRepository;

    @Mock
    private SystemShareRepository shareRepository;

    @Mock
    private SystemLikeRepository likeRepository;

    @Mock
    private SystemAccessGuard accessGuard;

    @Mock
    private AppUserRepository userRepository;

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
                accessGuard, objectMapper, userRepository);

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
        // user == owner so permissionFor short-circuits to "OWNER" — no share lookup

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
        // user == owner so permissionFor short-circuits — no share lookup

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
        // user == owner so permissionFor short-circuits — no share lookup

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
        // user == owner so permissionFor short-circuits — no share lookup

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
                accessGuard, brokenMapper, userRepository);

        when(accessGuard.requireAccess(systemId, user, Permission.WRITE)).thenReturn(system);
        JsonNode treeNode = mock(JsonNode.class);
        // BidTree.from() checks has("children") — stub it to pass validation so we
        // reach the serialization step, where brokenMapper will then throw.
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
        // user == owner so permissionFor short-circuits — no share lookup

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
        // forker owns the new forked system, so permissionFor short-circuits to "OWNER" — no share lookup

        BiddingSystemDtos.SystemDetail detail = service.fork(systemId, forker);

        assertThat(detail.name()).endsWith(" (fork)");
        assertThat(detail.forkedFrom()).isNotNull();
        assertThat(detail.forkedFrom().id()).isEqualTo(systemId.toString());
        assertThat(detail.ownerUsername()).isEqualTo("bob");
    }

    // ── addLike ───────────────────────────────────────────────────────────

    @Test
    void addLike_whenNotAlreadyLiked_savesLikeAndReturnsCount() {
        when(accessGuard.requireAccess(systemId, user, Permission.READ)).thenReturn(system);
        when(likeRepository.existsBySystemAndUser(system, user)).thenReturn(false);
        when(likeRepository.save(any(SystemLike.class))).thenAnswer(inv -> inv.getArgument(0));
        when(likeRepository.countBySystem(system)).thenReturn(1L);

        BiddingSystemDtos.LikeResponse response = service.addLike(systemId, user);

        verify(likeRepository).save(any(SystemLike.class));
        assertThat(response.likeCount()).isEqualTo(1L);
        assertThat(response.likedByMe()).isTrue();
    }

    @Test
    void addLike_whenAlreadyLiked_doesNotSaveAgain() {
        when(accessGuard.requireAccess(systemId, user, Permission.READ)).thenReturn(system);
        when(likeRepository.existsBySystemAndUser(system, user)).thenReturn(true);
        when(likeRepository.countBySystem(system)).thenReturn(3L);

        BiddingSystemDtos.LikeResponse response = service.addLike(systemId, user);

        verify(likeRepository, never()).save(any());
        assertThat(response.likeCount()).isEqualTo(3L);
        assertThat(response.likedByMe()).isTrue();
    }

    // ── removeLike ────────────────────────────────────────────────────────

    @Test
    void removeLike_requiresRead_deletesAndReturnsLikedByMeFalse() {
        when(accessGuard.requireAccess(systemId, user, Permission.READ)).thenReturn(system);
        when(likeRepository.countBySystem(system)).thenReturn(0L);

        BiddingSystemDtos.LikeResponse response = service.removeLike(systemId, user);

        verify(likeRepository).deleteBySystemAndUser(system, user);
        assertThat(response.likedByMe()).isFalse();
        assertThat(response.likeCount()).isEqualTo(0L);
    }

    // ── getPublicSystems ──────────────────────────────────────────────────

    private static List<Object[]> likeCountRows(UUID id, long count) {
        java.util.ArrayList<Object[]> rows = new java.util.ArrayList<>();
        rows.add(new Object[]{id, count});
        return rows;
    }

    @Test
    void getPublicSystems_mostLiked_callsFindAllPublicOrderByLikesDesc() {
        when(systemRepository.findAllPublicOrderByLikesDesc()).thenReturn(List.of(system));
        when(likeRepository.countsBySystemIds(any())).thenReturn(likeCountRows(systemId, 0L));
        when(systemRepository.forkCountsBySystemIds(any())).thenReturn(List.of());

        List<BiddingSystemDtos.SystemSummary> result = service.getPublicSystems("most_liked", null);

        verify(systemRepository).findAllPublicOrderByLikesDesc();
        assertThat(result).hasSize(1);
    }

    @Test
    void getPublicSystems_otherSort_callsFindAllByIsPublicTrue() {
        when(systemRepository.findAllByIsPublicTrueOrderByUpdatedAtDesc()).thenReturn(List.of(system));
        when(likeRepository.countsBySystemIds(any())).thenReturn(likeCountRows(systemId, 0L));
        when(systemRepository.forkCountsBySystemIds(any())).thenReturn(List.of());

        List<BiddingSystemDtos.SystemSummary> result = service.getPublicSystems("recent", null);

        verify(systemRepository).findAllByIsPublicTrueOrderByUpdatedAtDesc();
        assertThat(result).hasSize(1);
    }

    // ── getPublicSystemsForUser ────────────────────────────────────────────

    @Test
    void getPublicSystemsForUser_unknownUsername_throws404() {
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getPublicSystemsForUser("nobody", null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(NOT_FOUND));
    }

    @Test
    void getPublicSystemsForUser_knownUser_returnsSystems() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(systemRepository.findAllByOwnerAndIsPublicTrueOrderByUpdatedAtDesc(user)).thenReturn(List.of(system));
        when(likeRepository.countsBySystemIds(any())).thenReturn(likeCountRows(systemId, 0L));
        when(systemRepository.forkCountsBySystemIds(any())).thenReturn(List.of());

        List<BiddingSystemDtos.SystemSummary> result = service.getPublicSystemsForUser("alice", null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).ownerUsername()).isEqualTo("alice");
    }

    // ── getUserProfile ────────────────────────────────────────────────────

    @Test
    void getUserProfile_unknownUsername_throws404() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getUserProfile("ghost"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(NOT_FOUND));
    }

    @Test
    void getUserProfile_knownUser_returnsProfileWithCorrectPublicCount() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(systemRepository.countByOwnerAndIsPublicTrue(user)).thenReturn(1L);

        BiddingSystemDtos.UserProfileDto profile = service.getUserProfile("alice");

        assertThat(profile.username()).isEqualTo("alice");
        assertThat(profile.displayName()).isEqualTo("Alice");
        assertThat(profile.publicSystemCount()).isEqualTo(1);
    }
}
