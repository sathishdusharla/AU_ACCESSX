# AU AccessX - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AU AccessX System                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   Home   │  │  Admin   │  │ Student  │  │  Verify  │  │   Help   │
│   Page   │  │ Portal   │  │  Portal  │  │  Portal  │  │   Page   │
│ (Router) │  │(Auth+QR) │  │(Scan+Pic)│  │ (History)│  │  (FAQ)   │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │             │             │
     │             │              │             │             │
     ├─────────────┼──────────────┼─────────────┼─────────────┤
     │             │              │             │             │
     ▼             ▼              ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase Client                          │
│                      (@supabase/supabase-js)                     │
└─────────────────────────────────────────────────────────────────┘
         │                         │                         │
         │        Real-time        │      Query/Insert      │
         │      WebSocket          │         HTTP           │
         ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               PostgreSQL Database                        │   │
│  │  ┌──────────────────┐  ┌─────────────────────────────┐ │   │
│  │  │  sessions table  │  │ attendance_records table    │ │   │
│  │  └──────────────────┘  └─────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Real-time Engine (WebSockets)                  │   │
│  │     (Pushes new sessions to connected clients)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        Row Level Security (RLS) Policies                 │   │
│  │          (Controls data access permissions)              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Flow 1: Admin Creates Session

```
┌─────────┐
│  Admin  │
└────┬────┘
     │ 1. Enter title & date
     │
     ▼
┌─────────────────────┐
│   AdminPortal.tsx   │
│                     │
│ - Generate UUID     │
│ - Generate Nonce    │
└─────────┬───────────┘
          │ 2. Insert session
          │
          ▼
┌───────────────────────────┐
│    Supabase Client        │
│ supabase.from('sessions') │
│         .insert()         │
└─────────┬─────────────────┘
          │ 3. HTTPS Request
          │
          ▼
┌─────────────────────────────────┐
│      Supabase Backend           │
│  ┌───────────────────────────┐  │
│  │    sessions table         │  │
│  │  - session_id (UUID)      │  │
│  │  - nonce (random)         │  │
│  │  - title                  │  │
│  │  - date                   │  │
│  │  - created_at (timestamp) │  │
│  └───────────┬───────────────┘  │
│              │                   │
│              │ 4. Real-time      │
│              │    broadcast      │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │  Real-time Engine         │  │
│  │  (WebSocket broadcast)    │  │
│  └───────────┬───────────────┘  │
└──────────────┼───────────────────┘
               │ 5. WebSocket push
               │
               ▼
┌───────────────────────────┐
│   AdminPortal.tsx         │
│   (Real-time listener)    │
│                           │
│ - Receives new session    │
│ - Updates state           │
│ - Renders QR code ✨      │
└───────────────────────────┘
```

**Result**: QR code appears **instantly** without page refresh!

### Flow 2: Student Marks Attendance

```
┌──────────┐
│ Student  │
└─────┬────┘
      │ 1. Connect wallet
      │    (MetaMask)
      ▼
┌──────────────────────┐
│ StudentPortal.tsx    │
│                      │
│ - Get wallet address │
└──────┬───────────────┘
       │ 2. Enter email
       │
       ▼
┌──────────────────────┐
│   QRScanner.tsx      │
│                      │
│ - Scan QR code       │
│ - Extract:           │
│   • session_id       │
│   • nonce            │
└──────┬───────────────┘
       │ 3. Scanned data
       │
       ▼
┌────────────────────────────────────┐
│     StudentPortal.tsx              │
│                                    │
│ 4. Create message:                 │
│    "Attendance Request             │
│     Email: student@college.edu     │
│     Session: abc-123...            │
│     Nonce: xyz-789..."             │
└──────┬─────────────────────────────┘
       │ 5. Request signature
       │
       ▼
┌─────────────────────┐
│     MetaMask        │
│  (Browser Extension)│
│                     │
│ - User approves     │
│ - Signs message     │
│ - Returns signature │
└──────┬──────────────┘
       │ 6. Signature
       │
       ▼
┌────────────────────────────────────┐
│     StudentPortal.tsx              │
│                                    │
│ 7. Verify signature using ethers.js│
│    - Recover address from sig      │
│    - Check matches wallet          │
│                                    │
│ 8. Generate token data:            │
│    - token_id (random)             │
│    - tx_hash (simulated)           │
└──────┬─────────────────────────────┘
       │ 9. Insert record
       │
       ▼
┌────────────────────────────────────────┐
│         Supabase Client                │
│ supabase.from('attendance_records')    │
│         .insert()                      │
└──────┬─────────────────────────────────┘
       │ 10. HTTPS Request
       │
       ▼
┌──────────────────────────────────────────────┐
│         Supabase Backend                     │
│  ┌────────────────────────────────────────┐  │
│  │   attendance_records table             │  │
│  │  - session_id                          │  │
│  │  - wallet_address                      │  │
│  │  - email                               │  │
│  │  - token_id                            │  │
│  │  - tx_hash                             │  │
│  │  - signature                           │  │
│  │  - timestamp                           │  │
│  │                                        │  │
│  │  CONSTRAINT: UNIQUE(session_id,        │  │
│  │                     wallet_address)    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
       │ 11. Insert success
       │
       ▼
┌────────────────────────────┐
│    StudentPortal.tsx       │
│                            │
│ - Show success screen      │
│ - Display token_id         │
│ - Display tx_hash          │
└────────────────────────────┘
```

