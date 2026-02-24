-- Create a table for storing schedule blocks/calendar items
CREATE TABLE public.schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  block_type TEXT DEFAULT 'regular',
  description TEXT,
  color TEXT DEFAULT 'blue'
);

-- Enable Row Level Security
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for schedule blocks
CREATE POLICY "Anyone can view schedule blocks" 
ON public.schedule_blocks 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create schedule blocks" 
ON public.schedule_blocks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update schedule blocks" 
ON public.schedule_blocks 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete schedule blocks" 
ON public.schedule_blocks 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_schedule_blocks_updated_at
BEFORE UPDATE ON public.schedule_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance on date queries
CREATE INDEX idx_schedule_blocks_date ON public.schedule_blocks(schedule_date);
CREATE INDEX idx_schedule_blocks_period ON public.schedule_blocks(period);