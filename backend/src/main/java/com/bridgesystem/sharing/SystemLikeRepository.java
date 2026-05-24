package com.bridgesystem.sharing;

import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface SystemLikeRepository extends JpaRepository<SystemLike, Long> {

    long countBySystem(BiddingSystem system);

    Optional<SystemLike> findBySystemAndUser(BiddingSystem system, AppUser user);

    @Transactional
    void deleteBySystemAndUser(BiddingSystem system, AppUser user);

    boolean existsBySystemAndUser(BiddingSystem system, AppUser user);
}
