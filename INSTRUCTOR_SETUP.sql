-- ===================================
-- INSTRUCTOR ACCOUNT SETUP
-- ===================================
-- Run this SQL in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → SQL Editor → New Query

-- Step 1: Create instructors table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS instructors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 1.5: Add student_image column to attendance_records (if it doesn't exist)
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS student_image TEXT;

-- Step 2: Enable Row Level Security
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy to allow reading instructor data
DROP POLICY IF EXISTS "Allow public read access" ON instructors;
CREATE POLICY "Allow public read access" ON instructors
  FOR SELECT USING (true);

-- Step 4: Delete any existing instructor with this wallet (clean start)
DELETE FROM instructors WHERE wallet_address = '0xbe10291cb3df442736bfda6c78dfbf4519b6eac6';

-- Step 5: Insert your instructor account
-- Wallet: 0xbe10291cb3df442736bfda6c78dfbf4519b6eac6
-- Email: 23eg105a16@anurag.edu.in
-- Password: @Sathish240605
-- Hash: f50ee29cc9c38ffa3b62b28919b855220996b15b9d04f6eef7c55e7aa64f0ec7
INSERT INTO instructors (wallet_address, email, password_hash)
VALUES (
  '0xbe10291cb3df442736bfda6c78dfbf4519b6eac6',
  '23eg105a16@anurag.edu.in',
  'f50ee29cc9c38ffa3b62b28919b855220996b15b9d04f6eef7c55e7aa64f0ec7'
);

-- Step 6: Verify the account was created
SELECT 
  wallet_address, 
  email, 
  password_hash,
  created_at 
FROM instructors 
WHERE wallet_address = '0xbe10291cb3df442736bfda6c78dfbf4519b6eac6';

-- ===================================
-- EXPECTED OUTPUT:
-- wallet_address: 0xbe10291cb3df442736bfda6c78dfbf4519b6eac6
-- email: 23eg105a16@anurag.edu.in
-- password_hash: f50ee29cc9c38ffa3b62b28919b855220996b15b9d04f6eef7c55e7aa64f0ec7
-- ===================================
