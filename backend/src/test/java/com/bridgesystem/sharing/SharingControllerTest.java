package com.bridgesystem.sharing;

import com.bridgesystem.config.WebMvcConfig;
import com.bridgesystem.security.CurrentUserArgumentResolver;
import com.bridgesystem.security.OptionalCurrentUserArgumentResolver;
import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SharingController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({WebMvcConfig.class, CurrentUserArgumentResolver.class, OptionalCurrentUserArgumentResolver.class})
class SharingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SharingService sharingService;

    @MockBean
    private AppUserRepository userRepository;

    private AppUser owner;
    private UUID systemId;
    private SharingDtos.ShareDto sampleShare;

    @BeforeEach
    void setUp() {
        owner = new AppUser(UUID.randomUUID(), "alice", "Alice", new byte[32]);
        systemId = UUID.randomUUID();
        sampleShare = new SharingDtos.ShareDto("bob", "Bob", "READ", OffsetDateTime.now());

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(owner));
    }

    @Test
    @WithMockUser(username = "alice")
    void list_returnsSharesForSystem() throws Exception {
        when(sharingService.list(systemId, owner)).thenReturn(List.of(sampleShare));

        mockMvc.perform(get("/api/systems/{id}/shares", systemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("bob"))
                .andExpect(jsonPath("$[0].permission").value("READ"));
    }

    @Test
    @WithMockUser(username = "alice")
    void add_createsShare_returnsShareDto() throws Exception {
        when(sharingService.add(eq(systemId), eq(owner), any(SharingDtos.CreateShare.class)))
                .thenReturn(sampleShare);

        String body = "{\"username\":\"bob\",\"permission\":\"READ\"}";
        mockMvc.perform(post("/api/systems/{id}/shares", systemId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("bob"))
                .andExpect(jsonPath("$.permission").value("READ"));
    }

    @Test
    @WithMockUser(username = "alice")
    void remove_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/systems/{id}/shares/{username}", systemId, "bob")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(sharingService).remove(systemId, owner, "bob");
    }
}
