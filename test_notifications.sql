-- Test script to verify notification system is working
-- Run this in Supabase SQL Editor

-- 1. Check if tables exist
SELECT 'notifications table' as check_name, COUNT(*) as record_count FROM notifications
UNION ALL
SELECT 'friends table', COUNT(*) FROM friends
UNION ALL
SELECT 'email_queue table', COUNT(*) FROM email_queue;

-- 2. Check if triggers exist and are enabled
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE '%notify%' OR tgname LIKE '%friend%'
ORDER BY tgname;

-- 3. Check if functions exist
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition_preview
FROM pg_proc
WHERE proname LIKE '%notif%' OR proname LIKE '%friend%' OR proname LIKE '%email%'
ORDER BY proname;

-- 4. Test notification creation (replace 'your-user-id' with actual user ID)
-- First, get a real user ID:
SELECT id, email, first_name, last_name FROM users LIMIT 5;

-- Then create a test notification (uncomment and replace user_id):
-- SELECT create_notification(
--   'your-user-id-here'::uuid,
--   'connect_request_received',
--   'Test Notification',
--   'This is a test notification to verify the system is working',
--   '/connections',
--   '{"test": true}'::jsonb
-- );

-- 5. Check recent notifications
SELECT
  n.id,
  n.user_id,
  u.email,
  n.type,
  n.title,
  n.message,
  n.read,
  n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 10;

-- 6. Check email queue status
SELECT
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM email_queue
GROUP BY status;

-- 7. Check recent email queue entries
SELECT
  id,
  to_email,
  type,
  status,
  attempts,
  error_message,
  created_at,
  sent_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;

-- 8. Check friends relationships
SELECT
  f.user_a,
  ua.email as user_a_email,
  f.user_b,
  ub.email as user_b_email,
  f.became_friends_at
FROM friends f
JOIN users ua ON ua.id = f.user_a
JOIN users ub ON ub.id = f.user_b
ORDER BY f.became_friends_at DESC
LIMIT 10;

-- 9. Check connection requests
SELECT
  cr.id,
  cr.from_user_id,
  uf.email as from_email,
  cr.to_user_id,
  ut.email as to_email,
  cr.status,
  cr.created_at
FROM connection_requests cr
JOIN users uf ON uf.id = cr.from_user_id
JOIN users ut ON ut.id = cr.to_user_id
ORDER BY cr.created_at DESC
LIMIT 10;

-- 10. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('notifications', 'friends', 'email_queue')
ORDER BY tablename, policyname;
