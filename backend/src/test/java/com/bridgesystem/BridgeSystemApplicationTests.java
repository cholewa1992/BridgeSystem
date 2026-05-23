package com.bridgesystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Smoke test — boots the Spring context against a real Postgres container and
 * verifies Flyway runs and beans wire up.
 */
@SpringBootTest
@Testcontainers
class BridgeSystemApplicationTests {

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

    @Test
    void contextLoads() {
        // If the context starts and Flyway migrations apply cleanly,
        // this passes. That's a strong signal everything is wired up.
    }
}
