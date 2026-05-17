-- Add notifications and friends system

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('connect_request_received', 'connect_request_accepted', 'friend_new_project', 'project_invite', 'project_status_change')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Create friends table (separate from connections)
CREATE TABLE public.friends (
  user_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  became_friends_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Friends readable by participants" ON public.friends FOR SELECT TO authenticated USING (auth.uid() IN (user_a, user_b));
CREATE POLICY "Friends insert by participant" ON public.friends FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (user_a, user_b));

CREATE INDEX idx_friends_user_a ON public.friends(user_a);
CREATE INDEX idx_friends_user_b ON public.friends(user_b);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Trigger: Create notification when connection request is sent
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  from_user_name TEXT;
BEGIN
  -- Get sender's name
  SELECT first_name || ' ' || last_name INTO from_user_name
  FROM public.users WHERE id = NEW.from_user_id;

  -- Create notification for recipient
  PERFORM public.create_notification(
    NEW.to_user_id,
    'connect_request_received',
    'New Connection Request',
    from_user_name || ' wants to connect with you',
    '/connections',
    jsonb_build_object('request_id', NEW.id, 'from_user_id', NEW.from_user_id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_connection_request_created
AFTER INSERT ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_connection_request();

-- Trigger: Create notification when connection request is accepted
CREATE OR REPLACE FUNCTION public.notify_connection_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  accepter_name TEXT;
  requester_id UUID;
BEGIN
  -- Only trigger on status change to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Get accepter's name
    SELECT first_name || ' ' || last_name INTO accepter_name
    FROM public.users WHERE id = NEW.to_user_id;

    -- Create notification for the original requester
    PERFORM public.create_notification(
      NEW.from_user_id,
      'connect_request_accepted',
      'Connection Request Accepted',
      accepter_name || ' accepted your connection request',
      '/connections',
      jsonb_build_object('user_id', NEW.to_user_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_connection_request_accepted
AFTER UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_connection_accepted();

-- Trigger: Auto-create friendships when users collaborate on same project
CREATE OR REPLACE FUNCTION public.auto_create_friendships()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  member_record RECORD;
  other_member_record RECORD;
BEGIN
  -- When a new member is added to a project, create friendships with all existing members
  FOR other_member_record IN
    SELECT user_id FROM public.project_members
    WHERE project_id = NEW.project_id AND user_id != NEW.user_id
  LOOP
    -- Insert friendship (ensuring user_a < user_b)
    INSERT INTO public.friends (user_a, user_b, project_id)
    VALUES (
      LEAST(NEW.user_id, other_member_record.user_id),
      GREATEST(NEW.user_id, other_member_record.user_id),
      NEW.project_id
    )
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_member_added
AFTER INSERT ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.auto_create_friendships();

-- Trigger: Notify friends when user creates a new project
CREATE OR REPLACE FUNCTION public.notify_friends_new_project()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  friend_id UUID;
  creator_name TEXT;
BEGIN
  -- Get creator's name
  SELECT first_name || ' ' || last_name INTO creator_name
  FROM public.users WHERE id = NEW.captain_id;

  -- Notify all friends
  FOR friend_id IN
    SELECT CASE
      WHEN user_a = NEW.captain_id THEN user_b
      ELSE user_a
    END as friend_user_id
    FROM public.friends
    WHERE NEW.captain_id IN (user_a, user_b)
  LOOP
    PERFORM public.create_notification(
      friend_id,
      'friend_new_project',
      'Friend Added New Project',
      creator_name || ' created a new project: ' || NEW.name,
      '/profile/' || NEW.captain_id,
      jsonb_build_object('project_id', NEW.id, 'captain_id', NEW.captain_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created_notify_friends
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.notify_friends_new_project();
