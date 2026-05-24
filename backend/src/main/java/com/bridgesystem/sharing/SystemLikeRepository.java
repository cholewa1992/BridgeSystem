package com.bridgesystem.sharing;

import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemLikeRepository extends JpaRepository<SystemLike, Long> {

    long countBySystem(BiddingSystem system);

    Optional<SystemLike> findBySystemAndUser(BiddingSystem system, AppUser user);

    @Transactional
    void deleteBySystemAndUser(BiddingSystem system, AppUser user);

    boolean existsBySystemAndUser(BiddingSystem system, AppUser user);

    @Query("SELECT l.system.id, COUNT(l) FROM SystemLike l WHERE l.system.id IN :systemIds GROUP BY l.system.id")
    List<Object[]> countsBySystemIds(@Param("systemIds") List<UUID> systemIds);

    @Query("SELECT l.system.id FROM SystemLike l WHERE l.system.id IN :systemIds AND l.user = :user")
    List<UUID> systemIdsLikedByUser(@Param("systemIds") List<UUID> systemIds, @Param("user") AppUser user);
}
