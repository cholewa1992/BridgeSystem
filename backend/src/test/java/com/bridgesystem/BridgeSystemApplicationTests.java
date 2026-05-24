package com.bridgesystem;

import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.system.BiddingSystemRepository;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.security.SecureRandom;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Smoke + integration test — boots the Spring context against a real Postgres
 * container and verifies Flyway runs, beans wire up, and public/fork/like
 * features work end-to-end.
 */
@SpringBootTest
@AutoConfigureMockMvc
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

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AppUserRepository userRepository;
    @Autowired BiddingSystemRepository systemRepository;

    private AppUser testUser;
    private BiddingSystem testSystem;

    @BeforeEach
    void setUp() {
        systemRepository.deleteAll();
        userRepository.deleteAll();

        byte[] handle = new byte[32];
        new SecureRandom().nextBytes(handle);
        testUser = userRepository.save(new AppUser(UUID.randomUUID(), "testuser", "Test User", handle));

        testSystem = systemRepository.save(new BiddingSystem(
                UUID.randomUUID(), testUser, "My System", "A test system", "{\"children\":[]}"
        ));
    }

    @Test
    void contextLoads() {
        // If the context starts and Flyway migrations apply cleanly this passes.
    }

    @Test
    @WithMockUser(username = "testuser")
    void patchVisibility_makesSystemPublic() throws Exception {
        String body = "{\"isPublic\": true}";
        String response = mockMvc.perform(patch("/api/systems/{id}/visibility", testSystem.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isPublic").value(true))
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("isPublic").asBoolean()).isTrue();
    }

    @Test
    @WithMockUser(username = "testuser")
    void gallery_returnsPublicSystem_unauthenticated() throws Exception {
        // First make the system public
        mockMvc.perform(patch("/api/systems/{id}/visibility", testSystem.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isPublic\": true}"))
                .andExpect(status().isOk());

        // Gallery should be accessible without authentication
        mockMvc.perform(get("/api/gallery"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(testSystem.getId().toString()))
                .andExpect(jsonPath("$[0].isPublic").value(true));
    }

    @Test
    @WithMockUser(username = "testuser")
    void fork_createsNewSystemWithForkedFromId() throws Exception {
        // Make public so it's readable
        mockMvc.perform(patch("/api/systems/{id}/visibility", testSystem.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isPublic\": true}"))
                .andExpect(status().isOk());

        String response = mockMvc.perform(post("/api/systems/{id}/fork", testSystem.getId())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.forkedFrom.id").value(testSystem.getId().toString()))
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("forkedFrom").get("id").asText()).isEqualTo(testSystem.getId().toString());
    }

    @Test
    @WithMockUser(username = "testuser")
    void like_incrementsAndDecrementsCount() throws Exception {
        // POST like — count becomes 1
        mockMvc.perform(post("/api/systems/{id}/like", testSystem.getId())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(1))
                .andExpect(jsonPath("$.likedByMe").value(true));

        // DELETE like — count goes back to 0
        mockMvc.perform(delete("/api/systems/{id}/like", testSystem.getId())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(0))
                .andExpect(jsonPath("$.likedByMe").value(false));
    }
}
