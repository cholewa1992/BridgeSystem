package com.bridgesystem.sharing;

import com.bridgesystem.IntegrationTestBase;
import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.system.BiddingSystemDtos;
import com.bridgesystem.system.BiddingSystemRepository;
import com.bridgesystem.user.AppUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SharingControllerTest extends IntegrationTestBase {

    @Autowired
    private SystemShareRepository shareRepository;

    @Autowired
    private BiddingSystemRepository systemRepository;

    private MockHttpServletRequestBuilder authenticated(MockHttpServletRequestBuilder builder, AppUser user) {
        return builder.sessionAttr(
                org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                new SecurityContextImpl(new UsernamePasswordAuthenticationToken(
                        user.getUsername(), null, java.util.List.of()))
        );
    }

    private String createSystemFor(AppUser owner) throws Exception {
        MvcResult result = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Share Test System\"}"),
                owner))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    // ── List shares ────────────────────────────────────────────────────────

    @Test
    void listShares_nonOwner_forbidden() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(get("/api/systems/" + id + "/shares"), userBob))
                .andExpect(status().isForbidden());
    }

    @Test
    void listShares_ownerSeesShares() throws Exception {
        String id = createSystemFor(userAlice);
        UUID systemId = UUID.fromString(id);
        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();

        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.READ));
        shareRepository.save(new SystemShare(system, userCarol, SystemShare.Permission.WRITE));

        mockMvc.perform(authenticated(get("/api/systems/" + id + "/shares"), userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].username", containsInAnyOrder("bob", "carol")))
                .andExpect(jsonPath("$[?(@.username=='bob')].permission").value("READ"))
                .andExpect(jsonPath("$[?(@.username=='carol')].permission").value("WRITE"));
    }

    @Test
    void listShares_noShares_emptyList() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(get("/api/systems/" + id + "/shares"), userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ── Add share ──────────────────────────────────────────────────────────

    @Test
    void addShare_nonOwner_forbidden() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"bob\",\"permission\":\"READ\"}"),
                userBob))
                .andExpect(status().isForbidden());
    }

    @Test
    void addShare_readPermission() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"bob\",\"permission\":\"READ\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("bob"))
                .andExpect(jsonPath("$.displayName").value("Bob"))
                .andExpect(jsonPath("$.permission").value("READ"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void addShare_writePermission() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"bob\",\"permission\":\"WRITE\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permission").value("WRITE"));
    }

    @Test
    void addShare_nonExistentUser_notFound() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"nobody\",\"permission\":\"READ\"}"),
                userAlice))
                .andExpect(status().isNotFound());
    }

    @Test
    void addShare_shareWithSelf_badRequest() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"alice\",\"permission\":\"READ\"}"),
                userAlice))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addShare_invalidPermission_badRequest() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"bob\",\"permission\":\"ADMIN\"}"),
                userAlice))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addShare_blankUsername_badRequest() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"\",\"permission\":\"READ\"}"),
                userAlice))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addShare_upsert_existingShare() throws Exception {
        String id = createSystemFor(userAlice);

        // First share with READ
        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"bob\",\"permission\":\"READ\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permission").value("READ"));

        // Upgrade to WRITE
        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"bob\",\"permission\":\"WRITE\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permission").value("WRITE"));

        // Verify only one share exists
        mockMvc.perform(authenticated(get("/api/systems/" + id + "/shares"), userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void addShare_caseInsensitivePermission() throws Exception {
        String id = createSystemFor(userAlice);

        mockMvc.perform(authenticated(post("/api/systems/" + id + "/shares")
                        .contentType("application/json")
                        .content("{\"username\":\"bob\",\"permission\":\"read\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permission").value("READ"));
    }

    // ── Remove share ───────────────────────────────────────────────────────

    @Test
    void removeShare_nonOwner_forbidden() throws Exception {
        String id = createSystemFor(userAlice);
        UUID systemId = UUID.fromString(id);
        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.READ));

        mockMvc.perform(authenticated(delete("/api/systems/" + id + "/shares/bob"), userBob))
                .andExpect(status().isForbidden());

        // Share still exists
        mockMvc.perform(authenticated(get("/api/systems/" + id + "/shares"), userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void removeShare_ownerCanRemove() throws Exception {
        String id = createSystemFor(userAlice);
        UUID systemId = UUID.fromString(id);
        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.READ));

        mockMvc.perform(authenticated(delete("/api/systems/" + id + "/shares/bob"), userAlice))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/systems/" + id + "/shares"), userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void removeShare_nonExistentUser_stillSucceeds() throws Exception {
        String id = createSystemFor(userAlice);

        // Deleting a share that doesn't exist is idempotent
        mockMvc.perform(authenticated(delete("/api/systems/" + id + "/shares/nobody"), userAlice))
                .andExpect(status().isNoContent());
    }

    // ── Shared user can access system ──────────────────────────────────────

    @Test
    void sharedUserCanGetSystem() throws Exception {
        String id = createSystemFor(userAlice);
        UUID systemId = UUID.fromString(id);
        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.READ));

        mockMvc.perform(authenticated(get("/api/systems/" + id), userBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.ownedByMe").value(false))
                .andExpect(jsonPath("$.permission").value("READ"));
    }

    @Test
    void sharedUserWithWriteCanUpdateSystem() throws Exception {
        String id = createSystemFor(userAlice);
        UUID systemId = UUID.fromString(id);
        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.WRITE));

        mockMvc.perform(authenticated(put("/api/systems/" + id)
                        .contentType("application/json")
                        .content("{\"name\":\"Bob Renamed\"}"),
                userBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bob Renamed"));
    }

    @Test
    void sharedUserWithReadCannotUpdateSystem() throws Exception {
        String id = createSystemFor(userAlice);
        UUID systemId = UUID.fromString(id);
        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.READ));

        mockMvc.perform(authenticated(put("/api/systems/" + id)
                        .contentType("application/json")
                        .content("{\"name\":\"Should Fail\"}"),
                userBob))
                .andExpect(status().isForbidden());
    }

    @Test
    void sharedUserCannotDeleteSystem() throws Exception {
        String id = createSystemFor(userAlice);
        UUID systemId = UUID.fromString(id);
        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.WRITE));

        mockMvc.perform(authenticated(delete("/api/systems/" + id), userBob))
                .andExpect(status().isForbidden());
    }
}
