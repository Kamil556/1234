-- ═══════════════════════════════════════════════════════════════
--  Marathon Skills 2026 — Supabase Schema
--  Выполните этот SQL в Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Участники марафона
CREATE TABLE IF NOT EXISTS participants (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,                      -- Google sub из NextAuth session
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  surname     TEXT NOT NULL,
  gender      TEXT NOT NULL DEFAULT 'Мужской',
  dob         DATE,
  country     TEXT DEFAULT 'Казахстан',
  photo_url   TEXT,
  role        TEXT NOT NULL DEFAULT 'Бегун',      -- 'Бегун' | 'Координатор'
  bmi         NUMERIC(5,2),
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_email   ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_role    ON participants(role);
CREATE INDEX IF NOT EXISTS idx_participants_active  ON participants(active);

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_participants_updated_at ON participants;
CREATE TRIGGER trg_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security ──────────────────────────────────────────
-- Все запросы идут через Service Role ключ (server-side), поэтому
-- RLS для client-side заблокирован. Service role обходит RLS полностью.
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Запрещаем прямой доступ клиентов (anon / authenticated через supabase-js)
-- Service role key обходит RLS автоматически — политика для него не нужна.
DROP POLICY IF EXISTS "no_direct_client_access" ON participants;
CREATE POLICY "no_direct_client_access" ON participants
  FOR ALL USING (false);
