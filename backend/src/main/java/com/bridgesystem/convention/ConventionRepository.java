package com.bridgesystem.convention;

import com.bridgesystem.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConventionRepository extends JpaRepository<Convention, UUID> {

    List<Convention> findByOwnerOrderByUpdatedAtDesc(AppUser owner);

    @Query("SELECT cs.convention FROM ConventionShare cs WHERE cs.sharedWith = :user ORDER BY cs.convention.updatedAt DESC")
    List<Convention> findSharedWith(@Param("user") AppUser user);

    List<Convention> findAllByIsPublicTrueOrderByUpdatedAtDesc();

    @Query("""
            SELECT c FROM Convention c
            WHERE c.isPublic = true
            ORDER BY (SELECT COUNT(cl) FROM ConventionLike cl WHERE cl.convention = c) DESC, c.updatedAt DESC
            """)
    List<Convention> findAllPublicOrderByLikesDesc();

    @Query("SELECT cl.convention.id, COUNT(cl) FROM ConventionLike cl WHERE cl.convention.id IN :ids GROUP BY cl.convention.id")
    List<Object[]> countsByConventionIds(@Param("ids") List<UUID> ids);

    @Query("SELECT cl.convention.id FROM ConventionLike cl WHERE cl.convention.id IN :ids AND cl.user = :user")
    List<UUID> conventionIdsLikedByUser(@Param("ids") List<UUID> ids, @Param("user") AppUser user);

    @Query("SELECT c.id, COUNT(c2) FROM Convention c LEFT JOIN Convention c2 ON c2.forkedFrom = c WHERE c.id IN :ids GROUP BY c.id")
    List<Object[]> forkCountsByConventionIds(@Param("ids") List<UUID> ids);

    long countByForkedFrom(Convention original);
}
