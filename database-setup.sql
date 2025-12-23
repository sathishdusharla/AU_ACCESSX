-- ============================================
-- AU AccessX - Complete Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure instructors table exists
CREATE TABLE IF NOT EXISTS instructors (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_instructors_wallet') THEN
        CREATE INDEX idx_instructors_wallet ON instructors(wallet_address);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_instructors_email') THEN
        CREATE INDEX idx_instructors_email ON instructors(email);
    END IF;
END $$;

-- Step 3: Add instructor_wallet column to sessions if it doesn't exist
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS instructor_wallet TEXT;

-- Step 4: Create index for sessions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_instructor') THEN
        CREATE INDEX idx_sessions_instructor ON sessions(instructor_wallet);
    END IF;
END $$;

-- Step 5: Enable Row Level Security
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
DROP POLICY IF EXISTS "Allow public read for instructors" ON instructors;
DROP POLICY IF EXISTS "Allow insert for instructors" ON instructors;
DROP POLICY IF EXISTS "Allow update own record" ON instructors;

CREATE POLICY "Allow public read for instructors" 
ON instructors FOR SELECT USING (true);

CREATE POLICY "Allow insert for instructors" 
ON instructors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own record" 
ON instructors FOR UPDATE USING (true);

-- Step 7: Insert your instructor account
-- Password hash for "@Sathish240605"
INSERT INTO instructors (wallet_address, email, password_hash)
VALUES (
  '0xbe10291cb3df442736bfda6c78dfbf4519b6eac6',
  '23eg105a16@anurag.edu.in',
  'f50ee29cc9c38ffa3b62b28919b855220996b15b9d04f6eef7c55e7aa64f0ec7'
)
ON CONFLICT (wallet_address) DO UPDATE 
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash;

-- Step 8: Verify the instructor was created
SELECT 
  id,
  wallet_address,
  email,
  created_at
FROM instructors 
WHERE wallet_address = '0xbe10291cb3df442736bfda6c78dfbf4519b6eac6';

-- ============================================
-- ✅ SETUP COMPLETE!
-- ============================================
-- Login credentials:
-- - Wallet: 0xbe10291cb3df442736bfda6c78dfbf4519b6eac6
-- - Email: 23eg105a16@anurag.edu.in
-- - Password: @Sathish240605
-- ============================================
