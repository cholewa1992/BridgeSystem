package com.bridgesystem.system;

import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock private AppUserRepository userRepository;
    @Mock private BiddingSystemRepository systemRepository;
    @Mock private SystemLikeRepository likeRepository;
    @Mock private SystemShareRepository shareRepository;

    private UserProfileService service;

    private AppUser user;
    private UUID systemId;
    private BiddingSystem system;

    @BeforeEach
    void setUp() {
        service = new UserProfileService(userRepository, systemRepository, likeRepository,
                shareRepository, new ObjectMapper());

        user = new AppUser(UUID.randomUUID(), "alice", "Alice", new byte[32]);
        systemId = UUID.randomUUID();
        system = new BiddingSystem(systemId, user, "Test System", "desc", "{\"children\":[]}");
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

    // ── getPublicSystemsForUser ───────────────────────────────────────────

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

    // ── helpers ───────────────────────────────────────────────────────────

    private static List<Object[]> likeCountRows(UUID id, long count) {
        ArrayList<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{id, count});
        return rows;
    }
}
