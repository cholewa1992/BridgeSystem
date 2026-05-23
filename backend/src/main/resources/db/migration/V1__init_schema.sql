-- ── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE app_user (
    id              UUID PRIMARY KEY,
    username        VARCHAR(64) NOT NULL UNIQUE,
    display_name    VARCHAR(128) NOT NULL,
    user_handle     BYTEA NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── WebAuthn credentials ───────────────────────────────────────────────────
CREATE TABLE webauthn_credential (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    credential_id       BYTEA NOT NULL UNIQUE,
    public_key_cose     BYTEA NOT NULL,
    signature_count     BIGINT NOT NULL DEFAULT 0,
    aaguid              BYTEA,
    nickname            VARCHAR(128),
    transports          VARCHAR(255),
    is_backup_eligible  BOOLEAN NOT NULL DEFAULT FALSE,
    is_backed_up        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at        TIMESTAMPTZ
);
CREATE INDEX idx_credential_user ON webauthn_credential(user_id);

-- ── Bidding systems ────────────────────────────────────────────────────────
CREATE TABLE bidding_system (
    id              UUID PRIMARY KEY,
    owner_id        UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    tree_json       JSONB NOT NULL DEFAULT '{"children":[]}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_system_owner ON bidding_system(owner_id);

-- ── Sharing ────────────────────────────────────────────────────────────────
CREATE TABLE system_share (
    id              BIGSERIAL PRIMARY KEY,
    system_id       UUID NOT NULL REFERENCES bidding_system(id) ON DELETE CASCADE,
    shared_with_id  UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    permission      VARCHAR(16) NOT NULL CHECK (permission IN ('READ','WRITE')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (system_id, shared_with_id)
);
CREATE INDEX idx_share_user ON system_share(shared_with_id);
