
REVOKE ALL ON FUNCTION public.refresh_user_avg_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_project_captain(UUID, UUID) FROM PUBLIC, anon;
