-- Add project status and showcase features
-- Remove old rating system and replace with project-based reviews

-- Add status to projects table
ALTER TABLE public.projects ADD COLUMN status TEXT NOT NULL DEFAULT 'looking_for_team' CHECK (status IN ('looking_for_team', 'in_progress', 'done'));

-- Create project reviews table (replaces ratings)
CREATE TABLE public.project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, reviewer_id)
);

ALTER TABLE public.project_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project reviews readable" ON public.project_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Project reviews insert by reviewer" ON public.project_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- Create teammate reviews table (for team members to review each other after project completion)
CREATE TABLE public.teammate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  communication INT NOT NULL CHECK (communication BETWEEN 1 AND 5),
  timeliness INT NOT NULL CHECK (timeliness BETWEEN 1 AND 5),
  technical_skill INT NOT NULL CHECK (technical_skill BETWEEN 1 AND 5),
  teamwork INT NOT NULL CHECK (teamwork BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

ALTER TABLE public.teammate_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teammate reviews readable" ON public.teammate_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teammate reviews insert by author" ON public.teammate_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- Update average_rating calculation to use teammate_reviews instead of ratings
DROP TRIGGER IF EXISTS ratings_avg_refresh ON public.ratings;
DROP FUNCTION IF EXISTS public.refresh_user_avg_rating();

CREATE OR REPLACE FUNCTION public.refresh_user_avg_rating_from_teammate_reviews()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target UUID := COALESCE(NEW.to_user_id, OLD.to_user_id);
BEGIN
  UPDATE public.users
  SET average_rating = COALESCE(
    (SELECT ROUND(AVG((communication + timeliness + technical_skill + teamwork) / 4.0)::numeric, 2)
     FROM public.teammate_reviews
     WHERE to_user_id = target),
    0
  )
  WHERE id = target;
  RETURN NULL;
END;
$$;

CREATE TRIGGER teammate_reviews_avg_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.teammate_reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_user_avg_rating_from_teammate_reviews();

-- Add indexes
CREATE INDEX idx_project_reviews_project ON public.project_reviews(project_id);
CREATE INDEX idx_teammate_reviews_project ON public.teammate_reviews(project_id);
CREATE INDEX idx_teammate_reviews_to ON public.teammate_reviews(to_user_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- Note: We're keeping the old ratings table for now to preserve historical data
-- but new reviews will use the teammate_reviews table
