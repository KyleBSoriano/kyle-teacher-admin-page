-- Delete all data associated with Period 3 and Period 4 classes

-- First, get the class IDs we're about to delete and remove related records
DELETE FROM public.attendance_records 
WHERE class_id IN (
  SELECT id FROM public.classes 
  WHERE period IN ('Period 3', 'Period 4', 'period3', 'period4')
);

DELETE FROM public.class_apps 
WHERE class_id IN (
  SELECT id FROM public.classes 
  WHERE period IN ('Period 3', 'Period 4', 'period3', 'period4')
);

DELETE FROM public.enrollments 
WHERE class_id IN (
  SELECT id FROM public.classes 
  WHERE period IN ('Period 3', 'Period 4', 'period3', 'period4')
);

-- Delete any templates specifically tied to these class IDs
DELETE FROM public.app_templates 
WHERE class_id IN (
  SELECT id FROM public.classes 
  WHERE period IN ('Period 3', 'Period 4', 'period3', 'period4')
);

-- Finally, delete the classes themselves
DELETE FROM public.classes 
WHERE period IN ('Period 3', 'Period 4', 'period3', 'period4');