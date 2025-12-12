# Supabase Setup Instructions for AU AccessX

This document provides step-by-step instructions to set up Supabase as the backend database for the AU AccessX attendance system.

## Prerequisites

1. A Supabase account (create one at https://supabase.com)
2. Node.js and npm installed on your machine

## Step 1: Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: AU AccessX (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to you
   - **Pricing Plan**: Free tier is sufficient for this project
4. Click **"Create new project"** and wait for the project to be provisioned (1-2 minutes)

## Step 2: Create Database Tables

Once your project is ready, navigate to the **SQL Editor** in the left sidebar and execute the following SQL commands:

### Create Sessions Table

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

-- Create index for faster lookups
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
```

### Create Attendance Records Table

```sql
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

-- Create indexes for faster lookups
CREATE INDEX idx_attendance_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_wallet ON attendance_records(wallet_address);
CREATE INDEX idx_attendance_timestamp ON attendance_records(timestamp DESC);

-- Foreign key relationship (optional but recommended)
ALTER TABLE attendance_records 
ADD CONSTRAINT fk_attendance_session 
FOREIGN KEY (session_id) 
REFERENCES sessions(session_id) 
ON DELETE CASCADE;
```

## Step 3: Enable Real-time Features

To enable real-time updates (instant session creation), you need to enable real-time for the `sessions` table:

1. Go to **Database → Replication** in the left sidebar
2. Find the `sessions` table in the list
3. Toggle the replication switch to **ON** for the `sessions` table
4. Click **Save**

This allows the Admin Portal to instantly show new sessions as they're created.

## Step 4: Configure Row Level Security (RLS)

For security, we'll set up Row Level Security policies. Go back to the **SQL Editor** and run:

```sql
-- Enable RLS on both tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (since we're not using Supabase Auth)
-- In production, you should implement proper authentication

-- Sessions table policies
CREATE POLICY "Allow public read access on sessions" 
ON sessions FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public insert access on sessions" 
ON sessions FOR INSERT 
TO public 
WITH CHECK (true);

-- Attendance records table policies
CREATE POLICY "Allow public read access on attendance_records" 
ON attendance_records FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public insert access on attendance_records" 
ON attendance_records FOR INSERT 
TO public 
WITH CHECK (true);
```

**Security Note**: The policies above allow public access for simplicity. In a production environment, you should:
- Implement Supabase Auth or custom authentication
- Restrict session creation to admin users only
- Allow students to only insert their own attendance records
- Add additional validation logic

## Step 5: Get Your Supabase Credentials

1. Go to **Project Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. You'll find two important values:
   - **Project URL**: Something like `https://abcdefghijklmnop.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

## Step 6: Configure Your Local Project

1. In your project root directory, create a `.env` file:

```bash
# Copy the example file
cp .env.example .env
```

2. Open the `.env` file and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase URL and anon key from Step 5.

## Step 7: Install Dependencies and Run

1. Install the required packages:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Testing the Setup

### Test Admin Portal

1. Go to the **Admin Portal** (`/admin` route)
2. Create a new session with a title and date
3. Click "Generate Session"
4. You should immediately see the new session appear with a QR code
5. Verify in Supabase Dashboard → **Table Editor** → **sessions** that the record was created

### Test Student Portal

1. Ensure you have MetaMask installed in your browser
2. Go to the **Student Portal** (`/student` route)
3. Connect your MetaMask wallet
4. Enter your email
5. Scan the QR code from the Admin Portal (or use a QR code scanner on your phone)
6. Click "Sign & Mint Attendance"
7. Sign the message in MetaMask
8. Verify in Supabase Dashboard → **Table Editor** → **attendance_records** that the record was created instantly

### Test Validator Portal

1. Go to the **Validator Portal** (`/validator` route)
2. Enter a session ID from a created session
3. Enter a wallet address that marked attendance
4. Click "Verify Record"
5. You should see the verification result with the NFT badge details

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure your `.env` file is in the project root and contains the correct values. Restart the dev server after creating/modifying the `.env` file.

### Issue: "Database Connection Failed"

**Solutions**:
- Verify your Supabase project is running (check the dashboard)
- Check that your API credentials in `.env` are correct
- Ensure you ran all SQL commands to create tables
- Check browser console for specific error messages

### Issue: Real-time not working

**Solutions**:
- Verify that real-time replication is enabled for the `sessions` table (Step 3)
- Check that RLS policies are properly configured (Step 4)
- Open browser DevTools → Network tab and look for WebSocket connections to Supabase

### Issue: "Row Level Security policy violation"

**Solution**: Make sure you've executed all the RLS policy SQL commands from Step 4.

## Database Schema Reference

### Sessions Table

| Column     | Type      | Description                           |
|------------|-----------|---------------------------------------|
| id         | BIGSERIAL | Auto-incrementing primary key         |
| session_id | TEXT      | Unique UUID for the session           |
| nonce      | TEXT      | Unique nonce for QR code security     |
| title      | TEXT      | Session/class title                   |
| date       | DATE      | Session date                          |
| created_at | TIMESTAMP | Timestamp when session was created    |

### Attendance Records Table

| Column         | Type      | Description                              |
|----------------|-----------|------------------------------------------|
| id             | BIGSERIAL | Auto-incrementing primary key            |
| session_id     | TEXT      | Reference to session                     |
| wallet_address | TEXT      | Student's wallet address (lowercase)     |
| email          | TEXT      | Student's email                          |
| token_id       | TEXT      | Generated NFT token ID                   |
| tx_hash        | TEXT      | Simulated blockchain transaction hash    |
| signature      | TEXT      | Cryptographic signature from MetaMask    |
| timestamp      | TIMESTAMP | Timestamp when attendance was marked     |

## Production Recommendations

When deploying to production, consider:

1. **Authentication**: Implement proper user authentication using Supabase Auth
2. **RLS Policies**: Tighten Row Level Security policies to restrict access
3. **Environment Variables**: Use proper secrets management (never commit `.env` to git)
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Blockchain Integration**: Connect to a real blockchain for actual NFT minting
6. **Backup Strategy**: Set up automated database backups in Supabase
7. **Monitoring**: Enable Supabase monitoring and alerts
8. **Email Verification**: Add email verification for students
9. **Admin Role Management**: Implement role-based access control

## Support

For issues with:
- **Supabase**: Check https://supabase.com/docs or their Discord
- **This Project**: Refer to the main README.md or create an issue

---

**Your attendance system is now powered by Supabase with real-time capabilities! 🚀**

When an admin creates a session, it's instantly stored and visible. When a student scans a QR code and marks attendance, it's immediately recorded in the database.
