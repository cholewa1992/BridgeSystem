package com.bridgesystem.webauthn;

import com.bridgesystem.security.CurrentUser;
import com.bridgesystem.user.AppUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class CurrentUserController {

    public record CurrentUserResponse(String id, String username, String displayName) {}

    @GetMapping("/me")
    public CurrentUserResponse me(@CurrentUser AppUser user) {
        return new CurrentUserResponse(user.getId().toString(), user.getUsername(), user.getDisplayName());
    }
}
