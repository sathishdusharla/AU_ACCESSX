-- ===================================
-- ADD LOCATION TRACKING COLUMNS
-- ===================================
-- Run this SQL in your Supabase SQL Editor
-- This adds geolocation support for proximity-based attendance

-- NOTE: If you get "column already exists" errors, your database is already set up!
--       Run VERIFY_LOCATION_SETUP.sql instead to confirm.

-- Step 1: Add location columns to sessions table (for instructor location)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'instructor_latitude'
    ) THEN
        ALTER TABLE sessions ADD COLUMN instructor_latitude DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'instructor_longitude'
    ) THEN
        ALTER TABLE sessions ADD COLUMN instructor_longitude DOUBLE PRECISION;
    END IF;
END $$;

-- Step 2: Add location columns to attendance_records table (for student location)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'student_latitude'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN student_latitude DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'student_longitude'
    ) THEN
        ALTER TABLE attendance_records ADD COLUMN student_longitude DOUBLE PRECISION;
    END IF;
END $$;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_location 
ON sessions(instructor_latitude, instructor_longitude);

CREATE INDEX IF NOT EXISTS idx_attendance_location 
ON attendance_records(student_latitude, student_longitude);

-- Step 4: Add comments to document the columns
COMMENT ON COLUMN sessions.instructor_latitude IS 'Instructor latitude coordinate when session was created';
COMMENT ON COLUMN sessions.instructor_longitude IS 'Instructor longitude coordinate when session was created';
COMMENT ON COLUMN attendance_records.student_latitude IS 'Student latitude coordinate when attendance was marked';
COMMENT ON COLUMN attendance_records.student_longitude IS 'Student longitude coordinate when attendance was marked';

-- ===================================
-- VERIFICATION
-- ===================================
-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions' 
  AND (column_name LIKE '%latitude%' OR column_name LIKE '%longitude%')
ORDER BY table_name, ordinal_position;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'attendance_records' 
  AND (column_name LIKE '%latitude%' OR column_name LIKE '%longitude%')
ORDER BY table_name, ordinal_position;

-- ===================================
-- NOTES
-- ===================================
-- * Proximity validation is set to 100 meters radius
-- * Location is captured using browser's Geolocation API
-- * Both instructor and student must enable location services
-- * Distance is calculated using Haversine formula
-- * Students outside 100m radius will be rejected
-- * Sessions without location data cannot accept attendance
-- ===================================
