-- Create safety_zones table for area-based safety scores
CREATE TABLE public.safety_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL,
  street TEXT,
  crime_count INTEGER NOT NULL DEFAULT 0,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  safety_score INTEGER NOT NULL CHECK (safety_score >= 0 AND safety_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safety_zones ENABLE ROW LEVEL SECURITY;

-- Allow public read access for route calculations
CREATE POLICY "Anyone can view safety zones" 
ON public.safety_zones 
FOR SELECT 
USING (true);

-- Allow authenticated users to manage safety data
CREATE POLICY "Authenticated users can insert safety zones" 
ON public.safety_zones 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update safety zones" 
ON public.safety_zones 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete safety zones" 
ON public.safety_zones 
FOR DELETE 
TO authenticated
USING (true);

-- Create index for area lookups
CREATE INDEX idx_safety_zones_area ON public.safety_zones(area);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_safety_zones_updated_at
BEFORE UPDATE ON public.safety_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();