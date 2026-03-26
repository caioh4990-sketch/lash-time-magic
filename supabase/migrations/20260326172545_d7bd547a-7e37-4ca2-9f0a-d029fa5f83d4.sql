
-- 1. Add CHECK constraint on status column to restrict allowed values
ALTER TABLE public.appointments ADD CONSTRAINT chk_appointment_status
  CHECK (status IN ('confirmed', 'cancelled', 'completed', 'pending'));

-- 2. Replace the permissive user UPDATE policy with one that only allows cancellation
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;

-- Users can only cancel their own appointments (set status to 'cancelled')
CREATE POLICY "Users can cancel own appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Admins can update any field on any appointment
CREATE POLICY "Admins can update appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
