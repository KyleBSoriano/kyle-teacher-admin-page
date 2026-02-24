-- Create a table for schedule presets
CREATE TABLE public.schedule_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  schedule_blocks JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.schedule_presets ENABLE ROW LEVEL SECURITY;

-- Create policies for schedule presets
CREATE POLICY "Anyone can view schedule presets" 
ON public.schedule_presets 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create schedule presets" 
ON public.schedule_presets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update schedule presets" 
ON public.schedule_presets 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete schedule presets" 
ON public.schedule_presets 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_schedule_presets_updated_at
BEFORE UPDATE ON public.schedule_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();