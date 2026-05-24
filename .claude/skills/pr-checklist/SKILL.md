---
name: pr-checklist
description: >
  Run before opening or updating any pull request in this repo. Covers the
  full set of CI checks so nothing fails after push. Use whenever finishing
  a feature, fixing a bug, or preparing a branch for review.
---

# PR checklist

Run every item below before pushing. CI runs the same commands and will fail
if any of them do.

## 1. Frontend — from `frontend/`

```bash
# Format (this is the one most often forgotten — run it first)
npx prettier --write "src/**/*.{ts,tsx,css}" "*.{ts,js,json}"

# Lint (zero warnings allowed)
npm run lint

# Type-check + build
npm run build
```

If `prettier --write` changes files, stage them before committing.

## 2. Backend — from `backend/`

```bash
mvn -q compile
```

Tests use Testcontainers and require Docker — skip them locally if Docker
Desktop isn't fully running (`mvn -q compile` is enough to catch type errors).

## 3. Git hygiene

- Branch off `main`, not off an older feature branch.
- One logical commit per PR is fine; squash fixups before opening if the
  history is noisy.
- Never push directly to `main`.

## Common mistakes in this repo

| Mistake | Fix |
|---|---|
| Prettier not run on new files | Always `prettier --write` the files you touched |
| Flyway `${}` placeholder error | Add `spring.flyway.placeholder-replacement=false` if a migration contains JSON dollar-quotes |
| Bytea literal `'\x...'` in migrations | Use `decode('...', 'hex')` — the escape syntax is psql-only and breaks JDBC |
| `@CurrentUser` on a public endpoint | Use `@OptionalCurrentUser` instead; `@CurrentUser` throws for anonymous requests |