**Result**: Attendance is recorded **instantly** in the database!

### Flow 3: Validator Checks Attendance

```
┌───────────┐
│ Validator │
└─────┬─────┘
      │ 1. Enter session_id
      │    and wallet_address
      ▼
┌───────────────────────────┐
│  ValidatorPortal.tsx      │
└─────┬─────────────────────┘
      │ 2. Query database
      │
      ▼
┌────────────────────────────────────────┐
│         Supabase Client                │
│ supabase.from('attendance_records')    │
│         .select()                      │
│         .eq('session_id', ...)         │
│         .eq('wallet_address', ...)     │
└──────┬─────────────────────────────────┘
       │ 3. Query request
       │
       ▼
┌──────────────────────────────────────────────┐
│         Supabase Backend                     │
│  ┌────────────────────────────────────────┐  │
│  │   attendance_records table             │  │
│  │                                        │  │
│  │  Search for matching record...         │  │
│  └────────────┬───────────────────────────┘  │
└───────────────┼──────────────────────────────┘
                │ 4. Return result
                │
                ▼
┌────────────────────────────────────────┐
│      ValidatorPortal.tsx               │
│                                        │
│ If found:                              │
│  ✅ Show "Verified"                    │
│  - Display NFT badge                   │
│  - Show student email                  │
│  - Show timestamp                      │
│                                        │
│ If not found:                          │
│  ❌ Show "Not Verified"                │
│  - Display error message               │
└────────────────────────────────────────┘
```

## Database Schema

### sessions table

| Column      | Type      | Constraints        | Description                        |
|-------------|-----------|--------------------|------------------------------------|
| id          | BIGSERIAL | PRIMARY KEY        | Auto-incrementing ID               |
| session_id  | TEXT      | UNIQUE, NOT NULL   | UUID for session                   |
| nonce       | TEXT      | NOT NULL           | Random nonce for security          |
| title       | TEXT      | NOT NULL           | Session/class title                |
| date        | DATE      | NOT NULL           | Date of the session                |
| created_at  | TIMESTAMP | DEFAULT NOW()      | When session was created           |

**Indexes:**
- `idx_sessions_session_id` on `session_id` (for fast lookups)
- `idx_sessions_created_at` on `created_at DESC` (for sorting)

### attendance_records table

| Column         | Type      | Constraints                      | Description                        |
|----------------|-----------|----------------------------------|------------------------------------|
| id             | BIGSERIAL | PRIMARY KEY                      | Auto-incrementing ID               |
| session_id     | TEXT      | NOT NULL, FOREIGN KEY            | References sessions.session_id     |
| wallet_address | TEXT      | NOT NULL                         | Student's Ethereum address         |
| email          | TEXT      | NOT NULL                         | Student's email                    |
| token_id       | TEXT      | NOT NULL                         | Generated NFT token ID             |
| tx_hash        | TEXT      | NOT NULL                         | Simulated transaction hash         |
| signature      | TEXT      | NOT NULL                         | MetaMask signature                 |
| timestamp      | TIMESTAMP | DEFAULT NOW()                    | When attendance was marked         |

**Constraints:**
- `UNIQUE(session_id, wallet_address)` - Prevents duplicate attendance

