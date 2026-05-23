# Bridge System

A web app for documenting bridge bidding system agreements with a partner. Tree-structured bidding sequences (including interference), passkey (WebAuthn) authentication, sharing with read/write permissions.

## Stack

- **Backend** — Spring Boot 3.3 on Java 21, PostgreSQL + Flyway, Spring Session JDBC, Yubico `webauthn-server-core` for passkeys.
- **Frontend** — React 18 + TypeScript + Vite, `@simplewebauthn/browser` on the client side.
- **Container** — separate images per service. nginx fronts the SPA and proxies `/api`.
- **Deploy** — Helm chart at `helm/bridge-system/` plus raw Kustomize manifests under `k8s/`.

## Repository layout

```
backend/      Spring Boot API
frontend/     React + Vite SPA
k8s/          Raw Kubernetes manifests (base + overlays)
helm/         Helm chart (preferred deployment path)
docker-compose.yml
.github/workflows/ci.yml
```

## Local development

### Prerequisites

- Docker + Docker Compose
- (Optional, for native dev) JDK 21, Node 20

### Quickstart with Docker

```bash
# Start Postgres + backend (frontend you run via Vite for hot reload)
docker compose up --build

# In another terminal:
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:8080` so cookies and CORS work out of the box.

### Full container stack (no Vite)

```bash
docker compose --profile full up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:8080
```

The two share host port allocation by default — see `docker-compose.yml`.

### Backend without Docker

```bash
cd backend
# DB_URL/DB_USER/DB_PASSWORD default to a local Postgres on 5432.
mvn spring-boot:run
```

### Backend tests

The smoke test uses Testcontainers, so Docker must be running:

```bash
cd backend && mvn verify
```

## Configuration

Backend environment variables (with defaults):

| Var | Default | Notes |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/bridge` | |
| `DB_USER` / `DB_PASSWORD` | `bridge` / `bridge` | |
| `WEBAUTHN_RP_ID` | `localhost` | Must be a registrable suffix of every origin |
| `WEBAUTHN_RP_NAME` | `Bridge System` | Shown by the authenticator UI |
| `WEBAUTHN_ORIGINS` | `http://localhost:5173,http://localhost:8080` | Comma-separated |
| `CORS_ORIGINS` | `http://localhost:5173` | Frontend origin(s) |
| `COOKIE_SECURE` | `false` | Set to `true` in production (HTTPS required) |

## Deploying with Helm

```bash
helm install bridge ./helm/bridge-system \
  --namespace bridge --create-namespace \
  --set secrets.dbPassword=changeme \
  --set ingress.host=bridge.example.com \
  --set webauthn.rpId=bridge.example.com \
  --set webauthn.origins=https://bridge.example.com \
  --set cors.allowedOrigins=https://bridge.example.com
```

For production: set `postgres.embedded=false` and point `postgres.external.url` at a managed database; use a `SealedSecret` / `ExternalSecret` and set `secrets.existingSecret` to its name.

## Deploying with raw Kustomize

```bash
kubectl apply -k k8s/overlays/prod
```

The base manifests reference `bridge-secrets` — apply your own `Secret` of that name; `k8s/base/secret.example.yaml` shows the expected keys but is *not* meant to be applied as-is.

## CI

GitHub Actions (`.github/workflows/ci.yml`):

1. **backend-test** — `mvn verify` with Testcontainers Postgres
2. **frontend-test** — `npm run build`
3. **images** — on push to `main`, builds and pushes both images to GHCR tagged `:${SHA}` and `:latest`

## License

Not yet declared.
