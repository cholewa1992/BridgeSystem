package com.bridgesystem.system;

import com.bridgesystem.config.WebMvcConfig;
import com.bridgesystem.security.CurrentUserArgumentResolver;
import com.bridgesystem.security.OptionalCurrentUserArgumentResolver;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BiddingSystemController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({WebMvcConfig.class, CurrentUserArgumentResolver.class, OptionalCurrentUserArgumentResolver.class})
class BiddingSystemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BiddingSystemService service;

    @MockBean
    private AppUserRepository userRepository;

    private AppUser testUser;
    private UUID systemId;
    private BiddingSystemDtos.SystemDetail sampleDetail;
    private BiddingSystemDtos.SystemSummary sampleSummary;

    @BeforeEach
    void setUp() {
        testUser = new AppUser(UUID.randomUUID(), "alice", "Alice", new byte[32]);
        systemId = UUID.randomUUID();

        ObjectNode emptyTree = objectMapper.createObjectNode();
        emptyTree.putArray("children");

        sampleDetail = new BiddingSystemDtos.SystemDetail(
                systemId, "My System", "desc", "alice",
                true, "OWNER", emptyTree,
                OffsetDateTime.now(), OffsetDateTime.now(),
                false, 0L, 0, null, null, List.of()
        );

        sampleSummary = new BiddingSystemDtos.SystemSummary(
                systemId, "My System", "desc", "alice",
                true, "OWNER", OffsetDateTime.now(),
                false, 0L, 0, null
        );

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(testUser));
    }

    @Test
    @WithMockUser(username = "alice")
    void list_returnsOkWithSummaries() throws Exception {
        when(service.listAccessible(testUser)).thenReturn(List.of(sampleSummary));

        mockMvc.perform(get("/api/systems"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("My System"))
                .andExpect(jsonPath("$[0].ownerUsername").value("alice"));
    }

    @Test
    @WithMockUser(username = "alice")
    void create_returnsDetailWithNewSystem() throws Exception {
        when(service.create(eq(testUser), any(BiddingSystemDtos.CreateRequest.class))).thenReturn(sampleDetail);

        String body = "{\"name\":\"My System\",\"description\":\"desc\"}";
        mockMvc.perform(post("/api/systems")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My System"))
                .andExpect(jsonPath("$.ownerUsername").value("alice"));
    }

    @Test
    void get_publicSystem_returnsDetailWithoutAuth() throws Exception {
        when(service.get(eq(systemId), eq(null))).thenReturn(sampleDetail);

        mockMvc.perform(get("/api/systems/{id}", systemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(systemId.toString()));
    }

    @Test
    @WithMockUser(username = "alice")
    void update_returnsUpdatedDetail() throws Exception {
        ObjectNode tree = objectMapper.createObjectNode();
        tree.putArray("children");
        BiddingSystemDtos.SystemDetail updated = new BiddingSystemDtos.SystemDetail(
                systemId, "Updated", "new desc", "alice",
                true, "OWNER", tree,
                OffsetDateTime.now(), OffsetDateTime.now(),
                false, 0L, 0, null, null, List.of()
        );
        when(service.update(eq(systemId), eq(testUser), any(BiddingSystemDtos.UpdateRequest.class)))
                .thenReturn(updated);

        String body = "{\"name\":\"Updated\",\"description\":\"new desc\"}";
        mockMvc.perform(put("/api/systems/{id}", systemId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    @Test
    @WithMockUser(username = "alice")
    void delete_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/systems/{id}", systemId)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(service).delete(systemId, testUser);
    }

    @Test
    @WithMockUser(username = "alice")
    void updateVisibility_returnsUpdatedDetail() throws Exception {
        BiddingSystemDtos.SystemDetail publicDetail = new BiddingSystemDtos.SystemDetail(
                systemId, "My System", "desc", "alice",
                true, "OWNER", objectMapper.createObjectNode(),
                OffsetDateTime.now(), OffsetDateTime.now(),
                true, 0L, 0, null, null, List.of()
        );
        when(service.updateVisibility(systemId, testUser, true)).thenReturn(publicDetail);

        mockMvc.perform(patch("/api/systems/{id}/visibility", systemId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isPublic\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isPublic").value(true));
    }

    @Test
    @WithMockUser(username = "alice")
    void fork_returnsForkedDetail() throws Exception {
        UUID originalId = UUID.randomUUID();
        BiddingSystemDtos.ForkedFromRef ref = new BiddingSystemDtos.ForkedFromRef(
                originalId.toString(), "Original", "alice");
        BiddingSystemDtos.SystemDetail forked = new BiddingSystemDtos.SystemDetail(
                UUID.randomUUID(), "Original (fork)", "desc", "alice",
                true, "OWNER", objectMapper.createObjectNode(),
                OffsetDateTime.now(), OffsetDateTime.now(),
                false, 0L, 0, null, ref, List.of()
        );
        when(service.fork(originalId, testUser)).thenReturn(forked);

        mockMvc.perform(post("/api/systems/{id}/fork", originalId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.forkedFrom.id").value(originalId.toString()));
    }
}
