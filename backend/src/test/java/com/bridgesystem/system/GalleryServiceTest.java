package com.bridgesystem.system;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.security.SystemAccessGuard.Permission;
import com.bridgesystem.sharing.SystemLike;
import com.bridgesystem.sharing.SystemLikeRepository;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GalleryServiceTest {

    @Mock private BiddingSystemRepository systemRepository;
    @Mock private SystemLikeRepository likeRepository;
    @Mock private SystemShareRepository shareRepository;
    @Mock private SystemAccessGuard accessGuard;

    private GalleryService service;

    private AppUser user;
    private UUID systemId;
    private BiddingSystem system;

    @BeforeEach
    void setUp() {
        service = new GalleryService(systemRepository, likeRepository, shareRepository,
                accessGuard);

        user = new AppUser(UUID.randomUUID(), "alice", "Alice", new byte[32]);
        systemId = UUID.randomUUID();
        system = new BiddingSystem(systemId, user, "Test System", "desc", "{\"children\":[]}");
    }

    // ── getPublicSystems ──────────────────────────────────────────────────

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

    // ── helpers ───────────────────────────────────────────────────────────

    private static List<Object[]> likeCountRows(UUID id, long count) {
        ArrayList<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{id, count});
        return rows;
    }
}
