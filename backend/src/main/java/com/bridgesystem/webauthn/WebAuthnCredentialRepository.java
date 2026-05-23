package com.bridgesystem.webauthn;

import com.bridgesystem.user.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WebAuthnCredentialRepository extends JpaRepository<WebAuthnCredential, Long> {

    Optional<WebAuthnCredential> findByCredentialId(byte[] credentialId);

    List<WebAuthnCredential> findByUser(AppUser user);

    List<WebAuthnCredential> findByUserUserHandle(byte[] userHandle);
}
