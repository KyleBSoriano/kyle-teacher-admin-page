-- Create app_templates table to store custom app templates
CREATE TABLE IF NOT EXISTS public.app_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  apps JSONB NOT NULL DEFAULT '[]'::jsonb,
  period TEXT,
  class_id TEXT,
  is_custom BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.app_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for app_templates
CREATE POLICY "Anyone can view app templates"
  ON public.app_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create app templates"
  ON public.app_templates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update app templates"
  ON public.app_templates
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete app templates"
  ON public.app_templates
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_app_templates_updated_at
  BEFORE UPDATE ON public.app_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
