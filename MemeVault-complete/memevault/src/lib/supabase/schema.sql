-- ═══════════════════════════════════════════════════════════════
--  MemeVault — Supabase Schema
--  Run: supabase db push OR paste in SQL editor
-- ═══════════════════════════════════════════════════════════════

-- ── DROPS ────────────────────────────────────────────────────────────────────
-- Each row = one daily meme drop (mirrors the ERC-1155 token on-chain)
CREATE TABLE IF NOT EXISTS drops (
  id            BIGINT PRIMARY KEY,           -- matches ERC-1155 tokenId
  title         TEXT          NOT NULL,
  metadata_uri  TEXT          NOT NULL,       -- ipfs://...
  image_url     TEXT          NOT NULL,       -- cached / gateway URL
  submitted_by  TEXT          NOT NULL DEFAULT '',
  tags          TEXT[]        NOT NULL DEFAULT '{}',
  vote_count    INT           NOT NULL DEFAULT 0,
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  drop_date     DATE          NOT NULL UNIQUE, -- one drop per day
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── SUBMISSIONS ──────────────────────────────────────────────────────────────
-- Community meme submissions waiting for votes
CREATE TABLE IF NOT EXISTS submissions (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet        TEXT          NOT NULL,
  title         TEXT          NOT NULL,
  image_url     TEXT          NOT NULL,
  metadata_uri  TEXT          NOT NULL DEFAULT '',
  tags          TEXT[]        NOT NULL DEFAULT '{}',
  note          TEXT,
  vote_count    INT           NOT NULL DEFAULT 0,
  status        TEXT          NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','rejected','scheduled')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── VOTES ────────────────────────────────────────────────────────────────────
-- One vote per wallet per day on submissions
CREATE TABLE IF NOT EXISTS votes (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet         TEXT          NOT NULL,
  submission_id  UUID          NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Enforce: 1 vote per wallet per calendar day
  UNIQUE (wallet, DATE(created_at))
);

-- ── MINT EVENTS ──────────────────────────────────────────────────────────────
-- Off-chain index of on-chain MemeMinted events (synced by indexer/cron)
CREATE TABLE IF NOT EXISTS mint_events (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id    BIGINT        NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  wallet      TEXT          NOT NULL,
  tx_hash     TEXT          NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drops_date          ON drops(drop_date DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_votes   ON submissions(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_wallet  ON submissions(wallet);
CREATE INDEX IF NOT EXISTS idx_votes_wallet        ON votes(wallet);
CREATE INDEX IF NOT EXISTS idx_mint_events_wallet  ON mint_events(wallet);
CREATE INDEX IF NOT EXISTS idx_mint_events_token   ON mint_events(token_id);

-- ── LEADERBOARD VIEW ─────────────────────────────────────────────────────────
-- Aggregates total mints per wallet
CREATE OR REPLACE VIEW leaderboard_view AS
  SELECT
    wallet,
    COUNT(*)          AS total_mints,
    MAX(created_at)   AS last_minted_at,
    RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
  FROM mint_events
  GROUP BY wallet
  ORDER BY total_mints DESC;

-- ── RLS POLICIES ─────────────────────────────────────────────────────────────
-- Enable Row Level Security on all tables

ALTER TABLE drops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mint_events   ENABLE ROW LEVEL SECURITY;

-- drops: anyone can read, only service_role can write
CREATE POLICY "drops_select" ON drops FOR SELECT USING (true);
CREATE POLICY "drops_insert" ON drops FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "drops_update" ON drops FOR UPDATE USING (auth.role() = 'service_role');

-- submissions: anyone can read/insert their own
CREATE POLICY "submissions_select" ON submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert" ON submissions FOR INSERT WITH CHECK (true);

-- votes: anyone can read, insert their own
CREATE POLICY "votes_select" ON votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (true);

-- mint_events: anyone can read, service_role writes (indexer)
CREATE POLICY "mint_events_select" ON mint_events FOR SELECT USING (true);
CREATE POLICY "mint_events_insert" ON mint_events FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR true  -- allow frontend to record after mint
);

-- ── FUNCTION: auto-increment vote_count ──────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE submissions
  SET vote_count = vote_count + 1
  WHERE id = NEW.submission_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_vote_insert
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION increment_vote_count();

-- ── SEED: Drop #001 (replace with real IPFS URI after deploy) ────────────────
INSERT INTO drops (id, title, metadata_uri, image_url, submitted_by, tags, drop_date)
VALUES (
  1,
  'This is fine. 🔥',
  'ipfs://QmPlaceholder001/metadata.json',
  'https://i.imgur.com/placeholder.jpg',
  'memevault.base',
  ARRAY['classic', 'og', 'fire'],
  CURRENT_DATE
) ON CONFLICT DO NOTHING;
