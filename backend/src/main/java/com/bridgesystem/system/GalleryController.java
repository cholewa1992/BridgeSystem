package com.bridgesystem.system;

import com.bridgesystem.convention.ConventionDtos;
import com.bridgesystem.convention.ConventionService;
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

    private final GalleryService galleryService;
    private final ConventionService conventionService;

    public GalleryController(GalleryService galleryService, ConventionService conventionService) {
        this.galleryService = galleryService;
        this.conventionService = conventionService;
    }

    @GetMapping
    public List<BiddingSystemDtos.SystemSummary> list(
            @OptionalCurrentUser AppUser user,
            @RequestParam(defaultValue = "newest") String sort) {
        return galleryService.getPublicSystems(sort, user);
    }

    @GetMapping("/conventions")
    public List<ConventionDtos.ConventionSummary> listConventions(
            @OptionalCurrentUser AppUser user,
            @RequestParam(defaultValue = "newest") String sort) {
        return conventionService.getPublicConventions(sort, user);
    }
}
