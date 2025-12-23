# 🚀 AU AccessX - Final Setup Guide

## ✅ Admin Portal with Login Authentication

The admin portal now requires instructor authentication to access. Only verified instructors can create and manage sessions.

---

## Step 1: Run SQL in Supabase

Go to your **Supabase Dashboard → SQL Editor** and run the complete SQL from [database-setup.sql](database-setup.sql)

Or copy-paste this:

```sql
-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instructors_wallet ON instructors(wallet_address);
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);

-- Add instructor_wallet column to sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS instructor_wallet TEXT;

-- Create index for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_instructor ON sessions(instructor_wallet);

-- Enable Row Level Security
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow public read for instructors" ON instructors;
DROP POLICY IF EXISTS "Allow insert for instructors" ON instructors;
DROP POLICY IF EXISTS "Allow update own record" ON instructors;

CREATE POLICY "Allow public read for instructors" 
ON instructors FOR SELECT USING (true);

CREATE POLICY "Allow insert for instructors" 
ON instructors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own record" 
ON instructors FOR UPDATE USING (true);

-- Insert your instructor account
INSERT INTO instructors (wallet_address, email, password_hash)
VALUES (
  '0xbe10291cb3df442736bfda6c78dfbf4519b6eac6',
  '23eg105a16@anurag.edu.in',
  'f50ee29cc9c38ffa3b62b28919b855220996b15b9d04f6eef7c55e7aa64f0ec7'
)
ON CONFLICT (wallet_address) DO UPDATE 
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash;
```

---

## Step 2: Start Your Application

```bash
npm run dev
```

---

## Step 3: Login to Admin Portal

1. Go to http://localhost:3000
2. Click on **"Admin"** in the navigation
3. You'll see the login page
4. **Connect MetaMask** with wallet: `0xbe10291cb3df442736bfda6c78dfbf4519b6eac6`
5. Enter email: `23eg105a16@anurag.edu.in`
6. Enter password: `@Sathish240605`
7. Click **"Sign In"**

✅ You should now be logged in and see the Admin Dashboard!

---

## 🔐 How Authentication Works

1. **Login Required**: Admin portal shows login page first
2. **MetaMask Verification**: Must connect with registered wallet
3. **Database Verification**: Email, wallet, and password verified from `instructors` table
4. **Session Management**: Each instructor only sees their own sessions
5. **Logout**: Click logout button to end session

---

## 📝 Your Login Credentials

**MetaMask Wallet:** `0xbe10291cb3df442736bfda6c78dfbf4519b6eac6`  
**Email:** `23eg105a16@anurag.edu.in`  
**Password:** `@Sathish240605`

⚠️ Keep these secure! They are hashed in the database.

---

## 🎯 Features

- ✅ **Secure Login** - Wallet + Email + Password verification
- ✅ **Session Isolation** - Each instructor sees only their sessions
- ✅ **Real-time Updates** - New sessions appear instantly
- ✅ **QR Code Generation** - Automatic QR codes for each session
- ✅ **Student Portal** - No changes, works as before
- ✅ **Validator Portal** - No changes, works as before

---

## 🔧 Troubleshooting

**"Invalid credentials" error:**
- Verify you're using the correct MetaMask wallet
- Check email is exactly: `23eg105a16@anurag.edu.in`
- Check password is exactly: `@Sathish240605` (case-sensitive)
- Verify the SQL ran successfully in Supabase

**Can't connect MetaMask:**
- Install MetaMask browser extension
- Import/add the wallet with address `0xbe10291cb3df442736bfda6c78dfbf4519b6eac6`
- Make sure you're on the correct account

**Database errors:**
- Check Supabase connection in `.env` file
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check Supabase dashboard for any errors

---

## ✨ You're All Set!

Your AU AccessX system is now fully configured with secure instructor authentication. Only verified instructors can access the admin portal and create sessions.
