
-- 1. Fix appointments INSERT policy
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

CREATE POLICY "Anyone can create appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- 2. Add CHECK constraints on appointments
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check
CHECK (status IN ('confirmed', 'cancelled', 'completed'));

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_price_check
CHECK (price > 0);

-- 3. Add DELETE policy for admins
CREATE POLICY "Admins can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Restrict has_role function execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
