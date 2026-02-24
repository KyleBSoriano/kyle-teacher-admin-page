-- Clean up old templates and ensure fresh start for teacher dashboard
-- Delete all period-specific templates that aren't tied to a specific class
DELETE FROM app_templates 
WHERE period IN ('period1', 'period2', 'baseline', 'Period 1', 'Period 2', 'Period 3', 'Period 4') 
AND class_id IS NULL;

-- Create fresh templates for period1 (teacher dashboard)
INSERT INTO app_templates (name, apps, is_custom, description, class_id, period)
VALUES 
  ('Default', '["app24", "app1", "app27", "app25"]'::jsonb, false, 'Default app template', NULL, 'period1'),
  ('Custom', '["app24", "app27"]'::jsonb, true, 'Custom app template', NULL, 'period1')
ON CONFLICT DO NOTHING;