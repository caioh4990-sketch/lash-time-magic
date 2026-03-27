
-- Create service_categories table
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.service_categories
FOR SELECT
TO public
USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
ON public.service_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add category_id to services table
ALTER TABLE public.services ADD COLUMN category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL;
