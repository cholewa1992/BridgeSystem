package com.bridgesystem.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Establishes the Spring Security context for a successfully authenticated
 * user (after a WebAuthn assertion) and persists it into the HTTP session.
 */
@Component
public class SessionAuthenticator {

    private final SecurityContextRepository repository = new HttpSessionSecurityContextRepository();

    public void authenticate(String username,
                             HttpServletRequest request,
                             HttpServletResponse response) {
        UsernamePasswordAuthenticationToken token =
                new UsernamePasswordAuthenticationToken(username, null, List.of());
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(token);
        SecurityContextHolder.setContext(ctx);
        repository.saveContext(ctx, request, response);
    }
}
