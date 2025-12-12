# 🎯 Quick Reference Card

## Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Setup

Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxx
```

## Supabase - Quick SQL Setup

Copy this entire block and run in Supabase SQL Editor:

```sql
-- Create tables
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  nonce TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Indexes
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_attendance_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_wallet ON attendance_records(wallet_address);

-- Foreign key
ALTER TABLE attendance_records 
ADD CONSTRAINT fk_attendance_session 
FOREIGN KEY (session_id) 
REFERENCES sessions(session_id) 
ON DELETE CASCADE;

-- RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on sessions" 
ON sessions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access on sessions" 
ON sessions FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read access on attendance_records" 
ON attendance_records FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access on attendance_records" 
ON attendance_records FOR INSERT TO public WITH CHECK (true);
```

## Routes

| Route        | Portal    | Purpose                        |
|--------------|-----------|--------------------------------|
| `/`          | Redirect  | Goes to `/student`             |
| `/admin`     | Admin     | Create sessions & QR codes     |
| `/student`   | Student   | Mark attendance                |
| `/validator` | Validator | Verify attendance records      |

## Testing Flow

1. **Admin**: Create session → Get QR code
2. **Student**: Connect wallet → Scan QR → Sign → Minted!
3. **Validator**: Enter IDs → Verify record

## Files You Must Edit

1. `.env` - Add your Supabase credentials

## Files You Can Ignore

1. `server.js` - No longer used (old backend)
2. `.env.example` - Just a template

## Key Features

✅ Real-time session updates  
✅ Instant attendance recording  
✅ MetaMask signature verification  
✅ Duplicate prevention  
✅ No backend server needed

## Documentation

| File                | What's Inside                  |
|---------------------|--------------------------------|
| QUICKSTART.md       | 5-minute setup guide           |
| SUPABASE_SETUP.md   | Detailed Supabase guide        |
| ARCHITECTURE.md     | System design & data flows     |
| SUMMARY.md          | What changed & why             |
| README.md           | Full project documentation     |

## Common Issues

**"Missing environment variables"**
→ Create `.env` with Supabase URL & key

**"Database Connection Failed"**
→ Run SQL commands in Supabase

**Real-time not working**
→ Enable replication for `sessions` table

**MetaMask not connecting**
→ Install MetaMask browser extension

## Supabase Dashboard Checklist

- [ ] Project created
- [ ] Tables created (SQL Editor)
- [ ] Real-time enabled (Database → Replication)
- [ ] API keys copied (Settings → API)

## Local Setup Checklist

- [ ] `.env` file created
- [ ] `npm install` completed
- [ ] `npm run dev` running
- [ ] Browser opened to localhost

## That's It!

Read [QUICKSTART.md](QUICKSTART.md) for detailed steps.

**Total setup time: ~10 minutes** ⏱️
