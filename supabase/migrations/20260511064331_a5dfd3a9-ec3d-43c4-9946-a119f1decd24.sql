
-- USERS
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  university TEXT NOT NULL,
  major TEXT NOT NULL,
  avatar_url TEXT,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users readable by authenticated" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert self" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update self" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- USER SKILLS
CREATE TABLE public.user_skills (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  PRIMARY KEY (user_id, skill)
);
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User skills readable" ON public.user_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "User skills insert own" ON public.user_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User skills delete own" ON public.user_skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  project_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects readable" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Projects insert by captain" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "Projects update by captain" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = captain_id);
CREATE POLICY "Projects delete by captain" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = captain_id);

-- Helper: is captain
CREATE OR REPLACE FUNCTION public.is_project_captain(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND captain_id = _user_id)
$$;

-- PROJECT SKILLS HAVE
CREATE TABLE public.project_skills_have (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  PRIMARY KEY (project_id, skill)
);
ALTER TABLE public.project_skills_have ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PSH readable" ON public.project_skills_have FOR SELECT TO authenticated USING (true);
CREATE POLICY "PSH insert by captain" ON public.project_skills_have FOR INSERT TO authenticated WITH CHECK (public.is_project_captain(project_id, auth.uid()));
CREATE POLICY "PSH delete by captain" ON public.project_skills_have FOR DELETE TO authenticated USING (public.is_project_captain(project_id, auth.uid()));

-- PROJECT SKILLS NEED
CREATE TABLE public.project_skills_need (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  note TEXT,
  PRIMARY KEY (project_id, skill)
);
ALTER TABLE public.project_skills_need ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PSN readable" ON public.project_skills_need FOR SELECT TO authenticated USING (true);
CREATE POLICY "PSN insert by captain" ON public.project_skills_need FOR INSERT TO authenticated WITH CHECK (public.is_project_captain(project_id, auth.uid()));
CREATE POLICY "PSN delete by captain" ON public.project_skills_need FOR DELETE TO authenticated USING (public.is_project_captain(project_id, auth.uid()));
CREATE POLICY "PSN update by captain" ON public.project_skills_need FOR UPDATE TO authenticated USING (public.is_project_captain(project_id, auth.uid()));

-- PROJECT MEMBERS
CREATE TABLE public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PM readable" ON public.project_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "PM insert by captain" ON public.project_members FOR INSERT TO authenticated WITH CHECK (public.is_project_captain(project_id, auth.uid()));
CREATE POLICY "PM delete by captain" ON public.project_members FOR DELETE TO authenticated USING (public.is_project_captain(project_id, auth.uid()));

-- CONNECTION REQUESTS
CREATE TABLE public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CR readable by participants" ON public.connection_requests FOR SELECT TO authenticated USING (auth.uid() IN (from_user_id, to_user_id));
CREATE POLICY "CR insert by sender" ON public.connection_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "CR update by receiver" ON public.connection_requests FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);

-- CONNECTIONS
CREATE TABLE public.connections (
  user_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conn readable by participants" ON public.connections FOR SELECT TO authenticated USING (auth.uid() IN (user_a, user_b));
CREATE POLICY "Conn insert by participant" ON public.connections FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (user_a, user_b));

-- RATINGS
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  overall_score INT NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
  communication INT NOT NULL CHECK (communication BETWEEN 1 AND 5),
  timeliness INT NOT NULL CHECK (timeliness BETWEEN 1 AND 5),
  technical_skill INT NOT NULL CHECK (technical_skill BETWEEN 1 AND 5),
  teamwork INT NOT NULL CHECK (teamwork BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id, project_id),
  CHECK (from_user_id <> to_user_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings readable" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Ratings insert by author" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- Trigger: update average_rating on user when a rating is inserted/updated/deleted
CREATE OR REPLACE FUNCTION public.refresh_user_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target UUID := COALESCE(NEW.to_user_id, OLD.to_user_id);
BEGIN
  UPDATE public.users
  SET average_rating = COALESCE((SELECT ROUND(AVG(overall_score)::numeric, 2) FROM public.ratings WHERE to_user_id = target), 0)
  WHERE id = target;
  RETURN NULL;
END;
$$;
CREATE TRIGGER ratings_avg_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.refresh_user_avg_rating();

-- Auto-create users row on signup using metadata from signUp options.data
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, email, university, major, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'university', ''),
    COALESCE(NEW.raw_user_meta_data->>'major', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Indexes
CREATE INDEX idx_projects_captain ON public.projects(captain_id);
CREATE INDEX idx_user_skills_skill ON public.user_skills(skill);
CREATE INDEX idx_psn_skill ON public.project_skills_need(skill);
CREATE INDEX idx_cr_to ON public.connection_requests(to_user_id, status);
CREATE INDEX idx_cr_from ON public.connection_requests(from_user_id, status);
CREATE INDEX idx_ratings_to ON public.ratings(to_user_id);
