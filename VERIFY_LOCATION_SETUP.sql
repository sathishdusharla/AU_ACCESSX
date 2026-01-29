-- ===================================
-- VERIFY LOCATION TRACKING SETUP
-- ===================================
-- Run this to check if your database is ready for location-based attendance

-- Check if columns exist in sessions table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions' 
  AND column_name IN ('instructor_latitude', 'instructor_longitude')
ORDER BY column_name;

-- Expected result: 2 rows showing both location columns
-- instructor_latitude  | double precision | YES
-- instructor_longitude | double precision | YES

-- Check if columns exist in attendance_records table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'attendance_records' 
  AND column_name IN ('student_latitude', 'student_longitude')
ORDER BY column_name;

-- Expected result: 2 rows showing both location columns
-- student_latitude  | double precision | YES
-- student_longitude | double precision | YES

-- Check if indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('sessions', 'attendance_records')
  AND indexname LIKE '%location%';

-- Expected result: 2 rows showing location indexes
-- idx_sessions_location
-- idx_attendance_location

-- ===================================
-- RESULT INTERPRETATION
-- ===================================
-- If you see all 4 columns (2 per table) → ✅ Database is ready!
-- If missing columns → Run ADD_LOCATION_TRACKING.sql
-- If indexes missing → Run the CREATE INDEX commands only
-- ===================================
