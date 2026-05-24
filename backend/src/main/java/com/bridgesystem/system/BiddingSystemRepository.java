package com.bridgesystem.system;

import com.bridgesystem.sharing.SystemLike;
import com.bridgesystem.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BiddingSystemRepository extends JpaRepository<BiddingSystem, UUID> {

    List<BiddingSystem> findByOwner(AppUser owner);

    @Query("""
            SELECT DISTINCT s FROM BiddingSystem s
            LEFT JOIN SystemShare sh ON sh.system = s
            WHERE s.owner.id = :userId OR sh.sharedWith.id = :userId
            ORDER BY s.updatedAt DESC
            """)
    List<BiddingSystem> findAccessibleBy(@Param("userId") UUID userId);

    List<BiddingSystem> findAllByIsPublicTrueOrderByUpdatedAtDesc();

    List<BiddingSystem> findAllByOwnerAndIsPublicTrueOrderByUpdatedAtDesc(AppUser owner);

    long countByForkedFrom(BiddingSystem original);

    @Query("""
            SELECT s FROM BiddingSystem s
            WHERE s.isPublic = true
            ORDER BY (SELECT COUNT(l) FROM SystemLike l WHERE l.system = s) DESC, s.updatedAt DESC
            """)
    List<BiddingSystem> findAllPublicOrderByLikesDesc();
}
