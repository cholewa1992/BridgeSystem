package com.bridgesystem.system;

import com.bridgesystem.IntegrationTestBase;
import com.bridgesystem.sharing.SharingDtos;
import com.bridgesystem.sharing.SystemShare;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

class BiddingSystemControllerTest extends IntegrationTestBase {

    @Autowired
    private SystemShareRepository shareRepository;

    @Autowired
    private BiddingSystemRepository systemRepository;

    private String session(MockHttpServletRequestBuilder builder, AppUser user) throws Exception {
        // Establish session with SecurityContext
        MvcResult result = mockMvc.perform(builder
                        .sessionAttr(
                                org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                                new SecurityContextImpl(new UsernamePasswordAuthenticationToken(
                                        user.getUsername(), null, java.util.List.of()))
                        ))
                .andReturn();
        return result.getRequest().getSession().getId();
    }

    private MockHttpServletRequestBuilder authenticated(MockHttpServletRequestBuilder builder, AppUser user) {
        return builder.sessionAttr(
                org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                new SecurityContextImpl(new UsernamePasswordAuthenticationToken(
                        user.getUsername(), null, java.util.List.of()))
        );
    }

    // ── Create ─────────────────────────────────────────────────────────────

    @Test
    void createSystem_requiresAuth() throws Exception {
        mockMvc.perform(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Test\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createSystem_success() throws Exception {
        mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"My System\",\"description\":\"A test system\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("My System"))
                .andExpect(jsonPath("$.description").value("A test system"))
                .andExpect(jsonPath("$.ownerUsername").value("alice"))
                .andExpect(jsonPath("$.ownedByMe").value(true))
                .andExpect(jsonPath("$.permission").value("OWNER"))
                .andExpect(jsonPath("$.tree").exists())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());
    }

    @Test
    void createSystem_blankName_rejected() throws Exception {
        mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"\",\"description\":\"oops\"}"),
                userAlice))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createSystem_nameTooLong_rejected() throws Exception {
        String longName = "x".repeat(201);
        mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"" + longName + "\"}"),
                userAlice))
                .andExpect(status().isBadRequest());
    }

    // ── List ───────────────────────────────────────────────────────────────

    @Test
    void listSystems_showsOwned() throws Exception {
        mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Alice System\"}"),
                userAlice))
                .andExpect(status().isOk());

        mockMvc.perform(authenticated(get("/api/systems"), userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].ownerUsername").value("alice"))
                .andExpect(jsonPath("$[0].ownedByMe").value(true))
                .andExpect(jsonPath("$[0].permission").value("OWNER"));
    }

    @Test
    void listSystems_emptyForNewUser() throws Exception {
        AppUser newUser = createTestUser("newuser", "New User");
        mockMvc.perform(authenticated(get("/api/systems"), newUser))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ── Get ────────────────────────────────────────────────────────────────

    @Test
    void getSystem_ownerCanRead() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Get Test\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(authenticated(get("/api/systems/" + id), userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Get Test"));
    }

    @Test
    void getSystem_nonOwner_withoutShare_forbidden() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Private System\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(authenticated(get("/api/systems/" + id), userBob))
                .andExpect(status().isForbidden());
    }

    @Test
    void getSystem_nonExistent_notFound() throws Exception {
        mockMvc.perform(authenticated(get("/api/systems/" + UUID.randomUUID()), userAlice))
                .andExpect(status().isNotFound());
    }

    // ── Update ─────────────────────────────────────────────────────────────

    @Test
    void updateSystem_ownerCanUpdate() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Original\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(authenticated(put("/api/systems/" + id)
                        .contentType("application/json")
                        .content("{\"name\":\"Updated\",\"description\":\"New desc\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.description").value("New desc"));
    }

    @Test
    void updateSystem_withTree() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Tree Test\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        ObjectNode tree = objectMapper.createObjectNode();
        ObjectNode childNode = tree.putArray("children").addObject();
        childNode.put("id", "node-1");
        childNode.putArray("bids").add("1NT");
        childNode.put("meaning", "15-17 balanced");
        childNode.putArray("children");

        mockMvc.perform(authenticated(put("/api/systems/" + id)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new BiddingSystemDtos.UpdateRequest(
                                "Tree Test", "With tree", tree))),
                userAlice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tree.children", hasSize(1)))
                .andExpect(jsonPath("$.tree.children[0].bids[0]").value("1NT"));
    }

    @Test
    void updateSystem_writeSharerCanUpdate() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Shared System\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
        UUID systemId = UUID.fromString(id);

        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.WRITE));

        mockMvc.perform(authenticated(put("/api/systems/" + id)
                        .contentType("application/json")
                        .content("{\"name\":\"Bob Updated\"}"),
                userBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bob Updated"));
    }

    @Test
    void updateSystem_readSharer_forbidden() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Read Only\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
        UUID systemId = UUID.fromString(id);

        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.READ));

        mockMvc.perform(authenticated(put("/api/systems/" + id)
                        .contentType("application/json")
                        .content("{\"name\":\"Should Fail\"}"),
                userBob))
                .andExpect(status().isForbidden());
    }

    // ── Delete ─────────────────────────────────────────────────────────────

    @Test
    void deleteSystem_ownerCanDelete() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"To Delete\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(authenticated(delete("/api/systems/" + id), userAlice))
                .andExpect(status().isNoContent());

        mockMvc.perform(authenticated(get("/api/systems/" + id), userAlice))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteSystem_nonOwner_forbidden() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Not Yours\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(authenticated(delete("/api/systems/" + id), userBob))
                .andExpect(status().isForbidden());

        // System still exists for owner
        mockMvc.perform(authenticated(get("/api/systems/" + id), userAlice))
                .andExpect(status().isOk());
    }

    @Test
    void deleteSystem_writeSharer_forbidden() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Shared Write\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
        UUID systemId = UUID.fromString(id);

        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.WRITE));

        mockMvc.perform(authenticated(delete("/api/systems/" + id), userBob))
                .andExpect(status().isForbidden());
    }

    // ── List includes shared systems ───────────────────────────────────────

    @Test
    void listSystems_includesSharedWithRead() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Shared Read System\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
        UUID systemId = UUID.fromString(id);

        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.READ));

        mockMvc.perform(authenticated(get("/api/systems"), userBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].ownerUsername").value("alice"))
                .andExpect(jsonPath("$[0].ownedByMe").value(false))
                .andExpect(jsonPath("$[0].permission").value("READ"));
    }

    @Test
    void listSystems_includesSharedWithWrite() throws Exception {
        MvcResult createResult = mockMvc.perform(authenticated(post("/api/systems")
                        .contentType("application/json")
                        .content("{\"name\":\"Shared Write System\"}"),
                userAlice))
                .andExpect(status().isOk())
                .andReturn();

        String id = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();
        UUID systemId = UUID.fromString(id);

        BiddingSystem system = systemRepository.findById(systemId).orElseThrow();
        shareRepository.save(new SystemShare(system, userBob, SystemShare.Permission.WRITE));

        mockMvc.perform(authenticated(get("/api/systems"), userBob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].permission").value("WRITE"));
    }
}
