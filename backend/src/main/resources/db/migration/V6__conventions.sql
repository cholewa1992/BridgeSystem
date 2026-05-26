CREATE TABLE convention (
    id              UUID PRIMARY KEY,
    owner_id        UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    parameters_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    root_json       JSONB NOT NULL DEFAULT '{"id":"root","bids":[],"meaning":"","children":[]}'::jsonb,
    is_public       BOOLEAN NOT NULL DEFAULT false,
    forked_from_id  UUID REFERENCES convention(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_convention_owner ON convention(owner_id);

CREATE TABLE convention_share (
    id              BIGSERIAL PRIMARY KEY,
    convention_id   UUID NOT NULL REFERENCES convention(id) ON DELETE CASCADE,
    shared_with_id  UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    permission      VARCHAR(16) NOT NULL CHECK (permission IN ('READ','WRITE')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (convention_id, shared_with_id)
);
CREATE INDEX idx_convention_share_user ON convention_share(shared_with_id);

CREATE TABLE convention_like (
    id              BIGSERIAL PRIMARY KEY,
    convention_id   UUID NOT NULL REFERENCES convention(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (convention_id, user_id)
);
