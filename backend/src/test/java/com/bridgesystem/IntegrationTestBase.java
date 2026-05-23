package com.bridgesystem;

import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.security.SecureRandom;
import java.util.UUID;

/**
 * Base class for integration tests. Boots the full Spring context against a
 * real Postgres container (Testcontainers) and provides helper methods for
 * creating test users.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
public abstract class IntegrationTestBase {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void overrides(DynamicPropertyRegistry registry) {
        registry.add("app.webauthn.rp-id", () -> "localhost");
        registry.add("app.webauthn.rp-name", () -> "Bridge System Test");
        registry.add("app.webauthn.origins", () -> "http://localhost:8080");
        registry.add("app.cors.allowed-origins", () -> "http://localhost:5173");
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected AppUserRepository userRepository;

    protected AppUser userAlice;
    protected AppUser userBob;
    protected AppUser userCarol;

    @BeforeEach
    void setUpUsers() {
        userAlice = createTestUser("alice", "Alice");
        userBob = createTestUser("bob", "Bob");
        userCarol = createTestUser("carol", "Carol");
    }

    protected AppUser createTestUser(String username, String displayName) {
        byte[] handle = new byte[32];
        RANDOM.nextBytes(handle);
        AppUser user = new AppUser(UUID.randomUUID(), username, displayName, handle);
        return userRepository.save(user);
    }
}
