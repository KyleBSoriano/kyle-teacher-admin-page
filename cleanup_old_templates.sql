-- Clean up old templates that don't have a class_id
-- These are templates from before we implemented class-specific filtering

-- First, let's see what templates exist
SELECT 
  id,
  name,
  period,
  class_id,
  created_at
FROM app_templates
ORDER BY created_at DESC;

-- Delete templates that don't have a class_id (old templates)
-- WARNING: This will delete templates with class_id = null
-- Only run this if you want to remove old templates that aren't associated with any class
-- DELETE FROM app_templates WHERE class_id IS NULL;

-- If you want to see templates for a specific class, use this:
-- Replace 'YOUR_CLASS_ID' with your actual class ID
-- SELECT * FROM app_templates WHERE class_id = 'YOUR_CLASS_ID';

-- If you want to see the "math" template specifically:
-- SELECT * FROM app_templates WHERE name ILIKE '%math%';

