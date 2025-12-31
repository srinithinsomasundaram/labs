
-- Add status column to audits table
ALTER TABLE audits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('analyzing', 'completed', 'failed'));

-- Update existing records to completed
UPDATE audits SET status = 'completed' WHERE status IS NULL;
