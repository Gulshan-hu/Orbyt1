-- CRITICAL FIX: Update triggers to ALWAYS queue emails for Gmail delivery
-- This ensures ALL notifications are sent to users' Gmail addresses

-- Update connection request notification trigger to ALWAYS queue email
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

  -- Queue email notification (ALWAYS)
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

-- Update connection accepted notification trigger to ALWAYS queue email
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

    -- Queue email notification (ALWAYS)
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

-- Update friend new project notification trigger to ALWAYS queue email
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

    -- Queue email notification (ALWAYS)
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

-- Recreate triggers to use updated functions
DROP TRIGGER IF EXISTS on_connection_request_created ON public.connection_requests;
CREATE TRIGGER on_connection_request_created
AFTER INSERT ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_connection_request();

DROP TRIGGER IF EXISTS on_connection_request_accepted ON public.connection_requests;
CREATE TRIGGER on_connection_request_accepted
AFTER UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_connection_accepted();

DROP TRIGGER IF EXISTS on_project_created_notify_friends ON public.projects;
CREATE TRIGGER on_project_created_notify_friends
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.notify_friends_new_project();
