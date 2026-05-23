package com.bridgesystem.webauthn;

import com.bridgesystem.security.SessionAuthenticator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.data.AuthenticatorAssertionResponse;
import com.yubico.webauthn.data.ClientAssertionExtensionOutputs;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.exception.AssertionFailedException;
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
@RequestMapping("/api/auth/login")
public class LoginController {

    static final String SESSION_KEY = "webauthn.assertion.request";

    private final WebAuthnService webAuthnService;
    private final SessionAuthenticator sessionAuthenticator;
    private final ObjectMapper objectMapper;

    public LoginController(WebAuthnService webAuthnService,
                           SessionAuthenticator sessionAuthenticator,
                           ObjectMapper objectMapper) {
        this.webAuthnService = webAuthnService;
        this.sessionAuthenticator = sessionAuthenticator;
        this.objectMapper = objectMapper;
    }

    public record StartRequest(String username) {}
    public record FinishRequest(
            PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> credential) {}

    @PostMapping("/start")
    public JsonNode start(@RequestBody(required = false) StartRequest body, HttpSession session)
            throws JsonProcessingException {
        String username = body != null ? body.username() : null;
        AssertionRequest request = webAuthnService.startAssertion(username);
        String json = webAuthnService.serializeAssertionRequest(request);
        session.setAttribute(SESSION_KEY, json);
        JsonNode tree = objectMapper.readTree(json);
        // Yubico wraps assertion options under a "publicKeyCredentialRequestOptions"
        // key when present; @simplewebauthn/browser expects the inner object.
        JsonNode inner = tree.get("publicKeyCredentialRequestOptions");
        return inner != null ? inner : tree;
    }

    @PostMapping("/finish")
    public ResponseEntity<Void> finish(@RequestBody FinishRequest body,
                                       HttpServletRequest request,
                                       HttpServletResponse response,
                                       HttpSession session)
            throws JsonProcessingException, AssertionFailedException {

        String stored = (String) session.getAttribute(SESSION_KEY);
        if (stored == null) {
            throw new ResponseStatusException(BAD_REQUEST, "No login in progress");
        }
        AssertionRequest assertionRequest = webAuthnService.deserializeAssertionRequest(stored);
        session.removeAttribute(SESSION_KEY);

        String username = webAuthnService.finishAssertion(assertionRequest, body.credential());
        sessionAuthenticator.authenticate(username, request, response);
        return ResponseEntity.ok().build();
    }
}
