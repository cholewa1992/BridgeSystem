package com.bridgesystem.convention;

import com.bridgesystem.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConventionLikeRepository extends JpaRepository<ConventionLike, Long> {

    boolean existsByConventionAndUser(Convention convention, AppUser user);

    long countByConvention(Convention convention);

    @Transactional
    void deleteByConventionAndUser(Convention convention, AppUser user);

    @Query("SELECT cl.convention.id, COUNT(cl) FROM ConventionLike cl WHERE cl.convention.id IN :ids GROUP BY cl.convention.id")
    List<Object[]> countsByConventionIds(@Param("ids") List<UUID> ids);

    @Query("SELECT cl.convention.id FROM ConventionLike cl WHERE cl.convention.id IN :ids AND cl.user = :user")
    List<UUID> conventionIdsLikedByUser(@Param("ids") List<UUID> ids, @Param("user") AppUser user);
}
