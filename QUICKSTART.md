# 🚀 Quick Start Guide - AU AccessX

**Get your attendance system running in 5 minutes!**

## What You Need to Do in Supabase

### 1. Create Supabase Account & Project (2 minutes)

1. Go to https://supabase.com and sign up (free)
2. Click **"New Project"**
3. Enter:
   - Project name: `au-accessx` (or anything you like)
   - Database password: Choose a strong password
   - Region: Pick closest to you
4. Click **"Create new project"** and wait ~1-2 minutes

### 2. Create Database Tables (1 minute)

Once your project loads:

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. **Copy and paste this entire SQL block** and click **"Run"**:

```sql
-- Create sessions table
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  nonce TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- Create attendance records table
CREATE TABLE attendance_records (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  email TEXT NOT NULL,
  token_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  signature TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, wallet_address)
);

CREATE INDEX idx_attendance_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_wallet ON attendance_records(wallet_address);

ALTER TABLE attendance_records 
ADD CONSTRAINT fk_attendance_session 
FOREIGN KEY (session_id) 
REFERENCES sessions(session_id) 
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on sessions" 
ON sessions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access on sessions" 
ON sessions FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read access on attendance_records" 
ON attendance_records FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access on attendance_records" 
ON attendance_records FOR INSERT TO public WITH CHECK (true);
```

✅ You should see "Success. No rows returned" - that's correct!

### 3. Enable Real-time (30 seconds)

1. Click **"Database"** in the left sidebar
2. Click **"Replication"**
3. Find the **`sessions`** table in the list
4. Toggle the switch to **ON** (it should turn green)
5. The page auto-saves - you're done!

### 4. Get Your API Keys (30 seconds)

1. Click the **⚙️ gear icon** (Project Settings) at the bottom left
2. Click **"API"** in the settings menu
3. You'll see two important values:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public key**: Copy this (long string starting with `eyJ...`)

Keep these values handy - you'll need them next!

---

## What You Need to Do Locally

### 1. Install Dependencies (1 minute)

```bash
cd "copy-of-au-accessx (1)"
npm install
```

### 2. Configure Environment (30 seconds)

Create a `.env` file in the project root:

```bash
# Copy the example
cp .env.example .env
```

Open `.env` in your editor and paste your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace with your actual values from Step 4 above!

### 3. Run the App (10 seconds)

```bash
npm run dev
```

Open your browser to the URL shown (usually `http://localhost:5173`)

---

## 🎉 Test It Out!

### Test 1: Create a Session (Admin Portal)

1. Go to `http://localhost:5173/#/admin`
2. Enter a title: "Test Class"
3. Select today's date
4. Click **"Generate Session"**
5. You should instantly see a QR code appear! ✨

### Test 2: Mark Attendance (Student Portal)

1. Go to `http://localhost:5173/#/student`
2. Click **"Connect MetaMask"** (install MetaMask if you don't have it)
3. Enter your email: `test@example.com`
4. Scan the QR code from the admin portal (use your phone or another device)
   - Or manually enter the session details
5. Click **"Sign & Mint Attendance"**
6. Approve the signature in MetaMask
7. You should see "Attendance Minted!" 🎊

### Test 3: Verify Attendance (Validator Portal)

1. Go to `http://localhost:5173/#/validator`
2. Enter the **Session ID** from the admin portal
3. Enter the **Wallet Address** you used to mark attendance
4. Click **"Verify Record"**
5. You should see the verification with badge details! ✅

---

## 🔍 Verify in Supabase

Go back to Supabase and check your data:

1. Click **"Table Editor"** in the left sidebar
2. Click on **`sessions`** - you should see your test session
3. Click on **`attendance_records`** - you should see the student's attendance

**Real-time Magic**: Create another session in the admin portal and watch it appear instantly without refreshing!

---

## ⚡ Key Features Working

- ✅ **Instant Session Creation**: Admin creates → QR appears immediately
- ✅ **Instant Attendance Recording**: Student scans → Attendance stored immediately
- ✅ **Real-time Updates**: No page refresh needed
- ✅ **Cryptographic Verification**: MetaMask signatures prove authenticity
- ✅ **No Duplicate Attendance**: Database prevents same student marking twice

---

## 🆘 Troubleshooting

**❌ "Missing Supabase environment variables"**
→ Check that `.env` file exists and has correct values. Restart dev server.

**❌ "Database Connection Failed"**
→ Verify Supabase URL and key are correct. Check that tables were created.

**❌ QR code not appearing**
→ Check browser console for errors. Verify Supabase tables exist.

**❌ MetaMask not connecting**
→ Install MetaMask extension. Refresh page after installing.

**❌ Real-time not working**
→ Ensure replication is enabled for `sessions` table in Supabase.

---

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for advanced configuration
- Deploy to Vercel/Netlify for production use

---

**🎓 Your attendance system is now live with real-time capabilities!**

When an admin creates a session, it's **instantly** visible.  
When a student marks attendance, it's **instantly** recorded.  
No delays, no polling, no backend server needed!
