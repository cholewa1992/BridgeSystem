package com.bridgesystem.webauthn;

import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegistrationResult;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.*;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.UUID;

@Service
public class WebAuthnService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RelyingParty relyingParty;
    private final AppUserRepository userRepository;
    private final WebAuthnCredentialRepository credentialRepository;

    public WebAuthnService(RelyingParty relyingParty,
                           AppUserRepository userRepository,
                           WebAuthnCredentialRepository credentialRepository) {
        this.relyingParty = relyingParty;
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
    }

    // ── Registration ──────────────────────────────────────────────────────

    /**
     * Begin a registration ceremony. Creates the user row immediately so the
     * user_handle is stable across the start/finish round trip. The caller
     * stashes the returned options on the HTTP session.
     */
    @Transactional
    public PublicKeyCredentialCreationOptions startRegistration(String username, String displayName) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalStateException("Username already taken: " + username);
        }

        byte[] handle = new byte[32];
        RANDOM.nextBytes(handle);

        AppUser user = new AppUser(UUID.randomUUID(), username, displayName, handle);
        userRepository.save(user);

        UserIdentity identity = UserIdentity.builder()
                .name(username)
                .displayName(displayName)
                .id(new ByteArray(handle))
                .build();

        return relyingParty.startRegistration(
                StartRegistrationOptions.builder()
                        .user(identity)
                        .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                                .residentKey(ResidentKeyRequirement.PREFERRED)
                                .userVerification(UserVerificationRequirement.PREFERRED)
                                .build())
                        .build()
        );
    }

    /**
     * Finish a registration ceremony against the previously issued options.
     * Returns the username so the caller can establish a session.
     */
    @Transactional
    public String finishRegistration(PublicKeyCredentialCreationOptions options,
                                     PublicKeyCredential<com.yubico.webauthn.data.AuthenticatorAttestationResponse,
                                             com.yubico.webauthn.data.ClientRegistrationExtensionOutputs> credential,
                                     String nickname)
            throws RegistrationFailedException {

        RegistrationResult result = relyingParty.finishRegistration(
                FinishRegistrationOptions.builder()
                        .request(options)
                        .response(credential)
                        .build()
        );

        byte[] userHandle = options.getUser().getId().getBytes();
        AppUser user = userRepository.findByUserHandle(userHandle)
                .orElseThrow(() -> new IllegalStateException("User vanished between start and finish"));

        String transports = credential.getResponse().getTransports().stream()
                .map(AuthenticatorTransport::getId)
                .reduce((a, b) -> a + "," + b)
                .orElse(null);

        WebAuthnCredential entity = new WebAuthnCredential(
                user,
                result.getKeyId().getId().getBytes(),
                result.getPublicKeyCose().getBytes(),
                result.getSignatureCount(),
                result.getAaguid().getBytes(),
                nickname,
                transports,
                result.isBackupEligible(),
                result.isBackedUp()
        );
        credentialRepository.save(entity);

        return user.getUsername();
    }

    // ── Assertion ─────────────────────────────────────────────────────────

    /** Begin an assertion ceremony. The username is optional (resident keys). */
    public AssertionRequest startAssertion(String username) {
        StartAssertionOptions.StartAssertionOptionsBuilder builder = StartAssertionOptions.builder()
                .userVerification(UserVerificationRequirement.PREFERRED);
        if (username != null && !username.isBlank()) {
            builder.username(username);
        }
        return relyingParty.startAssertion(builder.build());
    }

    /** Finish an assertion. Returns the username of the authenticated user. */
    @Transactional
    public String finishAssertion(AssertionRequest request,
                                  PublicKeyCredential<com.yubico.webauthn.data.AuthenticatorAssertionResponse,
                                          com.yubico.webauthn.data.ClientAssertionExtensionOutputs> credential)
            throws AssertionFailedException {

        AssertionResult result = relyingParty.finishAssertion(
                FinishAssertionOptions.builder()
                        .request(request)
                        .response(credential)
                        .build()
        );

        if (!result.isSuccess()) {
            throw new AssertionFailedException("Assertion was not successful");
        }

        byte[] credentialId = result.getCredential().getCredentialId().getBytes();
        WebAuthnCredential entity = credentialRepository.findByCredentialId(credentialId)
                .orElseThrow(() -> new IllegalStateException("Credential disappeared mid-assertion"));
        entity.setSignatureCount(result.getSignatureCount());
        entity.markUsed();

        return result.getUsername();
    }

    // ── Serialization helpers (for stashing options on the session) ───────

    public String serializeCreationOptions(PublicKeyCredentialCreationOptions options) throws JsonProcessingException {
        return options.toJson();
    }

    public PublicKeyCredentialCreationOptions deserializeCreationOptions(String json) throws JsonProcessingException {
        return PublicKeyCredentialCreationOptions.fromJson(json);
    }

    public String serializeAssertionRequest(AssertionRequest request) throws JsonProcessingException {
        return request.toJson();
    }

    public AssertionRequest deserializeAssertionRequest(String json) throws JsonProcessingException {
        return AssertionRequest.fromJson(json);
    }
}
