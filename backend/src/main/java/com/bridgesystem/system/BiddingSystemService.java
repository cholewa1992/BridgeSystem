package com.bridgesystem.system;

import com.bridgesystem.security.SystemAccessGuard;
import com.bridgesystem.sharing.SystemShare;
import com.bridgesystem.sharing.SystemShareRepository;
import com.bridgesystem.user.AppUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class BiddingSystemService {

    private static final String EMPTY_TREE = "{\"children\":[]}";

    private final BiddingSystemRepository systemRepository;
    private final SystemShareRepository shareRepository;
    private final SystemAccessGuard accessGuard;
    private final ObjectMapper objectMapper;

    public BiddingSystemService(BiddingSystemRepository systemRepository,
                                SystemShareRepository shareRepository,
                                SystemAccessGuard accessGuard,
                                ObjectMapper objectMapper) {
        this.systemRepository = systemRepository;
        this.shareRepository = shareRepository;
        this.accessGuard = accessGuard;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<BiddingSystemDtos.SystemSummary> listAccessible(AppUser user) {
        return systemRepository.findAccessibleBy(user.getId()).stream()
                .map(s -> toSummary(s, user))
                .toList();
    }

    @Transactional
    public BiddingSystemDtos.SystemDetail create(AppUser user, BiddingSystemDtos.CreateRequest req) {
        BiddingSystem system = new BiddingSystem(
                UUID.randomUUID(),
                user,
                req.name(),
                req.description(),
                EMPTY_TREE
        );
        systemRepository.save(system);
        return toDetail(system, user);
    }

    @Transactional(readOnly = true)
    public BiddingSystemDtos.SystemDetail get(UUID id, AppUser user) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.READ);
        return toDetail(system, user);
    }

    @Transactional
    public BiddingSystemDtos.SystemDetail update(UUID id, AppUser user, BiddingSystemDtos.UpdateRequest req) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.WRITE);
        system.setName(req.name());
        system.setDescription(req.description());
        if (req.tree() != null) {
            try {
                system.setTreeJson(objectMapper.writeValueAsString(req.tree()));
            } catch (JsonProcessingException e) {
                throw new ResponseStatusException(BAD_REQUEST, "Invalid tree JSON", e);
            }
        }
        return toDetail(system, user);
    }

    @Transactional
    public void delete(UUID id, AppUser user) {
        BiddingSystem system = accessGuard.requireAccess(id, user, SystemAccessGuard.Permission.OWNER);
        systemRepository.delete(system);
    }

    // ── Mapping ────────────────────────────────────────────────────────────

    private BiddingSystemDtos.SystemSummary toSummary(BiddingSystem s, AppUser viewer) {
        return new BiddingSystemDtos.SystemSummary(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getOwner().getUsername(),
                s.getOwner().getId().equals(viewer.getId()),
                permissionFor(s, viewer),
                s.getUpdatedAt()
        );
    }

    private BiddingSystemDtos.SystemDetail toDetail(BiddingSystem s, AppUser viewer) {
        JsonNode tree;
        try {
            tree = objectMapper.readTree(s.getTreeJson());
        } catch (JsonProcessingException e) {
            tree = objectMapper.createObjectNode().putArray("children").arrayNode();
        }
        return new BiddingSystemDtos.SystemDetail(
                s.getId(),
                s.getName(),
                s.getDescription(),
                s.getOwner().getUsername(),
                s.getOwner().getId().equals(viewer.getId()),
                permissionFor(s, viewer),
                tree,
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    private String permissionFor(BiddingSystem s, AppUser viewer) {
        if (s.getOwner().getId().equals(viewer.getId())) return "OWNER";
        return shareRepository.findBySystemAndSharedWith(s, viewer)
                .map(SystemShare::getPermission)
                .map(Enum::name)
                .orElse("NONE");
    }
}
