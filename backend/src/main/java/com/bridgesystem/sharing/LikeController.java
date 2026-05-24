package com.bridgesystem.sharing;

import com.bridgesystem.security.CurrentUser;
import com.bridgesystem.system.BiddingSystemDtos;
import com.bridgesystem.system.GalleryService;
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

    private final GalleryService galleryService;

    public LikeController(GalleryService galleryService) {
        this.galleryService = galleryService;
    }

    @PostMapping
    public BiddingSystemDtos.LikeResponse addLike(@CurrentUser AppUser user, @PathVariable UUID id) {
        return galleryService.addLike(id, user);
    }

    @DeleteMapping
    public BiddingSystemDtos.LikeResponse removeLike(@CurrentUser AppUser user, @PathVariable UUID id) {
        return galleryService.removeLike(id, user);
    }
}
