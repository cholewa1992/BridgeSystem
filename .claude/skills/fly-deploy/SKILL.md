---
name: fly-deploy
description: >
  Deploy or operate this app on Fly.io. Two apps (bridge-backend internal-only,
  bridge-frontend public nginx) plus Fly Postgres. Use when deploying, changing
  Fly config, rotating secrets, adding a custom domain, or debugging a Fly
  deployment.
---

# Fly.io deployment

The app runs as **two Fly apps** plus a managed Postgres:

| App | Role | Exposure |
|---|---|---|
| `bridge-backend` | Spring Boot API on :8080 | Internal only — no `[http_service]`. Reached at `bridge-backend.internal:8080` |
| `bridge-frontend` | nginx serving the SPA, proxying `/api` | Public HTTPS (`[http_service]`, `force_https`) |
| `bridge-db` | Fly Postgres | Private network (`bridge-db.flycast:5432`) |

Config lives in [backend/fly.toml](../../../backend/fly.toml) and
[frontend/fly.toml](../../../frontend/fly.toml).

## Key wiring details

- **IPv6 binding**: backend sets `SERVER_ADDRESS=::` so it accepts traffic from
  `*.internal` (Fly's 6PN private network resolves to IPv6). Without this,
  nginx → backend connections fail.
- **nginx upstream**: the frontend image templates its config. `BACKEND_HOST`
  (env) is substituted into `proxy_pass` at container start by the nginx image's
  envsubst. Set to `bridge-backend.internal:8080` on Fly,
  `backend:8080` in docker-compose. See
  [frontend/nginx.conf.template](../../../frontend/nginx.conf.template) and
  [frontend/Dockerfile](../../../frontend/Dockerfile).
- **DB URL format**: Spring needs JDBC form. Set as a secret, not in fly.toml:
  `jdbc:postgresql://bridge-db.flycast:5432/postgres` (note `.flycast`, the
  load-balanced address — not `.internal`).

## First deploy

```bash
fly auth login

# Postgres
fly postgres create --name bridge-db --region ams \
  --vm-size shared-cpu-1x --volume-size 1 --initial-cluster-size 1
# Save the password it prints.

# Backend
cd backend
fly launch --no-deploy --copy-config        # reuse existing fly.toml; don't deploy yet
fly secrets set \
  DB_URL=jdbc:postgresql://bridge-db.flycast:5432/postgres \
  DB_USER=postgres \
  DB_PASSWORD=<password>
fly deploy

# Frontend
cd ../frontend
fly launch --no-deploy --copy-config
fly deploy
```

App names are globally unique. If `bridge-backend`/`bridge-frontend` are taken,
rename `app` in both fly.toml files **and** update the frontend's `BACKEND_HOST`
to match the new backend name.

## Custom domain — do this BEFORE users register passkeys

WebAuthn's `rpId` is permanently baked into every passkey. Changing the domain
invalidates all existing passkeys. So pick the final domain early.

```bash
cd frontend
fly certs add bridge.example.com           # after DNS A/AAAA point at Fly
fly certs check bridge.example.com

cd ../backend
fly secrets set \
  WEBAUTHN_RP_ID=bridge.example.com \
  WEBAUTHN_ORIGINS=https://bridge.example.com \
  CORS_ORIGINS=https://bridge.example.com
```

`rpId` must be a *registrable* suffix of the browser's origin. `fly.dev`
subdomains work as the full host (`bridge-frontend.fly.dev`) but you cannot use
bare `fly.dev` as rpId (it's on the public suffix list).

## Operating

```bash
fly status   -a bridge-backend
fly logs     -a bridge-backend          # watch for Flyway + "Started ... in Xs"
fly secrets  list -a bridge-backend
fly ssh console -a bridge-frontend      # then: cat /etc/nginx/conf.d/default.conf
```

Both apps use `auto_stop_machines = "stop"` and `min_machines_running = 0`, so
they cold-start on first request after idle (a few seconds). Expected cost at
personal scale: ~$5–8/mo.

## Troubleshooting

- **Backend can't reach DB** → verify `DB_URL` uses `.flycast`, secret is set.
- **Frontend 502 on /api** → `BACKEND_HOST` mismatch; check it equals the backend
  app name + `.internal:8080`. Inspect the rendered nginx conf via `fly ssh console`.
- **WebAuthn fails** → rpId must match the host the browser shows; check the three
  `WEBAUTHN_*`/`CORS_ORIGINS` secrets on the backend.
- **Backend build fails on test compile** → tests are compiled even with
  `-DskipTests`; ensure test deps (`spring-boot-testcontainers`) are present.
