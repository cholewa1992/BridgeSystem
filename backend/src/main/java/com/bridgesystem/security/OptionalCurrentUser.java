package com.bridgesystem.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Like {@link CurrentUser} but returns {@code null} instead of throwing when
 * the request is unauthenticated. Use for endpoints that are accessible to
 * anonymous visitors but can provide richer responses to logged-in users.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface OptionalCurrentUser {
}
