package com.bridgesystem.webauthn;

import com.bridgesystem.security.SessionAuthenticator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yubico.webauthn.data.AuthenticatorAttestationResponse;
import com.yubico.webauthn.data.ClientRegistrationExtensionOutputs;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.exception.RegistrationFailedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/auth/register")
public class RegistrationController {

    static final String SESSION_KEY = "webauthn.registration.options";

    private final WebAuthnService webAuthnService;
    private final SessionAuthenticator sessionAuthenticator;
    private final ObjectMapper objectMapper;

    public RegistrationController(WebAuthnService webAuthnService,
                                  SessionAuthenticator sessionAuthenticator,
                                  ObjectMapper objectMapper) {
        this.webAuthnService = webAuthnService;
        this.sessionAuthenticator = sessionAuthenticator;
        this.objectMapper = objectMapper;
    }

    public record StartRequest(String username, String displayName) {}
    public record FinishRequest(
            PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> credential,
            String nickname) {}

    @PostMapping("/start")
    public JsonNode start(@RequestBody StartRequest body, HttpSession session) throws JsonProcessingException {
        if (body.username() == null || body.username().isBlank()
                || body.displayName() == null || body.displayName().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "username and displayName are required");
        }
        PublicKeyCredentialCreationOptions options =
                webAuthnService.startRegistration(body.username().trim(), body.displayName().trim());
        String json = webAuthnService.serializeCreationOptions(options);
        session.setAttribute(SESSION_KEY, json);
        return objectMapper.readTree(json);
    }

    @PostMapping("/finish")
    public ResponseEntity<Void> finish(@RequestBody FinishRequest body,
                                       HttpServletRequest request,
                                       HttpServletResponse response,
                                       HttpSession session)
            throws JsonProcessingException, RegistrationFailedException {

        String stored = (String) session.getAttribute(SESSION_KEY);
        if (stored == null) {
            throw new ResponseStatusException(BAD_REQUEST, "No registration in progress");
        }
        PublicKeyCredentialCreationOptions options = webAuthnService.deserializeCreationOptions(stored);
        session.removeAttribute(SESSION_KEY);

        String username = webAuthnService.finishRegistration(options, body.credential(), body.nickname());
        sessionAuthenticator.authenticate(username, request, response);
        return ResponseEntity.ok().build();
    }
}
