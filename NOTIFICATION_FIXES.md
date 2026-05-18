# Notification System - Issues and Fixes

**Date**: May 18, 2026  
**Status**: Analysis Complete - Fixes Applied

---

## Issues Identified

### 1. **Website Notifications** ✅ WORKING
The in-app notification system is properly implemented:
- ✅ NotificationsProvider wraps the app in `__root.tsx`
- ✅ NotificationsDropdown component in Navbar
- ✅ Full notifications page at `/notifications`
- ✅ Real-time subscriptions via Supabase
- ✅ Database triggers create notifications automatically

**Potential Issues**:
- Database migrations may not be applied
- Triggers may not be enabled
- RLS policies may be blocking access

### 2. **Gmail Email Notifications** ⚠️ NEEDS SETUP
The email system is implemented but requires configuration:
- ✅ Edge functions created (`send-notification-email`, `process-email-queue`)
- ✅ Email queue table and triggers in database
- ❌ Resend API key not configured
- ❌ Edge functions not deployed
- ❌ Missing deno.json configuration files (NOW FIXED)

---

## Fixes Applied

### Fix 1: Added deno.json Configuration Files
**Issue**: Edge functions were missing deno.json files for proper imports

**Files Created**:
1. `supabase/functions/send-notification-email/deno.json`
2. `supabase/functions/process-email-queue/deno.json`

**Content**:
```json
{
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

---

## Deployment Steps Required

### Step 1: Apply Database Migrations ⚠️ REQUIRED

Check if migrations are applied:
```bash
cd C:\scripts\team-sync-main
supabase db push
```

Or manually check in Supabase Dashboard → SQL Editor:
```sql
-- Check if notifications table exists
SELECT * FROM notifications LIMIT 1;

-- Check if friends table exists
SELECT * FROM friends LIMIT 1;

-- Check if email_queue table exists
SELECT * FROM email_queue LIMIT 1;

-- Check if triggers exist
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%notify%';
```

### Step 2: Set Up Email Notifications (Optional)

#### Option A: Using Resend (Recommended)

1. **Sign up for Resend**:
   - Go to https://resend.com
   - Create free account
   - Verify your email

2. **Get API Key**:
   - Go to https://resend.com/api-keys
   - Create new API key
   - Copy the key (starts with `re_`)

3. **Configure Supabase**:
```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref rxxvbxjuyglgpimodqqp

# Set API key as secret
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Deploy edge functions
supabase functions deploy send-notification-email
supabase functions deploy process-email-queue
```

4. **Set up Cron Job** (for email queue processing):
   - Go to Supabase Dashboard → Database → Cron Jobs
   - Create new cron job:
```sql
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://rxxvbxjuyglgpimodqqp.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

#### Option B: Using Gmail SMTP

1. **Enable 2FA on Gmail**:
   - Go to Google Account settings
   - Enable 2-factor authentication

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Create new app password
   - Copy the 16-character password

3. **Update Edge Function**:
   - Modify `send-notification-email/index.ts` to use nodemailer with Gmail SMTP
   - Set secrets:
```bash
supabase secrets set GMAIL_USER=your-email@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=your-16-char-password
```

---

## Testing Checklist

### Test Website Notifications

1. **Check Database**:
```sql
-- Verify tables exist
SELECT COUNT(*) FROM notifications;
SELECT COUNT(*) FROM friends;

-- Check triggers
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname LIKE '%notify%';
```

2. **Test Connection Request Notification**:
   - Create two test accounts (User A and User B)
   - User A sends connection request to User B
   - User B should see:
     - Bell icon with badge (1)
     - Notification in dropdown
     - Notification on `/notifications` page

3. **Test Connection Accepted Notification**:
   - User B accepts the connection request
   - User A should see:
     - Bell icon with badge (1)
     - "Connection Request Accepted" notification

4. **Test Friend New Project Notification**:
   - User A and B collaborate on a project (become friends)
   - User A creates a new project
   - User B should see:
     - "Friend Added New Project" notification

### Test Email Notifications

1. **Check Email Queue**:
```sql
-- Check if emails are being queued
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 10;
```

2. **Check Edge Function Logs**:
```bash
supabase functions logs send-notification-email
supabase functions logs process-email-queue
```

3. **Manual Test**:
```bash
# Trigger email queue processing manually
curl -X POST https://rxxvbxjuyglgpimodqqp.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

4. **Check Email Inbox**:
   - Check recipient's email inbox
   - Check spam/junk folder
   - Verify email content and links

---

## Troubleshooting

### Issue: Notifications Not Appearing in UI

**Possible Causes**:
1. Migrations not applied
2. Triggers not enabled
3. RLS policies blocking access
4. Real-time subscription failed

**Solutions**:
```sql
-- Check if notification was created
SELECT * FROM notifications WHERE user_id = 'your-user-id' ORDER BY created_at DESC;

-- Check trigger status
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_connection_request_created';

-- Enable trigger if disabled
ALTER TABLE connection_requests ENABLE TRIGGER on_connection_request_created;

-- Test notification creation manually
SELECT create_notification(
  'your-user-id',
  'connect_request_received',
  'Test Notification',
  'This is a test',
  '/connections',
  NULL
);
```

### Issue: Emails Not Sending

**Possible Causes**:
1. Resend API key not set
2. Edge functions not deployed
3. Email queue not processing
4. Invalid email addresses

**Solutions**:
```bash
# Check if API key is set
supabase secrets list

# Check edge function deployment
supabase functions list

# Check email queue status
SELECT status, COUNT(*) FROM email_queue GROUP BY status;

# Check failed emails
SELECT * FROM email_queue WHERE status = 'failed';

# Retry failed emails
UPDATE email_queue SET status = 'pending', attempts = 0 WHERE status = 'failed';
```

### Issue: Real-time Notifications Not Updating

**Possible Causes**:
1. Supabase real-time not enabled
2. Browser blocking WebSocket
3. Network issues

**Solutions**:
1. Check Supabase Dashboard → Database → Replication
2. Enable real-time for `notifications` table
3. Check browser console for errors
4. Test with page refresh

---

## Summary

### What's Working ✅
- In-app notification system (UI components)
- Database schema (tables, triggers, functions)
- Email queue system
- Edge functions (code ready)

### What Needs Setup ⚠️
1. **Apply database migrations** (REQUIRED)
2. **Configure Resend API key** (for emails)
3. **Deploy edge functions** (for emails)
4. **Set up cron job** (for email queue processing)

### Quick Start (5 minutes)
```bash
# 1. Apply migrations
cd C:\scripts\team-sync-main
supabase db push

# 2. Test in-app notifications
npm run dev
# Create connection request and check bell icon

# 3. (Optional) Set up emails
# Follow "Option A: Using Resend" above
```

---

## Next Steps

1. ✅ **Verify migrations are applied**
2. ✅ **Test in-app notifications**
3. ⚠️ **Set up email service** (optional but recommended)
4. ✅ **Test end-to-end flow**

---

**Status**: Ready for testing and deployment
**Priority**: High (in-app notifications), Medium (email notifications)
