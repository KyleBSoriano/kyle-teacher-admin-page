-- Normalize period naming to consistent format
UPDATE public.app_templates 
SET period = CASE 
  WHEN period ILIKE 'period%' THEN 
    'Period ' || regexp_replace(period, '[^0-9]', '', 'g')
  WHEN period = 'baseline' THEN 'baseline'
  ELSE period
END
WHERE period IS NOT NULL AND period != 'baseline';

-- Add index for better performance on period filtering
CREATE INDEX IF NOT EXISTS idx_app_templates_period ON public.app_templates(period);
CREATE INDEX IF NOT EXISTS idx_app_templates_class_id ON public.app_templates(class_id);