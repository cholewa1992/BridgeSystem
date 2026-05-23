package com.bridgesystem.system;

import com.bridgesystem.security.CurrentUser;
import com.bridgesystem.user.AppUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/systems")
public class BiddingSystemController {

    private final BiddingSystemService service;

    public BiddingSystemController(BiddingSystemService service) {
        this.service = service;
    }

    @GetMapping
    public List<BiddingSystemDtos.SystemSummary> list(@CurrentUser AppUser user) {
        return service.listAccessible(user);
    }

    @PostMapping
    public BiddingSystemDtos.SystemDetail create(@CurrentUser AppUser user,
                                                 @Valid @RequestBody BiddingSystemDtos.CreateRequest body) {
        return service.create(user, body);
    }

    @GetMapping("/{id}")
    public BiddingSystemDtos.SystemDetail get(@CurrentUser AppUser user, @PathVariable UUID id) {
        return service.get(id, user);
    }

    @PutMapping("/{id}")
    public BiddingSystemDtos.SystemDetail update(@CurrentUser AppUser user,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody BiddingSystemDtos.UpdateRequest body) {
        return service.update(id, user, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUser AppUser user, @PathVariable UUID id) {
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
