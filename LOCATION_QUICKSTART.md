# Location-Based Attendance - Quick Start Guide

## 🚀 Setup (5 Minutes)

### Step 1: Database Migration
Run this SQL in your Supabase SQL Editor:

```sql
-- Add location columns
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS instructor_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS instructor_longitude DOUBLE PRECISION;

ALTER TABLE attendance_records
ADD COLUMN IF NOT EXISTS student_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS student_longitude DOUBLE PRECISION;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sessions_location 
ON sessions(instructor_latitude, instructor_longitude);

CREATE INDEX IF NOT EXISTS idx_attendance_location 
ON attendance_records(student_latitude, student_longitude);
```

**Or:** Run the complete script from `ADD_LOCATION_TRACKING.sql`

### Step 2: Deploy Code
The location tracking code is already implemented in:
- ✅ `lib/locationUtils.ts` - Location utilities
- ✅ `types.ts` - Updated interfaces
- ✅ `pages/AdminPortal.tsx` - Instructor capture
- ✅ `pages/StudentPortal.tsx` - Student validation

Just deploy your updated code!

### Step 3: Test
1. Create a session (allow location when prompted)
2. Try marking attendance from same location → Should work ✅
3. Try marking from far away → Should be rejected ❌

---

## 📱 How to Use

### For Instructors
1. Go to Admin Portal
2. Login with wallet
3. Create session (fill details)
4. **IMPORTANT**: Allow location when browser asks
5. QR code appears → Share with students

**If location denied:** Session won't be created (students need it!)

### For Students
1. Go to Student Portal
2. Connect wallet, enter email
3. Scan instructor's QR code
4. Take face photo
5. **IMPORTANT**: Allow location when browser asks
6. Submit attendance

**Success conditions:**
- ✅ Within 100 meters of instructor
- ✅ During valid time window (10 min from start)
- ✅ Location permission granted

**Rejection reasons:**
- ❌ Too far from instructor (shows actual distance)
- ❌ Location permission denied
- ❌ Session has no location data

---

## 🔧 Quick Configuration

### Change Proximity Distance
**File:** `pages/StudentPortal.tsx` (around line 160)
```typescript
const proximityCheck = isWithinProximity(
  studentLat, studentLon,
  sessionData.instructor_latitude,
  sessionData.instructor_longitude,
  100  // ← Change to 50, 200, etc. (meters)
);
```

---

## ⚠️ Common Issues & Solutions

### "Location access denied"
**Solution:** 
- Enable location services in device settings
- Allow location in browser permissions
- Use HTTPS (required for geolocation)

### "You are too far"
**Solution:**
- Move closer to instructor (within 100m)
- Check if you scanned the correct QR code
- Ask instructor for their current location

### "Session does not have location tracking"
**Solution:**
- Instructor needs to create a new session
- Make sure instructor allowed location
- Run database migration if not done

### Sessions won't create
**Solution:**
- Instructor must allow location permission
- Check browser supports geolocation
- Ensure HTTPS is enabled
- Try different browser

---

## 📊 Validation Rules

| Check | Requirement | Error if Failed |
|-------|-------------|-----------------|
| **Instructor Location** | Must be captured when creating session | Session creation blocked |
| **Student Location** | Must be captured when marking attendance | Attendance blocked |
| **Proximity** | Student ≤ 100m from instructor | "Too far: [X]m" |
| **Time Window** | Within 10 min of session start | "QR expired" |
| **Permissions** | Location allowed in browser | "Location denied" |

---

## 🎯 Testing Checklist

Quick tests to verify everything works:

- [ ] **Database Migration**
  - Run SQL in Supabase
  - Verify columns exist (see verification queries in SQL file)

- [ ] **Instructor Flow**
  - Create session → Location prompt appears
  - Allow location → Session created successfully
  - Deny location → Error shown, session blocked
  - QR code displays correctly

- [ ] **Student Flow (Close Range)**
  - Scan QR from same location as instructor
  - Allow location → Attendance marked ✅

- [ ] **Student Flow (Far Range)**
  - Simulate being far away (or actually move far)
  - Attendance rejected with distance shown ❌

- [ ] **Error Messages**
  - Clear and helpful
  - Show actual distance when too far
  - Explain what to do

---

## 📝 Key Points

✅ **100 meter proximity** - Default, configurable  
✅ **Haversine formula** - Accurate distance calculation  
✅ **Browser permissions** - Both instructor & student need to allow  
✅ **HTTPS required** - Geolocation API requirement  
✅ **Database migration** - Must run SQL before using  

---

## 📚 Documentation Files

- `LOCATION_TRACKING_GUIDE.md` - Comprehensive guide
- `LOCATION_FEATURE_SUMMARY.md` - Implementation details
- `LOCATION_FLOW_DIAGRAM.md` - Visual flow diagrams
- `ADD_LOCATION_TRACKING.sql` - Database migration

---

## 🆘 Need Help?

1. Check error message (they're descriptive!)
2. Review `LOCATION_TRACKING_GUIDE.md` troubleshooting section
3. Verify HTTPS is enabled
4. Check browser console for details
5. Ensure database migration ran successfully

---

**Ready to go!** 🎉

Just run the SQL migration and your location-based attendance is live!
