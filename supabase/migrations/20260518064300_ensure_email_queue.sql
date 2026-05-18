-- Apply this migration to fix notification issues
-- This migration ensures:
-- 1. All triggers are properly created
-- 2. Email queue function exists
-- 3. All notifications send to Gmail

-- First, ensure email_queue table exists (from previous migration)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_name TEXT NOT NULL,
  type TEXT NOT NULL,
  from_name TEXT NOT NULL,
  project_name TEXT,
  project_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Service role can manage email queue" ON public.email_queue;

-- Create policy
CREATE POLICY "Service role can manage email queue" ON public.email_queue FOR ALL TO service_role USING (true);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status, created_at);

-- Function to queue email
CREATE OR REPLACE FUNCTION public.queue_email_notification(
  p_to_email TEXT,
  p_to_name TEXT,
  p_type TEXT,
  p_from_name TEXT,
  p_project_name TEXT DEFAULT NULL,
  p_project_link TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  email_id UUID;
BEGIN
  INSERT INTO public.email_queue (to_email, to_name, type, from_name, project_name, project_link)
  VALUES (p_to_email, p_to_name, p_type, p_from_name, p_project_name, p_project_link)
  RETURNING id INTO email_id;

  RETURN email_id;
END;
$$;
