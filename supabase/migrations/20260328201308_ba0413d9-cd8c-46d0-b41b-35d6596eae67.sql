
-- Table: available time slots managed by admin
CREATE TABLE public.available_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot text NOT NULL UNIQUE,
  day_of_week integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.available_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active times" ON public.available_times
  FOR SELECT TO public USING (active = true);

CREATE POLICY "Admins can manage times" ON public.available_times
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Table: blocked dates managed by admin
CREATE TABLE public.blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date date NOT NULL UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage blocked dates" ON public.blocked_dates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
