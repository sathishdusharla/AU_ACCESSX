-- Add start_time and end_time columns to sessions table
-- This allows sessions to have specific timing for display and validation

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS start_time TIME;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Update existing sessions to have default times (optional)
-- UPDATE sessions SET start_time = '09:00:00', end_time = '10:00:00' WHERE start_time IS NULL;
