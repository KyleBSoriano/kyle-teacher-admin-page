-- Add period and class_id columns to app_templates table
ALTER TABLE public.app_templates 
ADD COLUMN IF NOT EXISTS period TEXT,
ADD COLUMN IF NOT EXISTS class_id TEXT;

-- Add trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_app_templates_updated_at ON public.app_templates;
CREATE TRIGGER update_app_templates_updated_at
  BEFORE UPDATE ON public.app_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing templates to have period='baseline' for campus-wide defaults
UPDATE public.app_templates 
SET period = 'baseline', class_id = NULL
WHERE is_custom = false OR period IS NULL;

-- Create a default baseline template if none exists
INSERT INTO public.app_templates (name, description, apps, is_custom, period, class_id)
SELECT 
  'Default App Template',
  'Campus-wide default apps for all classes',
  '["calculator", "notes", "google-calendar", "google-docs", "desmos"]'::jsonb,
  false,
  'baseline',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_templates WHERE period = 'baseline' AND is_custom = false
);