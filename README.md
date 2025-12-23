# AU AccessX - Blockchain Attendance System

<div align="center">

**A modern, secure attendance tracking system using QR codes, MetaMask signatures, photo verification, and Supabase real-time database with time-based access control.**

[Features](#features) • [Quick Start](#quick-start) • [Setup](#setup) • [Documentation](#documentation) • [Architecture](#architecture)

</div>

---

## 🎯 Features

### Core Portals
- **Home Page**: Beautiful landing page with role selection cards and feature highlights
- **Admin Portal**: Create time-based sessions, generate QR codes, manage attendance, download PDF reports
- **Student Portal**: Scan QR codes, capture photo verification, mark attendance with MetaMask signatures
- **Verify Portal**: View complete attendance history, download personal attendance reports
- **Help Page**: Comprehensive FAQ and troubleshooting guide for all portals

### Advanced Features
- **Time-Based Access Control**: QR codes valid only within 10-minute window from session start time
- **Photo Verification**: Mandatory photo capture prevents proxy attendance
- **PDF Reports**: Downloadable attendance reports for both students and instructors
- **Context-Aware Navigation**: Dynamic navbar showing only relevant portal links
- **Real-time Updates**: Sessions appear instantly using Supabase real-time subscriptions
- **Cryptographic Security**: Ethereum signatures for tamper-proof proof of attendance
- **NFT Badges**: Students receive verifiable digital attendance certificates
- **Session Duration Display**: Shows complete timing (start-end) on session cards
- **Duplicate Prevention**: Database-level constraints prevent multiple attendance submissions
- **Beautiful UI**: Modern glass-morphism design with smooth animations and responsive layout

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** installed
- **MetaMask** browser extension (for wallet authentication)
- **Supabase** account (free tier works perfectly)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd "copy-of-au-accessx (1)"
   npm install
   ```

2. **Configure Supabase Database**
   
   **Option A - Quick Setup (5 minutes):** Follow [QUICKSTART.md](QUICKSTART.md)
   
   **Option B - Detailed Setup:** Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
   
   Essential steps:
   - Create a Supabase project at https://supabase.com
   - Run SQL scripts:
     - [INSTRUCTOR_SETUP.sql](INSTRUCTOR_SETUP.sql) - Creates tables and demo instructor
     - [ADD_START_TIME_COLUMN.sql](ADD_START_TIME_COLUMN.sql) - Adds time-based access control
   - Enable real-time for `sessions` table
   - Copy your Supabase URL and anon key

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   
   Navigate to `http://localhost:5173`
   
   **Demo Instructor Credentials:**
   - Wallet: `0xbe10291cb3df442736bfda6c78dfbf4519b6eac6`
   - Email: `23eg105a16@anurag.edu.in`
   - Password: `@Sathish240605`

## 📖 Setup

### Step 1: Supabase Configuration

Create a Supabase project and set up the database:

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for complete database setup including:
- Creating tables (`sessions` and `attendance_records`)
- Enabling real-time features
- Configuring Row Level Security policies

### Step 2: Database Tables

Execute these SQL commands in Supabase SQL Editor:

**Sessions Table:**
```sql
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
```

**Attendance Records Table:**
```sql
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
```

### Step 3: Enable Real-time

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Enable replication for `sessions` table
3. This allows instant session updates in Admin Portal

### Step 4: Configure RLS Policies

```sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Public access policies (adjust for production)
CREATE POLICY "Allow public read access on sessions" 
ON sessions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access on sessions" 
ON sessions FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read access on attendance_records" 
ON attendance_records FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access on attendance_records" 
ON attendance_records FOR INSERT TO public WITH CHECK (true);
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (via inline styles)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Real-time subscriptions
- **Authentication**: MetaMask (Ethereum signatures)
- **QR Code**: html5-qrcode + react-qr-code

### How It Works

1. **Admin Creates Session** (Admin Portal)
   - Admin enters class title and date
   - System generates unique `session_id` and `nonce`
   - Session is inserted into Supabase
   - Real-time subscription instantly updates UI with QR code

2. **Student Marks Attendance** (Student Portal)
   - Student connects MetaMask wallet
   - Scans QR code containing `session_id` and `nonce`
   - Signs message with MetaMask (cryptographic proof)
   - System verifies signature matches wallet address
   - Attendance record inserted into Supabase instantly

3. **Validator Checks Attendance** (Validator Portal)
   - Enter session ID and wallet address
   - System queries Supabase for matching record
   - Displays verification status with NFT badge details

### Real-time Features

- **Instant Session Creation**: When admin creates a session, it appears immediately in the UI via Supabase real-time subscriptions
- **Instant Attendance Recording**: When student marks attendance, it's stored in database immediately
- No polling required - everything is event-driven

## 📁 Project Structure

```
au-accessx/
├── components/
│   ├── Navbar.tsx          # Navigation bar
│   └── QRScanner.tsx       # QR code scanner component
├── pages/
│   ├── AdminPortal.tsx     # Admin dashboard (create sessions)
│   ├── StudentPortal.tsx   # Student interface (mark attendance)
│   └── ValidatorPortal.tsx # Verification interface
├── lib/
│   └── supabase.ts         # Supabase client configuration
├── App.tsx                 # Main app with routing
├── types.ts                # TypeScript interfaces
├── .env.example            # Environment variables template
├── SUPABASE_SETUP.md       # Detailed Supabase setup guide
└── README.md               # This file
```

## 🔒 Security

- **Cryptographic Signatures**: Uses Ethereum's `personal_sign` for attendance proof
- **Nonce Protection**: Prevents QR code reuse across different sessions
- **Duplicate Prevention**: Database constraints prevent double attendance
- **Row Level Security**: Supabase RLS policies control data access

## 📚 Documentation

- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Complete Supabase setup guide
- **[.env.example](.env.example)** - Environment variables template

## 🎨 User Flows

### Admin Flow
1. Navigate to `/admin`
2. Enter session title (e.g., "Data Structures & Algorithms")
3. Select date
4. Click "Generate Session"
5. QR code appears instantly
6. Share QR code with students (display or print)

### Student Flow
1. Navigate to `/student`
2. Click "Connect MetaMask"
3. Enter college email
4. Scan QR code from admin's screen
5. Click "Sign & Mint Attendance"
6. Approve signature in MetaMask
7. Receive confirmation with token ID

### Validator Flow
1. Navigate to `/validator`
2. Enter session ID and wallet address
3. Click "Verify Record"
4. View verification result with badge details

## 🐛 Troubleshooting

**Issue: "Missing Supabase environment variables"**
- Ensure `.env` file exists in project root
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after modifying `.env`

**Issue: "Database Connection Failed"**
- Verify Supabase project is active
- Check API credentials are correct
- Ensure database tables are created
- Check RLS policies are configured

**Issue: Real-time not working**
- Enable replication for `sessions` table in Supabase
- Check browser console for WebSocket errors
- Verify RLS policies allow public access

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Production Considerations

- [ ] Implement proper authentication (Supabase Auth)
- [ ] Tighten RLS policies for security
- [ ] Add rate limiting
- [ ] Set up database backups
- [ ] Enable Supabase monitoring
- [ ] Connect to real blockchain for actual NFT minting
- [ ] Add email verification
- [ ] Implement admin role management

## 📝 License

MIT License - feel free to use this project for educational purposes.

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit PRs.

---

**Built with ❤️ using React, TypeScript, and Supabase**
