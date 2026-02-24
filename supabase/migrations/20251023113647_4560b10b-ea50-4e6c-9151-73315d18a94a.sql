-- Delete all app templates for Period 3 and Period 4
DELETE FROM public.app_templates 
WHERE period IN ('period3', 'period4', 'Period 3', 'Period 4');