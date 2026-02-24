-- Delete all Period 3 and Period 4 templates
DELETE FROM public.app_templates 
WHERE period IN ('Period 3', 'Period 4', 'period3', 'period4');