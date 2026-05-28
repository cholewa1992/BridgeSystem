package com.bridgesystem.convention;

import com.bridgesystem.security.CurrentUser;
import com.bridgesystem.security.OptionalCurrentUser;
import com.bridgesystem.user.AppUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conventions")
public class ConventionController {

    private final ConventionService service;

    public ConventionController(ConventionService service) {
        this.service = service;
    }

    @GetMapping
    public List<ConventionDtos.ConventionDetail> list(@CurrentUser AppUser user) {
        return service.listLibrary(user);
    }

    @PostMapping
    public ConventionDtos.ConventionDetail create(@CurrentUser AppUser user,
                                                  @Valid @RequestBody ConventionDtos.CreateRequest body) {
        return service.create(user, body);
    }

    @GetMapping("/{id}")
    public ConventionDtos.ConventionDetail get(@OptionalCurrentUser AppUser user, @PathVariable UUID id) {
        return service.get(id, user);
    }

    @PutMapping("/{id}")
    public ConventionDtos.ConventionDetail update(@CurrentUser AppUser user,
                                                  @PathVariable UUID id,
                                                  @Valid @RequestBody ConventionDtos.UpdateRequest body) {
        return service.update(id, user, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUser AppUser user, @PathVariable UUID id) {
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/visibility")
    public ConventionDtos.ConventionDetail updateVisibility(@CurrentUser AppUser user,
                                                            @PathVariable UUID id,
                                                            @RequestBody ConventionDtos.VisibilityRequest body) {
        return service.updateVisibility(id, user, body.isPublic());
    }

    @PostMapping("/{id}/fork")
    public ConventionDtos.ConventionDetail fork(@CurrentUser AppUser user, @PathVariable UUID id) {
        return service.fork(id, user);
    }

    @GetMapping("/{id}/shares")
    public List<ConventionDtos.ShareDto> listShares(@CurrentUser AppUser user, @PathVariable UUID id) {
        return service.listShares(id, user);
    }

    @PostMapping("/{id}/shares")
    public ConventionDtos.ShareDto addShare(@CurrentUser AppUser user,
                                            @PathVariable UUID id,
                                            @RequestBody ConventionDtos.CreateShareRequest body) {
        return service.addShare(id, user, body);
    }

    @DeleteMapping("/{id}/shares/{username}")
    public ResponseEntity<Void> removeShare(@CurrentUser AppUser user,
                                            @PathVariable UUID id,
                                            @PathVariable String username) {
        service.removeShare(id, user, username);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public ConventionDtos.LikeResponse addLike(@CurrentUser AppUser user, @PathVariable UUID id) {
        return service.addLike(id, user);
    }

    @DeleteMapping("/{id}/like")
    public ConventionDtos.LikeResponse removeLike(@CurrentUser AppUser user, @PathVariable UUID id) {
        return service.removeLike(id, user);
    }
}
