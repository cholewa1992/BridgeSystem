package com.bridgesystem.sharing;

import com.bridgesystem.security.CurrentUser;
import com.bridgesystem.system.BiddingSystemDtos;
import com.bridgesystem.system.BiddingSystemService;
import com.bridgesystem.user.AppUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/systems/{id}/like")
public class LikeController {

    private final BiddingSystemService service;

    public LikeController(BiddingSystemService service) {
        this.service = service;
    }

    @PostMapping
    public BiddingSystemDtos.LikeResponse addLike(@CurrentUser AppUser user, @PathVariable UUID id) {
        return service.addLike(id, user);
    }

    @DeleteMapping
    public BiddingSystemDtos.LikeResponse removeLike(@CurrentUser AppUser user, @PathVariable UUID id) {
        return service.removeLike(id, user);
    }
}
