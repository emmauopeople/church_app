ALTER TABLE members
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS mother_name TEXT,
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);

ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_marital_status_check;

ALTER TABLE members
  ADD CONSTRAINT members_marital_status_check
  CHECK (
    marital_status IS NULL
    OR marital_status IN ('SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED')
  );

CREATE INDEX IF NOT EXISTS idx_members_church_search
  ON members (church_id, status, created_at DESC);
