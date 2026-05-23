package com.bridgesystem.api;

import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // ── ResponseStatusException ─────────────────────────────────────────────

    @Test
    void handleStatus_returnsMatchingStatusCodeAndReason() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom reason");

        ResponseEntity<GlobalExceptionHandler.ApiError> response = handler.handleStatus(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo("Custom reason");
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    void handleStatus_nullReason_usesHttpStatusReasonPhrase() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND);

        ResponseEntity<GlobalExceptionHandler.ApiError> response = handler.handleStatus(ex);

        assertThat(response.getBody().message()).isEqualTo("Not Found");
    }

    // ── AccessDeniedException ──────────────────────────────────────────────

    @Test
    void handleAccessDenied_returns403() {
        AccessDeniedException ex = new AccessDeniedException("Not authorized");

        ResponseEntity<GlobalExceptionHandler.ApiError> response = handler.handleAccessDenied(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().status()).isEqualTo(403);
        assertThat(response.getBody().message()).isEqualTo("Not authorized");
    }

    // ── WebAuthn failures ──────────────────────────────────────────────────

    @Test
    void handleWebAuthn_registrationFailed_returns400() {
        RegistrationFailedException ex = new RegistrationFailedException(new IllegalArgumentException("Bad attestation"));

        ResponseEntity<GlobalExceptionHandler.ApiError> response = handler.handleWebAuthn(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo("WebAuthn verification failed");
    }

    @Test
    void handleWebAuthn_assertionFailed_returns400() {
        AssertionFailedException ex = new AssertionFailedException(new IllegalArgumentException("Wrong signature"));

        ResponseEntity<GlobalExceptionHandler.ApiError> response = handler.handleWebAuthn(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().message()).isEqualTo("WebAuthn verification failed");
    }

    // ── Validation ─────────────────────────────────────────────────────────

    @Test
    void handleValidation_returns400WithFieldErrors() {
        org.springframework.validation.BeanPropertyBindingResult bindingResult =
                new org.springframework.validation.BeanPropertyBindingResult(new ValidationTarget(), "target");
        bindingResult.rejectValue("name", "NotBlank", "must not be blank");
        bindingResult.rejectValue("email", "Email", "must be a valid email");

        org.springframework.web.bind.MethodArgumentNotValidException ex =
                new org.springframework.web.bind.MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsKey("status");
        assertThat(response.getBody().get("status")).isEqualTo(400);
        assertThat(response.getBody()).containsKey("message");
        String message = (String) response.getBody().get("message");
        assertThat(message).contains("name");
        assertThat(message).contains("email");
        assertThat(response.getBody()).containsKey("timestamp");
    }

    @SuppressWarnings("unused")
    static class ValidationTarget {
        private String name;
        private String email;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    // ── IllegalStateException ──────────────────────────────────────────────

    @Test
    void handleIllegalState_returns409() {
        IllegalStateException ex = new IllegalStateException("Username already taken");

        ResponseEntity<GlobalExceptionHandler.ApiError> response = handler.handleIllegalState(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().message()).isEqualTo("Username already taken");
    }

    // ── Catch-all ──────────────────────────────────────────────────────────

    @Test
    void handleUnknown_returns500() {
        RuntimeException ex = new RuntimeException("Something went wrong");

        ResponseEntity<GlobalExceptionHandler.ApiError> response = handler.handleUnknown(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().status()).isEqualTo(500);
        assertThat(response.getBody().message()).isEqualTo("Internal server error");
    }

    // ── ApiError record ────────────────────────────────────────────────────

    @Test
    void apiError_factoryMethod() {
        GlobalExceptionHandler.ApiError error = GlobalExceptionHandler.ApiError.of(
                HttpStatus.UNPROCESSABLE_ENTITY, "Cannot process");

        assertThat(error.status()).isEqualTo(422);
        assertThat(error.message()).isEqualTo("Cannot process");
        assertThat(error.timestamp()).isNotNull();
    }
}
