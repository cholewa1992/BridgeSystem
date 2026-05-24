package com.bridgesystem.config;

import com.bridgesystem.security.CurrentUserArgumentResolver;
import com.bridgesystem.security.OptionalCurrentUserArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final CurrentUserArgumentResolver currentUserResolver;
    private final OptionalCurrentUserArgumentResolver optionalCurrentUserResolver;

    public WebMvcConfig(CurrentUserArgumentResolver currentUserResolver,
                        OptionalCurrentUserArgumentResolver optionalCurrentUserResolver) {
        this.currentUserResolver = currentUserResolver;
        this.optionalCurrentUserResolver = optionalCurrentUserResolver;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserResolver);
        resolvers.add(optionalCurrentUserResolver);
    }
}
