-- Add active_template_id column to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS active_template_id UUID REFERENCES app_templates(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_classes_active_template_id ON public.classes(active_template_id);

-- Add comment for documentation
COMMENT ON COLUMN public.classes.active_template_id IS 'The currently active app template for this class';

