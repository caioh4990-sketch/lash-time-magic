
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- When called directly by a user (not via RLS policy evaluation),
  -- only allow checking your own roles to prevent probing.
  -- RLS policies run as the table owner, so current_setting('role') = 'authenticator'
  -- during direct calls but not during RLS evaluation.
  IF current_setting('role', true) = 'authenticator' AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$;
