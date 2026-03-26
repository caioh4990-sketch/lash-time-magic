
-- Add client info columns for unauthenticated booking
ALTER TABLE public.appointments 
  ADD COLUMN client_name text,
  ADD COLUMN client_phone text;

-- Make user_id nullable (no longer required for public bookings)
ALTER TABLE public.appointments ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing INSERT policy (requires auth)
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;

-- Allow anyone to insert appointments (public booking)
CREATE POLICY "Anyone can create appointments"
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Drop old user cancel policy
DROP POLICY IF EXISTS "Users can cancel own appointments" ON public.appointments;
