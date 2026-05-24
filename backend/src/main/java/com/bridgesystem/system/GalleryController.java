package com.bridgesystem.system;

import com.bridgesystem.security.OptionalCurrentUser;
import com.bridgesystem.user.AppUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

    private final BiddingSystemService service;

    public GalleryController(BiddingSystemService service) {
        this.service = service;
    }

    @GetMapping
    public List<BiddingSystemDtos.SystemSummary> list(
            @OptionalCurrentUser AppUser user,
            @RequestParam(defaultValue = "newest") String sort) {
        return service.getPublicSystems(sort, user);
    }
}
