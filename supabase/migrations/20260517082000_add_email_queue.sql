-- Alternative: Simpler email notification without pg_net
-- This version creates a table to queue emails that can be processed by a background worker

-- Create email queue table
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

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email queue" ON public.email_queue FOR ALL TO service_role USING (true);

CREATE INDEX idx_email_queue_status ON public.email_queue(status, created_at);

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

-- Update triggers to use email queue instead of direct sending
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  from_user_name TEXT;
  to_user_email TEXT;
  to_user_name TEXT;
  project_name TEXT;
BEGIN
  -- Get sender's name
  SELECT first_name || ' ' || last_name INTO from_user_name
  FROM public.users WHERE id = NEW.from_user_id;

  -- Get recipient's email and name
  SELECT email, first_name || ' ' || last_name INTO to_user_email, to_user_name
  FROM public.users WHERE id = NEW.to_user_id;

  -- Get project name if applicable
  IF NEW.project_id IS NOT NULL THEN
    SELECT name INTO project_name FROM public.projects WHERE id = NEW.project_id;
  END IF;

  -- Create in-app notification
  PERFORM public.create_notification(
    NEW.to_user_id,
    'connect_request_received',
    'New Connection Request',
    from_user_name || ' wants to connect with you',
    '/connections',
    jsonb_build_object('request_id', NEW.id, 'from_user_id', NEW.from_user_id)
  );

  -- Queue email notification
  PERFORM public.queue_email_notification(
    to_user_email,
    to_user_name,
    'connect_request_received',
    from_user_name,
    project_name
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_connection_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  accepter_name TEXT;
  requester_email TEXT;
  requester_name TEXT;
BEGIN
  -- Only trigger on status change to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Get accepter's name
    SELECT first_name || ' ' || last_name INTO accepter_name
    FROM public.users WHERE id = NEW.to_user_id;

    -- Get requester's email and name
    SELECT email, first_name || ' ' || last_name INTO requester_email, requester_name
    FROM public.users WHERE id = NEW.from_user_id;

    -- Create in-app notification
    PERFORM public.create_notification(
      NEW.from_user_id,
      'connect_request_accepted',
      'Connection Request Accepted',
      accepter_name || ' accepted your connection request',
      '/connections',
      jsonb_build_object('user_id', NEW.to_user_id)
    );

    -- Queue email notification
    PERFORM public.queue_email_notification(
      requester_email,
      requester_name,
      'connect_request_accepted',
      accepter_name
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_friends_new_project()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  friend_id UUID;
  friend_email TEXT;
  friend_name TEXT;
  creator_name TEXT;
  project_link TEXT;
BEGIN
  -- Get creator's name
  SELECT first_name || ' ' || last_name INTO creator_name
  FROM public.users WHERE id = NEW.captain_id;

  -- Build project link
  project_link := 'https://orbyt.app/profile/' || NEW.captain_id;

  -- Notify all friends
  FOR friend_id IN
    SELECT CASE
      WHEN user_a = NEW.captain_id THEN user_b
      ELSE user_a
    END as friend_user_id
    FROM public.friends
    WHERE NEW.captain_id IN (user_a, user_b)
  LOOP
    -- Get friend's email and name
    SELECT email, first_name || ' ' || last_name INTO friend_email, friend_name
    FROM public.users WHERE id = friend_id;

    -- Create in-app notification
    PERFORM public.create_notification(
      friend_id,
      'friend_new_project',
      'Friend Added New Project',
      creator_name || ' created a new project: ' || NEW.name,
      '/profile/' || NEW.captain_id,
      jsonb_build_object('project_id', NEW.id, 'captain_id', NEW.captain_id)
    );

    -- Queue email notification
    PERFORM public.queue_email_notification(
      friend_email,
      friend_name,
      'friend_new_project',
      creator_name,
      NEW.name,
      project_link
    );
  END LOOP;

  RETURN NEW;
END;
$$;
