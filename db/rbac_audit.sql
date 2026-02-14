-- RBAC + Audit foundation for IEADTV
-- Run this script in Supabase SQL editor before deploying role-based access controls.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'app_role' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'operador');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_by UUID NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NULL,
    actor_role public.app_role NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc
    ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id
    ON public.audit_logs (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type
    ON public.audit_logs (resource_type);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_roles_set_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_set_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT ur.role
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(public.current_user_role() = 'admin'::public.app_role, false);
$$;

CREATE OR REPLACE FUNCTION public.cleanup_audit_logs(retention_days INTEGER DEFAULT 30)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    DELETE FROM public.audit_logs
    WHERE created_at < timezone('utc', now()) - make_interval(days => retention_days);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Remove legacy policies if they exist
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Bootstrap first admin" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;

-- user_roles policies
CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Bootstrap first admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND role = 'admin'::public.app_role
    AND NOT EXISTS (SELECT 1 FROM public.user_roles)
);

CREATE POLICY "Admin can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.current_user_is_admin())
WITH CHECK (public.current_user_is_admin());

-- audit_logs policies
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.current_user_is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_audit_logs(INTEGER) TO authenticated;

-- Optional hardening example for sensitive tables:
-- ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admin only site settings" ON public.site_settings
-- FOR ALL TO authenticated
-- USING (public.current_user_is_admin())
-- WITH CHECK (public.current_user_is_admin());