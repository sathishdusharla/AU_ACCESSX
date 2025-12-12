# ✅ SETUP CHECKLIST

Print this page and check off items as you complete them!

---

## Phase 1: Supabase Setup (10 minutes)

### Create Account & Project

- [ ] Go to https://supabase.com
- [ ] Sign up for free account
- [ ] Click "New Project"
- [ ] Enter project name: `au-accessx`
- [ ] Choose strong database password (save it!)
- [ ] Select region closest to you
- [ ] Click "Create new project"
- [ ] Wait 1-2 minutes for provisioning

### Create Database Tables

- [ ] Click "SQL Editor" in left sidebar
- [ ] Click "New Query"
- [ ] Open `QUICKSTART.md` in this project
- [ ] Copy the entire SQL block from section 2
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" button
- [ ] Verify: "Success. No rows returned" message appears

### Enable Real-time

- [ ] Click "Database" in left sidebar
- [ ] Click "Replication" submenu
- [ ] Find `sessions` table in the list
- [ ] Toggle switch to **ON** (should turn green)
- [ ] Wait 2-3 seconds (auto-saves)

### Get API Credentials

- [ ] Click ⚙️ gear icon (Project Settings) at bottom
- [ ] Click "API" in settings menu
- [ ] Copy **Project URL** (save for later)
- [ ] Copy **anon public key** (save for later)

✅ **Supabase setup complete!**

---

## Phase 2: Local Setup (5 minutes)

### Install Dependencies

- [ ] Open terminal
- [ ] Navigate to project folder:
  ```bash
  cd "copy-of-au-accessx (1)"
  ```
- [ ] Install packages:
  ```bash
  npm install
  ```
- [ ] Wait for installation (1-2 minutes)

### Configure Environment

- [ ] Copy example file:
  ```bash
  cp .env.example .env
  ```
- [ ] Open `.env` file in editor
- [ ] Paste your Project URL:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  ```
- [ ] Paste your anon key:
  ```
  VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx
  ```
- [ ] Save file

### Start Development Server

- [ ] Run in terminal:
  ```bash
  npm run dev
  ```
- [ ] Look for URL in output (usually `http://localhost:5173`)
- [ ] Open that URL in browser

✅ **Local setup complete!**

---

## Phase 3: Testing (5 minutes)

### Test Admin Portal

- [ ] Navigate to `/admin` route
- [ ] Enter title: "Test Session"
- [ ] Select today's date
- [ ] Click "Generate Session"
- [ ] Verify QR code appears **instantly**
- [ ] Check Supabase dashboard → Table Editor → `sessions`
- [ ] Verify new row exists in sessions table

### Test Student Portal

- [ ] Navigate to `/student` route
- [ ] Click "Connect MetaMask"
- [ ] Install MetaMask if needed
- [ ] Approve connection
- [ ] Enter email: `test@example.com`
- [ ] Scan QR code (or manually enter session details)
- [ ] Click "Sign & Mint Attendance"
- [ ] Approve signature in MetaMask
- [ ] Verify success screen appears
- [ ] Check Supabase → `attendance_records` table
- [ ] Verify new row exists

### Test Validator Portal

- [ ] Navigate to `/validator` route
- [ ] Enter Session ID from admin portal
- [ ] Enter Wallet Address used in student portal
- [ ] Click "Verify Record"
- [ ] Verify green "Verified" badge appears
- [ ] Check details match what was entered

### Test Real-time

- [ ] Open Admin Portal in one browser tab
- [ ] Open Admin Portal in another browser tab (side by side)
- [ ] Create session in first tab
- [ ] Verify it appears **instantly** in second tab (no refresh!)

✅ **All tests passed!**

---

## Phase 4: Verify in Supabase (2 minutes)

### Check Data

- [ ] Go to Supabase Dashboard
- [ ] Click "Table Editor"
- [ ] Click `sessions` table
- [ ] Verify test session exists
- [ ] Note the `session_id` value
- [ ] Click `attendance_records` table
- [ ] Verify attendance record exists
- [ ] Verify `session_id` matches

### Check Real-time

- [ ] Go to "Database" → "Replication"
- [ ] Verify `sessions` has green "ON" indicator
- [ ] Go to "Database" → "Policies"
- [ ] Verify 4 policies exist (2 for sessions, 2 for attendance_records)

✅ **Database verified!**

---

## Phase 5: Production Readiness (Optional)

### Security Improvements

- [ ] Review RLS policies in `SUPABASE_SETUP.md`
- [ ] Implement Supabase Auth (optional)
- [ ] Restrict session creation to admin users
- [ ] Add rate limiting

### Deployment

- [ ] Create production `.env` file
- [ ] Deploy to Vercel/Netlify
- [ ] Test production deployment
- [ ] Set up monitoring

### Blockchain Integration

- [ ] Set up real blockchain provider
- [ ] Deploy NFT smart contract
- [ ] Replace simulated minting with real transactions

✅ **Production ready!**

---

## Troubleshooting Checklist

If something doesn't work, check:

### Environment Issues

- [ ] `.env` file exists in project root
- [ ] `.env` contains correct Supabase URL
- [ ] `.env` contains correct anon key
- [ ] Dev server was restarted after creating `.env`

### Database Issues

- [ ] SQL commands ran successfully in Supabase
- [ ] Both tables (`sessions`, `attendance_records`) exist
- [ ] RLS policies are created
- [ ] Real-time replication is enabled for `sessions`

### Browser Issues

- [ ] MetaMask extension is installed
- [ ] MetaMask is connected to a network
- [ ] Browser console shows no errors
- [ ] Cookies/local storage are enabled

### Connection Issues

- [ ] Internet connection is stable
- [ ] Supabase project status is "Active"
- [ ] No firewall blocking WebSocket connections
- [ ] Browser DevTools → Network shows successful requests

---

## Success Criteria

Your setup is complete when:

✅ Admin can create sessions → QR appears instantly  
✅ Student can scan QR → Attendance stored instantly  
✅ Validator can verify → Records shown correctly  
✅ Data appears in Supabase Table Editor  
✅ Real-time works (no page refresh needed)  
✅ No errors in browser console  
✅ No TypeScript errors  

---

## Quick Reference

**Documentation files:**
- `QUICKSTART.md` - Start here!
- `SUPABASE_SETUP.md` - Detailed guide
- `ARCHITECTURE.md` - How it works
- `SUMMARY.md` - What changed
- `QUICK_REFERENCE.md` - Commands cheat sheet

**Support:**
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

---

## Time Estimates

- Supabase Setup: ~10 minutes
- Local Setup: ~5 minutes
- Testing: ~5 minutes
- **Total: ~20 minutes**

---

**🎉 When all boxes are checked, you're done!**

Your attendance system is fully operational with:
- Real-time updates
- Instant recording
- No backend server
- Production-ready architecture

**Happy coding! 🚀**
