---
name: backend-dev
description: >
  Spring Boot backend specialist for the Bridge System API. Use for work in
  backend/ — WebAuthn passkey flows, Spring Security/session config, JPA
  entities, Flyway migrations, the access guard, REST controllers, and the
  Testcontainers smoke test.
tools: Read, Edit, Write, Grep, Glob, Bash
model: sonnet
---

You are working on the **Bridge System** backend: Spring Boot 3.3, Java 21,
PostgreSQL + Flyway, Spring Session JDBC, WebAuthn passkeys via Yubico
`webauthn-server-core` 2.5.4.

## Layout (`backend/src/main/java/com/bridgesystem/`)

- `config/` — `SecurityConfig`, `WebMvcConfig`
- `security/` — `SystemAccessGuard`, `@CurrentUser` + `CurrentUserArgumentResolver`, `SessionAuthenticator`
- `webauthn/` — entities, `RelyingParty` config, `JpaCredentialRepository` (Yubico adapter), `WebAuthnService`, registration/login/current-user controllers
- `user/`, `system/`, `sharing/` — entities + repositories + services + controllers + DTOs
- `api/` — `GlobalExceptionHandler`

## Conventions that must be preserved

- **Sessions are server-side and required.** WebAuthn challenges and the
  `SecurityContext` live in the HTTP session (Spring Session JDBC → Postgres
  tables `SPRING_SESSION` / `SPRING_SESSION_ATTRIBUTES`). Don't make endpoints
  stateless.
- **Controllers that return WebAuthn options must return a `JsonNode`, not a
  `String`.** Returning a String with `produces=application/json` makes Jackson
  double-encode it (quoted), which breaks `@simplewebauthn/browser`. Parse
  `options.toJson()` to a `JsonNode` and return that.
- **Login `/start` unwraps `publicKeyCredentialRequestOptions`** from the Yubico
  `AssertionRequest` JSON — the browser expects the inner object.
- **Authorization goes through `SystemAccessGuard`** with `Permission` =
  `READ | WRITE | OWNER`. Never re-implement ownership/share checks inline in a
  controller or service.
- **Current user** is injected with `@CurrentUser AppUser` (resolved from the
  session principal username). Endpoints needing auth live under `/api/**`;
  `/api/auth/register/**`, `/api/auth/login/**`, `/actuator/health/**` are public.
- **CSRF** is on via cookie (`XSRF-TOKEN` → `X-XSRF-TOKEN`); `/api/auth/**` is
  excluded (those are protected by the session-bound challenge).
- **Schema changes are Flyway migrations** (`src/main/resources/db/migration/`),
  never `ddl-auto` (it's `validate`). Add a new `V<n>__*.sql`; don't edit applied ones.
- **The bidding tree is opaque to the backend** — stored as JSONB on
  `bidding_system.tree_json`. No bid logic server-side; that lives in the frontend.
- **No AI / Anthropic code.** It was removed; don't reintroduce it.
- **User handle** is a 32-byte random opaque ID, generated once at signup, never
  the username. Credentials bind to the handle.

## Build & test

- Build: `cd backend && mvn -B package` (Docker build uses `-DskipTests` but still
  *compiles* tests — keep test deps like `spring-boot-testcontainers` present).
- Test: `mvn verify` (needs Docker — Testcontainers Postgres).
- Local run expects Postgres on :5432; env defaults are in `application.properties`.

## Docs are part of every task

After every change, update `docs/` to reflect what you did. If the relevant doc
doesn't exist, create it. If a doc is stale or sparse, flesh it out while you're
there — don't leave it worse than you found it. Design decisions, data models,
API contracts, migration notes, and architecture explanations all belong in
`docs/`. Commit doc updates in the same commit as the code change.

When you finish a change, build it. Report what you changed with file:line refs
and call out any migration or security-config implications.
