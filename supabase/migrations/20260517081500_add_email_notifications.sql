-- Add email notification triggers

-- Function to send email notification via Edge Function
CREATE OR REPLACE FUNCTION public.send_email_notification(
  p_to_email TEXT,
  p_to_name TEXT,
  p_type TEXT,
  p_from_name TEXT,
  p_project_name TEXT DEFAULT NULL,
  p_project_link TEXT DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  request_id bigint;
  response_status int;
  response_body text;
BEGIN
  -- Call the Edge Function using pg_net extension
  -- Note: This requires the pg_net extension to be enabled in Supabase
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_key')
    ),
    body := jsonb_build_object(
      'to_email', p_to_email,
      'to_name', p_to_name,
      'type', p_type,
      'from_name', p_from_name,
      'project_name', p_project_name,
      'project_link', p_project_link
    )
  ) INTO request_id;

  -- Note: This is fire-and-forget. We don't wait for the response.
  -- If you need to handle responses, you can query net._http_response table
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send email notification: %', SQLERRM;
END;
$$;

-- Update connection request notification trigger to send email
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

  -- Send email notification
  PERFORM public.send_email_notification(
    to_user_email,
    to_user_name,
    'connect_request_received',
    from_user_name,
    project_name
  );

  RETURN NEW;
END;
$$;

-- Update connection accepted notification trigger to send email
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

    -- Send email notification
    PERFORM public.send_email_notification(
      requester_email,
      requester_name,
      'connect_request_accepted',
      accepter_name
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Update friend new project notification trigger to send email
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

    -- Send email notification
    PERFORM public.send_email_notification(
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