**Indexes:**
- `idx_attendance_session_id` on `session_id`
- `idx_attendance_wallet` on `wallet_address`
- `idx_attendance_timestamp` on `timestamp DESC`

## Security Model

### Cryptographic Verification

```
┌─────────────────────────────────────────────────────────────────┐
│              Attendance Verification Process                     │
└─────────────────────────────────────────────────────────────────┘

1. Student creates message:
   ┌──────────────────────────────────────┐
   │ "Attendance Request                  │
   │  Email: student@college.edu          │
   │  Session: abc-123-def-456            │
   │  Nonce: xyz-789"                     │
   └──────────────────────────────────────┘

2. MetaMask signs message with private key:
   ┌──────────────────────────────────────┐
   │  Signature =                         │
   │  sign(message, privateKey)           │
   │                                      │
   │  Result: 0x1234abcd5678ef...         │
   └──────────────────────────────────────┘

3. System verifies signature:
   ┌──────────────────────────────────────┐
   │  recoveredAddress =                  │
   │  recoverAddress(message, signature)  │
   │                                      │
   │  if (recoveredAddress == wallet)     │
   │    ✅ Valid signature                │
   │  else                                │
   │    ❌ Invalid signature              │
   └──────────────────────────────────────┘

4. Additional checks:
   ✓ Session ID exists in database
   ✓ Nonce matches session
   ✓ No duplicate attendance (UNIQUE constraint)
```

### Row Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────┐
│                 Supabase RLS Policies                        │
└─────────────────────────────────────────────────────────────┘

Current Setup (Development):
  - Public read access on both tables
  - Public insert access on both tables

Production Recommendations:
  ┌────────────────────────────────────────┐
  │  sessions table:                       │
  │  • SELECT: Public                      │
  │  • INSERT: Admin role only             │
  │  • UPDATE: Admin role only             │
  │  • DELETE: Admin role only             │
  └────────────────────────────────────────┘

  ┌────────────────────────────────────────┐
  │  attendance_records table:             │
  │  • SELECT: Public (for verification)   │
  │  • INSERT: Authenticated users only    │
  │  • UPDATE: Never allowed               │
  │  • DELETE: Admin role only             │
  └────────────────────────────────────────┘
```

## Real-time System

### How Real-time Works

```
1. Admin creates session
         ↓
2. Supabase inserts into 'sessions' table
         ↓
3. Replication engine detects INSERT
         ↓
4. Broadcasts via WebSocket to all subscribers
         ↓
5. AdminPortal receives update
         ↓
6. React state updates automatically
         ↓
7. QR code renders instantly ✨
```

**No polling needed!** The system is event-driven.

### WebSocket Connection

```
Client                              Server
  │                                   │
  │  1. Subscribe to channel          │
  ├──────────────────────────────────>│
  │                                   │
  │  2. WebSocket established         │
  │<──────────────────────────────────┤
  │                                   │
  │        (time passes...)           │
  │                                   │
  │                                   │ 3. INSERT detected
  │                                   │
  │  4. Real-time event               │
  │<──────────────────────────────────┤
  │     {                             │
  │       event: 'INSERT',            │
  │       table: 'sessions',          │
  │       new: { ... }                │
  │     }                             │
  │                                   │
  │  5. Update local state            │
  │                                   │
```

## Summary

### Key Features

✅ **Real-time Updates**
- Sessions appear instantly when created
- No page refresh needed
- Event-driven architecture

✅ **Cryptographic Security**
- MetaMask signatures prove authenticity
- Can't forge attendance without private key
- Nonce prevents QR code reuse

✅ **Database Integrity**
- UNIQUE constraints prevent duplicates
- Foreign keys maintain referential integrity
- Indexes ensure fast queries

✅ **Instant Recording**
- Attendance stored immediately
- No backend server needed
- Direct database access via Supabase

### Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: WebSockets (Supabase Realtime)
- **Authentication**: MetaMask (Ethereum signatures)
- **Deployment**: Static hosting (Vercel/Netlify)

### No Traditional Backend!

This system has **no Express.js server** - all backend logic is handled by:
1. **Supabase** - Database + Real-time + API
2. **Browser** - Signature verification via ethers.js
3. **MetaMask** - Cryptographic signing

This makes it:
- ✅ Easier to deploy
- ✅ Cheaper to run
- ✅ More scalable
- ✅ Faster (no server roundtrip)
