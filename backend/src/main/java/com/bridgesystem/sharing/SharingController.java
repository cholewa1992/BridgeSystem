package com.bridgesystem.sharing;

import com.bridgesystem.security.CurrentUser;
import com.bridgesystem.user.AppUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/systems/{id}/shares")
public class SharingController {

    private final SharingService service;

    public SharingController(SharingService service) {
        this.service = service;
    }

    @GetMapping
    public List<SharingDtos.ShareDto> list(@CurrentUser AppUser user, @PathVariable UUID id) {
        return service.list(id, user);
    }

    @PostMapping
    public SharingDtos.ShareDto add(@CurrentUser AppUser user,
                                    @PathVariable UUID id,
                                    @Valid @RequestBody SharingDtos.CreateShare body) {
        return service.add(id, user, body);
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<Void> remove(@CurrentUser AppUser user,
                                       @PathVariable UUID id,
                                       @PathVariable String username) {
        service.remove(id, user, username);
        return ResponseEntity.noContent().build();
    }
}
