# 🎯 Quick Reference Card

## Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run lint
```

## Environment Setup

Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxx
```

## Database Setup - Run These SQL Files in Order

### 1. INSTRUCTOR_SETUP.sql
Creates instructors table, adds student_image column, inserts demo instructor:
- Wallet: `0xbe10291cb3df442736bfda6c78dfbf4519b6eac6`
- Email: `23eg105a16@anurag.edu.in`
- Password: `@Sathish240605`

### 2. ADD_START_TIME_COLUMN.sql
Adds time-based access control:
```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time TIME;
```

## Application Routes

| Route        | Portal    | Purpose                           | Navigation Links        |
|--------------|-----------|-----------------------------------|-------------------------|
| `/`          | Home      | Landing page with role selection  | Home, Help              |
| `/admin`     | Admin     | Create sessions, manage records   | Home, Admin, Help       |
| `/student`   | Student   | Mark attendance via QR            | Home, Student, Help     |
| `/validator` | Verify    | View attendance history           | Home, Verify, Help      |
| `/help`      | Help      | FAQ and troubleshooting           | Home, Help              |

## Key Features by Portal

### Home Page
- Role selection cards (Student/Admin/Verify)
- Feature highlights with icons
- Statistics bar
- Responsive design

### Admin Portal
- Instructor authentication (wallet + email + password)
- Session creation with start/end times
- QR code generation
- Attendance management with photos
- PDF report download
- Real-time session updates
- Remove students from attendance
- Delete sessions

### Student Portal
- MetaMask wallet connection
- Email input
- QR code scanning
- **Time validation** (10-minute window)
- Photo capture (mandatory)
- Digital signature
- NFT badge receipt

### Verify Portal
- View complete attendance history
- Student photo display
- PDF report download
- Token ID and transaction hash display

### Help Page
- Student Portal FAQ
- Admin Portal FAQ
- Verify Portal FAQ
- Troubleshooting guides
- Portal quick links

## Testing Flow

1. **Open Home Page**: See role selection cards
2. **Admin Login**: Use demo credentials above
3. **Create Session**: Enter title, date, start time (e.g., 09:00), end time (e.g., 10:30)
4. **QR Display**: Session card shows timing and QR code
5. **Student Scan**: Within 10 minutes of start time, scan QR
6. **Photo Capture**: Take photo with camera
7. **Sign & Submit**: MetaMask signature, receive NFT badge
8. **View Attendance**: Admin clicks "View Attendance" to see student with photo
9. **Download PDF**: Both student and admin can download reports
10. **Verify History**: Student checks verify portal for complete history

## Time-Based Validation

**QR Code Validity:**
- Valid from: `session_date` at `start_time`
- Valid until: `start_time + 10 minutes`
- Example: Session starts 09:00, QR expires at 09:10

**Error Messages:**
- Before start: "Session has not started yet"
- After 10 mins: "QR code has expired. Valid for first 10 minutes only."

## Database Schema Quick Reference

### instructors
- `id` (UUID)
- `wallet_address` (TEXT, unique)
- `email` (TEXT)
- `password_hash` (TEXT, SHA-256)
- `created_at` (TIMESTAMPTZ)

### sessions
- `id` (UUID)
- `session_id` (TEXT, unique, for QR)
- `nonce` (TEXT)
- `title` (TEXT)
- `date` (DATE)
- `start_time` (TIME) ← NEW
- `end_time` (TIME) ← NEW
- `instructor_wallet` (TEXT)
- `created_at` (TIMESTAMPTZ)

### attendance_records
- `id` (UUID)
- `session_id` (TEXT)
- `wallet_address` (TEXT)
- `email` (TEXT)
- `signature` (TEXT)
- `student_image` (TEXT, base64) ← Photo
- `token_id` (TEXT)
- `tx_hash` (TEXT)
- `timestamp` (TIMESTAMPTZ)
- UNIQUE(`session_id`, `wallet_address`)

## Files You Must Edit

1. `.env` - Add your Supabase credentials

## Files You Should NOT Edit

- `node_modules/` (auto-generated)
- `dist/` (build output)
- `.git/` (version control)

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "MetaMask not found" | Install MetaMask extension |
| "Invalid credentials" | Check wallet, email, password match |
| "QR code expired" | Must scan within 10 mins of start time |
| "Attendance already marked" | Each wallet can only mark once per session |
| "Camera not working" | Allow camera permissions in browser |
| Sessions not appearing | Enable real-time on sessions table in Supabase |
| PDF not downloading | Check browser popup blocker |

## Deployment Checklist

- [ ] Run `npm run build`
- [ ] Set environment variables on hosting platform
- [ ] Deploy `dist/` folder
- [ ] Test all portals on live URL
- [ ] Verify MetaMask connections work
- [ ] Test QR scanning on mobile devices
- [ ] Check PDF downloads
- [ ] Verify real-time updates

## Security Notes

⚠️ **Never commit `.env` file to Git**  
✅ Password is SHA-256 hashed  
✅ Signatures cryptographically verified  
✅ Time-based validation prevents fraud  
✅ Photos prevent proxy attendance  
✅ Database constraints prevent duplicates  

## Need Help?

1. Check [PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md) for complete details
2. Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for database issues
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) for data flows
4. See Help Page in app for user-facing FAQs
