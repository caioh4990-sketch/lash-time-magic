-- Create services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration text NOT NULL,
  price numeric NOT NULL,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone can read active services
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial services
INSERT INTO public.services (title, description, duration, price, sort_order) VALUES
  ('Fio a Fio', 'Extensão natural e delicada, fio por fio para um olhar sutil e elegante.', '2h', 250, 1),
  ('Volume Russo', 'Técnica de leque para um volume dramático e marcante.', '2h30', 350, 2),
  ('Volume Brasileiro', 'O equilíbrio perfeito entre natural e volumoso.', '2h', 300, 3),
  ('Manutenção', 'Reposição dos fios para manter seu olhar sempre perfeito.', '1h', 120, 4);

-- Storage bucket for service images
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true);

CREATE POLICY "Anyone can view service images" ON storage.objects
  FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "Admins can upload service images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update service images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete service images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'service-images' AND public.has_role(auth.uid(), 'admin'));