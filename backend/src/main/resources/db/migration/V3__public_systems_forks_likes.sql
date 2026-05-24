ALTER TABLE bidding_system
  ADD COLUMN is_public      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN forked_from_id UUID REFERENCES bidding_system(id) ON DELETE SET NULL;

CREATE INDEX idx_system_public ON bidding_system(is_public) WHERE is_public = true;
CREATE INDEX idx_system_forked_from ON bidding_system(forked_from_id);

CREATE TABLE system_like (
  id         BIGSERIAL PRIMARY KEY,
  system_id  UUID NOT NULL REFERENCES bidding_system(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (system_id, user_id)
);
CREATE INDEX idx_like_system ON system_like(system_id);
