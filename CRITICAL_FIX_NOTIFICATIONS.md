# 🔧 CRITICAL FIX: Notifications Not Working

**Issue**: Clicking "Connect" doesn't create notifications  
**Root Cause**: Database migrations not applied  
**Solution**: Apply migrations immediately

---

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Apply ALL Migrations (5 minutes)

Run this command in your terminal:

```bash
cd C:\scripts\team-sync-main
supabase db push
```

**If that doesn't work**, go to Supabase Dashboard → SQL Editor and run these files **in order**:

1. `supabase/migrations/20260517080000_add_notifications_and_friends.sql`
2. `supabase/migrations/20260517082000_add_email_queue.sql`
3. `supabase/migrations/20260518064300_ensure_email_queue.sql` (NEW)
4. `supabase/migrations/20260518064400_fix_gmail_notifications.sql` (NEW)

### Step 2: Verify Migrations Applied

Run this in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT
  'notifications' as table_name,
  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') as exists
UNION ALL
SELECT 'email_queue', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue')
UNION ALL
SELECT 'friends', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friends');

-- Check if triggers exist
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname LIKE '%notify%';
```

**Expected Result**: All tables should show `true`, and you should see 3 triggers enabled.

---

## 🎯 What I Just Fixed

### Problem 1: Notifications Not Appearing ❌
**Cause**: Database triggers weren't created because migrations weren't applied

**Fix**: 
- Created comprehensive migration files
- Ensured all triggers are properly set up
- Added diagnostic SQL script

### Problem 2: Gmail Notifications Not Sending ❌
**Cause**: Email queue wasn't being populated for all notification types

**Fix**:
- Updated ALL trigger functions to ALWAYS queue emails
- Created new migration: `20260518064400_fix_gmail_notifications.sql`
- Ensures every notification sends to user's Gmail address

---

## 📧 How Gmail Notifications Work Now

**Every notification type now sends to Gmail**:

1. **Connection Request Received**
   - ✅ In-app notification created
   - ✅ Email queued to recipient's Gmail

2. **Connection Request Accepted**
   - ✅ In-app notification created
   - ✅ Email queued to requester's Gmail

3. **Friend New Project**
   - ✅ In-app notification created
   - ✅ Email queued to all friends' Gmail

---

## 🔄 Email Delivery Flow

```
User clicks "Connect"
    ↓
Database trigger fires
    ↓
├─→ In-app notification created ✅
│   └─→ Bell icon shows badge
│
└─→ Email queued in email_queue table ✅
    └─→ Contains user's Gmail address
        ↓
    Cron job processes queue (every 5 min)
        ↓
    Edge function sends via Resend
        ↓
    Email delivered to Gmail ✅
```

---

## 🧪 Test After Applying Migrations

### Test 1: In-App Notifications

```bash
npm run dev
```

1. Create two test accounts (User A and User B)
2. User A sends connection request to User B
3. **Expected**: User B sees bell icon with badge (1)
4. User B clicks bell
5. **Expected**: Notification appears: "User A wants to connect with you"

### Test 2: Email Queue

Run in Supabase SQL Editor:

```sql
-- Check if emails are being queued
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;
```

**Expected**: You should see email entries with:
- `to_email`: User's Gmail address
- `type`: 'connect_request_received'
- `status`: 'pending'

### Test 3: Email Delivery (Requires Resend Setup)

1. Set up Resend (see below)
2. Send connection request
3. Check recipient's Gmail inbox
4. **Expected**: Email with subject "User A wants to connect with you on Orbyt"

---

## 📧 Set Up Email Delivery (20 minutes)

### Option 1: Resend (Recommended)

```bash
# 1. Sign up at https://resend.com (free: 100 emails/day)
# 2. Get API key from https://resend.com/api-keys
# 3. Configure Supabase

supabase link --project-ref rxxvbxjuyglgpimodqqp
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# 4. Deploy edge functions
supabase functions deploy send-notification-email
supabase functions deploy process-email-queue

# 5. Set up cron job (in Supabase Dashboard → SQL Editor)
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
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

### Option 2: Gmail SMTP

```bash
# 1. Enable 2FA on Gmail
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Configure

supabase secrets set GMAIL_USER=your-email@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=your-16-char-password

# 4. Update edge function to use nodemailer (see EMAIL_SETUP.md)
```

---

## 🐛 Troubleshooting

### Issue: Still no notifications after applying migrations

**Check 1**: Verify triggers are enabled
```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_connection_request_created';
```

**Check 2**: Test trigger manually
```sql
-- Get two user IDs
SELECT id, email FROM users LIMIT 2;

-- Create test connection request (replace with real user IDs)
INSERT INTO connection_requests (from_user_id, to_user_id, status)
VALUES ('user-a-id', 'user-b-id', 'pending');

-- Check if notification was created
SELECT * FROM notifications WHERE user_id = 'user-b-id' ORDER BY created_at DESC LIMIT 1;

-- Check if email was queued
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 1;
```

### Issue: Emails not in Gmail inbox

**Check 1**: Verify emails are queued
```sql
SELECT * FROM email_queue WHERE status = 'pending';
```

**Check 2**: Check for failed emails
```sql
SELECT * FROM email_queue WHERE status = 'failed';
```

**Check 3**: Verify Resend API key
```bash
supabase secrets list
```

**Check 4**: Check edge function logs
```bash
supabase functions logs process-email-queue
```

---

## 📝 Summary of Changes

### New Migration Files Created:
1. `20260518064300_ensure_email_queue.sql` - Ensures email queue table exists
2. `20260518064400_fix_gmail_notifications.sql` - Updates triggers to ALWAYS queue emails

### What Changed:
- ✅ All trigger functions now ALWAYS queue emails to Gmail
- ✅ Email queue function properly defined
- ✅ Triggers recreated to use updated functions
- ✅ Every notification type sends to user's Gmail address

### Files to Apply:
- Run `supabase db push` to apply all migrations
- Or manually run the 4 migration files in Supabase SQL Editor

---

## ✅ Expected Behavior After Fix

1. **User clicks "Connect"**
   - ✅ Connection request created in database
   - ✅ Trigger fires automatically
   - ✅ In-app notification created
   - ✅ Email queued with recipient's Gmail address
   - ✅ Bell icon shows badge

2. **Every 5 minutes** (if cron job set up)
   - ✅ Cron job triggers edge function
   - ✅ Edge function processes email queue
   - ✅ Emails sent via Resend to Gmail
   - ✅ Email status updated to 'sent'

3. **User receives**
   - ✅ In-app notification (instant)
   - ✅ Gmail notification (within 5 minutes)

---

## 🚀 Quick Start Checklist

- [ ] Apply migrations: `supabase db push`
- [ ] Verify tables exist (run diagnostic SQL)
- [ ] Test connection request
- [ ] Check bell icon for notification
- [ ] Check email_queue table for queued email
- [ ] Set up Resend (optional, for email delivery)
- [ ] Deploy edge functions (optional)
- [ ] Set up cron job (optional)
- [ ] Test Gmail delivery (optional)

---

**Status**: ✅ Fix Ready  
**Priority**: CRITICAL  
**Time to Fix**: 5-30 minutes  
**Next Action**: Apply migrations NOW

Run: `cd C:\scripts\team-sync-main && supabase db push`
