package com.bridgesystem.sharing;

import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemShareRepository extends JpaRepository<SystemShare, Long> {

    List<SystemShare> findBySystem(BiddingSystem system);

    Optional<SystemShare> findBySystemAndSharedWith(BiddingSystem system, AppUser sharedWith);

    void deleteBySystemAndSharedWith(BiddingSystem system, AppUser sharedWith);
}
