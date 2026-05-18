-- Check if migrations have been applied
-- Run this in Supabase SQL Editor to diagnose notification issues

-- 1. Check if tables exist
SELECT
  'notifications' as table_name,
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') as exists
UNION ALL
SELECT
  'email_queue',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue')
UNION ALL
SELECT
  'friends',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friends')
UNION ALL
SELECT
  'connection_requests',
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'connection_requests');

-- 2. Check if triggers exist
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname IN (
  'on_connection_request_created',
  'on_connection_request_accepted',
  'on_project_member_added',
  'on_project_created_notify_friends'
)
ORDER BY tgname;

-- 3. Check recent connection requests
SELECT
  id,
  from_user_id,
  to_user_id,
  status,
  created_at
FROM connection_requests
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if any notifications exist
SELECT COUNT(*) as notification_count FROM notifications;

-- 5. Check if any emails are queued
SELECT COUNT(*) as email_count FROM email_queue;

-- 6. If tables don't exist, you need to apply migrations:
-- Run: supabase db push
-- Or manually run the migration files in SQL Editor
