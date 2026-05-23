package com.bridgesystem.webauthn;

import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Adapter that exposes our JPA-backed credential store to the Yubico library.
 */
@Component
public class JpaCredentialRepository implements CredentialRepository {

    private final AppUserRepository userRepository;
    private final WebAuthnCredentialRepository credentialRepository;

    public JpaCredentialRepository(AppUserRepository userRepository,
                                   WebAuthnCredentialRepository credentialRepository) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
        return userRepository.findByUsername(username)
                .map(credentialRepository::findByUser)
                .stream()
                .flatMap(java.util.Collection::stream)
                .map(c -> PublicKeyCredentialDescriptor.builder()
                        .id(new ByteArray(c.getCredentialId()))
                        .build())
                .collect(Collectors.toCollection(HashSet::new));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ByteArray> getUserHandleForUsername(String username) {
        return userRepository.findByUsername(username)
                .map(AppUser::getUserHandle)
                .map(ByteArray::new);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
        return userRepository.findByUserHandle(userHandle.getBytes())
                .map(AppUser::getUsername);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
        return credentialRepository.findByCredentialId(credentialId.getBytes())
                .filter(c -> java.util.Arrays.equals(c.getUser().getUserHandle(), userHandle.getBytes()))
                .map(this::toRegistered);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
        return credentialRepository.findByCredentialId(credentialId.getBytes())
                .map(this::toRegistered)
                .map(Set::of)
                .orElse(Set.of());
    }

    private RegisteredCredential toRegistered(WebAuthnCredential c) {
        return RegisteredCredential.builder()
                .credentialId(new ByteArray(c.getCredentialId()))
                .userHandle(new ByteArray(c.getUser().getUserHandle()))
                .publicKeyCose(new ByteArray(c.getPublicKeyCose()))
                .signatureCount(c.getSignatureCount())
                .build();
    }
}
