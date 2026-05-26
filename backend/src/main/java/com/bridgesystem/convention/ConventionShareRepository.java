package com.bridgesystem.convention;

import com.bridgesystem.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConventionShareRepository extends JpaRepository<ConventionShare, Long> {

    Optional<ConventionShare> findByConventionAndSharedWith(Convention convention, AppUser sharedWith);

    List<ConventionShare> findByConvention(Convention convention);

    @Transactional
    void deleteByConventionAndSharedWith(Convention convention, AppUser sharedWith);
}
