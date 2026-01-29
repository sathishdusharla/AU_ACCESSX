# Location-Based Attendance Tracking

## Overview
This feature adds geolocation-based proximity validation to the attendance system. Students can only mark attendance when they are physically near the instructor's location (within 100 meters).

## How It Works

### 1. Instructor Session Creation
When an instructor creates a new session:
- The system captures the instructor's current GPS location
- Location (latitude & longitude) is stored with the session
- If location capture fails, the session creation is blocked with a warning
- Students cannot mark attendance for sessions without location data

### 2. Student Attendance Marking
When a student scans the QR code and attempts to mark attendance:
- The system captures the student's current GPS location
- Calculates the distance between student and instructor using the Haversine formula
- Only allows attendance if the student is within 100 meters of the instructor
- Student's location is stored with the attendance record

## Technical Implementation

### Database Schema
**Sessions Table:**
- `instructor_latitude` (DOUBLE PRECISION): Instructor's latitude when session was created
- `instructor_longitude` (DOUBLE PRECISION): Instructor's longitude when session was created

**Attendance Records Table:**
- `student_latitude` (DOUBLE PRECISION): Student's latitude when attendance was marked
- `student_longitude` (DOUBLE PRECISION): Student's longitude when attendance was marked

### Location Utilities (`lib/locationUtils.ts`)
- `getCurrentLocation()`: Captures device location using browser Geolocation API
- `calculateDistance()`: Haversine formula implementation for accurate distance calculation
- `isWithinProximity()`: Validates if student is within acceptable range
- `formatDistance()`: Formats distance for user-friendly display

### Validation Flow

#### Admin Portal (`pages/AdminPortal.tsx`)
```typescript
1. Capture location when creating session
2. Store instructor_latitude and instructor_longitude
3. Show error if location capture fails
```

#### Student Portal (`pages/StudentPortal.tsx`)
```typescript
1. Scan QR code
2. Capture student location
3. Retrieve instructor location from session
4. Calculate distance using Haversine formula
5. Reject if distance > 100 meters
6. Store student location with attendance record
```

## Configuration

### Proximity Radius
The default proximity radius is **100 meters**. To change this:

**File:** `pages/StudentPortal.tsx`
```typescript
const proximityCheck = isWithinProximity(
  studentLat,
  studentLon,
  sessionData.instructor_latitude,
  sessionData.instructor_longitude,
  100 // Change this value (in meters)
);
```

### Location Accuracy Settings
**File:** `lib/locationUtils.ts`
```typescript
{
  enableHighAccuracy: true,  // Use GPS for best accuracy
  timeout: 10000,            // 10 second timeout
  maximumAge: 0,             // Don't use cached location
}
```

## User Experience

### Instructor Requirements
✅ Must enable location services in browser  
✅ Must grant location permission when prompted  
✅ Session creation will fail without location access  

### Student Requirements
✅ Must enable location services in browser  
✅ Must grant location permission when prompted  
✅ Must be within 100m of instructor's location  
✅ Receives clear error message with actual distance if too far  

## Error Messages

### Instructor Errors
- **"Could not capture your location. Students will not be able to mark attendance..."**
  - Solution: Enable location services and grant browser permissions

### Student Errors
- **"Location access denied. Please enable location services..."**
  - Solution: Enable location in browser settings
  
- **"You are too far from the instructor's location. Distance: 250m..."**
  - Solution: Move closer to instructor (within 100m)
  
- **"Session does not have location tracking enabled..."**
  - Solution: Contact instructor to create new session with location enabled

## Distance Calculation

The system uses the **Haversine formula** to calculate accurate distances between GPS coordinates:

```typescript
Distance = 2R × arcsin(√(sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)))
```

Where:
- R = Earth's radius (6,371 km)
- φ = latitude in radians
- λ = longitude in radians
- Δφ = difference in latitudes
- Δλ = difference in longitudes

This accounts for Earth's curvature and provides meter-level accuracy.

## Browser Compatibility

### Supported Browsers
✅ Chrome 5+ (Desktop & Mobile)  
✅ Firefox 3.5+ (Desktop & Mobile)  
✅ Safari 5+ (Desktop & Mobile)  
✅ Edge 12+  
✅ Opera 10.6+  

### Requirements
- HTTPS connection (required for geolocation API)
- User permission for location access
- GPS/Location services enabled on device

## Privacy & Security

### Data Storage
- Locations are stored only when sessions are created or attendance is marked
- Coordinates are stored as DOUBLE PRECISION (accurate to ~1mm)
- No continuous tracking - only point-in-time captures

### Privacy Considerations
- Students know location is being captured (explicit permission required)
- Location data is used only for proximity validation
- Historical location data available in attendance records

## Testing

### Test Scenarios

1. **Normal Flow**
   - Instructor creates session with location → Student marks within 100m → Success ✅

2. **Student Too Far**
   - Instructor creates session → Student attempts from 200m away → Rejected with distance ❌

3. **Location Denied (Instructor)**
   - Instructor denies location → Session creation blocked → Clear error message ❌

4. **Location Denied (Student)**
   - Student denies location → Attendance blocked → Clear error message ❌

5. **Session Without Location**
   - Old session (no location data) → Student attempts attendance → Error message ❌

### Manual Testing
1. Open Admin Portal, create session (allow location)
2. Move to different location
3. Open Student Portal, scan QR code
4. Verify distance calculation and acceptance/rejection

## SQL Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- See ADD_LOCATION_TRACKING.sql for complete migration script
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS instructor_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS instructor_longitude DOUBLE PRECISION;

ALTER TABLE attendance_records
ADD COLUMN IF NOT EXISTS student_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS student_longitude DOUBLE PRECISION;
```

## Troubleshooting

### "Geolocation is not supported"
- Use HTTPS (required for geolocation API)
- Update to modern browser

### Inaccurate Distance
- Ensure `enableHighAccuracy: true` in settings
- Wait for GPS lock (may take 5-10 seconds)
- Move to open area (away from buildings)

### Location Permission Issues
- Check browser settings → Site Settings → Location
- Reset permissions and refresh page
- Try different browser

## Future Enhancements

Potential improvements:
- [ ] Configurable proximity radius per session
- [ ] Geofencing with custom boundaries
- [ ] Location history visualization
- [ ] Multi-point instructor locations (moving sessions)
- [ ] Offline location queue with later validation
- [ ] Admin dashboard with location analytics
