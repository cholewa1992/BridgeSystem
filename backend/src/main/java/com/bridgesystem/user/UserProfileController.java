package com.bridgesystem.user;

import com.bridgesystem.security.OptionalCurrentUser;
import com.bridgesystem.system.BiddingSystemDtos;
import com.bridgesystem.system.UserProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users/{username}")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public BiddingSystemDtos.UserProfileDto profile(@PathVariable String username) {
        return userProfileService.getUserProfile(username);
    }

    @GetMapping("/systems")
    public List<BiddingSystemDtos.SystemSummary> systems(
            @PathVariable String username,
            @OptionalCurrentUser AppUser viewer) {
        return userProfileService.getPublicSystemsForUser(username, viewer);
    }
}
