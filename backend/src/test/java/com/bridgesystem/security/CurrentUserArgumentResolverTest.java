package com.bridgesystem.security;

import com.bridgesystem.user.AppUser;
import com.bridgesystem.user.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrentUserArgumentResolverTest {

    @Mock
    private AppUserRepository userRepository;

    private CurrentUserArgumentResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new CurrentUserArgumentResolver(userRepository);
        SecurityContextHolder.clearContext();
    }

    @Test
    void supportsParameter_withCurrentUserAnnotation_returnsTrue() throws NoSuchMethodException {
        var method = TestController.class.getMethod("handle", AppUser.class);
        var param = new org.springframework.core.MethodParameter(method, 0);

        assertThat(resolver.supportsParameter(param)).isTrue();
    }

    @Test
    void supportsParameter_withoutAnnotation_returnsFalse() throws NoSuchMethodException {
        var method = TestController.class.getMethod("handleString", String.class);
        var param = new org.springframework.core.MethodParameter(method, 0);

        assertThat(resolver.supportsParameter(param)).isFalse();
    }

    @Test
    void resolveArgument_returnsUser_whenAuthenticated() throws NoSuchMethodException {
        byte[] handle = new byte[32];
        new java.security.SecureRandom().nextBytes(handle);
        AppUser user = new AppUser(java.util.UUID.randomUUID(), "alice", "Alice", handle);

        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new UsernamePasswordAuthenticationToken("alice", null, java.util.List.of()));
        SecurityContextHolder.setContext(ctx);

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));

        var method = TestController.class.getMethod("handle", AppUser.class);
        var param = new org.springframework.core.MethodParameter(method, 0);

        Object result = resolver.resolveArgument(param, null, null, null);

        assertThat(result).isSameAs(user);
    }

    @Test
    void resolveArgument_noAuthentication_throwsAccessDenied() throws NoSuchMethodException {
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        SecurityContextHolder.setContext(ctx);

        var method = TestController.class.getMethod("handle", AppUser.class);
        var param = new org.springframework.core.MethodParameter(method, 0);

        assertThatThrownBy(() -> resolver.resolveArgument(param, null, null, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Not authenticated");
    }

    @Test
    void resolveArgument_anonymousUser_throwsAccessDenied() throws NoSuchMethodException {
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new UsernamePasswordAuthenticationToken("anonymousUser", null, java.util.List.of()));
        SecurityContextHolder.setContext(ctx);

        var method = TestController.class.getMethod("handle", AppUser.class);
        var param = new org.springframework.core.MethodParameter(method, 0);

        assertThatThrownBy(() -> resolver.resolveArgument(param, null, null, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void resolveArgument_userNotFound_throwsAccessDenied() throws NoSuchMethodException {
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new UsernamePasswordAuthenticationToken("ghost", null, java.util.List.of()));
        SecurityContextHolder.setContext(ctx);

        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        var method = TestController.class.getMethod("handle", AppUser.class);
        var param = new org.springframework.core.MethodParameter(method, 0);

        assertThatThrownBy(() -> resolver.resolveArgument(param, null, null, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("ghost");
    }

    // Dummy controller for reflection-based parameter inspection
    @SuppressWarnings("unused")
    static class TestController {
        public void handle(@CurrentUser AppUser user) {}
        public void handleString(String value) {}
    }
}
