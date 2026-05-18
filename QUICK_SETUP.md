# Quick Setup Guide - Notification System

**Last Updated**: May 18, 2026

---

## 🚀 Quick Start (10 Minutes)

### Step 1: Apply Database Migrations (5 min)

```bash
cd C:\scripts\team-sync-main
supabase db push
```

If you don't have Supabase CLI or it doesn't work, go to:
- Supabase Dashboard → SQL Editor
- Copy and paste each migration file:
  1. `supabase/migrations/20260517080000_add_notifications_and_friends.sql`
  2. `supabase/migrations/20260517082000_add_email_queue.sql`
- Click "Run"

### Step 2: Start Development Server (1 min)

```bash
npm run dev
```

### Step 3: Test Notifications (4 min)

1. Open http://localhost:3000
2. Create two test accounts (or use existing ones)
3. User A: Send connection request to User B
4. User B: Check bell icon in navbar (should show badge)
5. User B: Click bell to see notification
6. User B: Accept the request
7. User A: Check bell icon (should show acceptance notification)

**✅ If you see notifications, the system is working!**

---

## 📧 Email Setup (Optional - 20 Minutes)

### Option 1: Resend (Recommended)

1. **Sign up**: https://resend.com (free tier: 100 emails/day)
2. **Get API key**: https://resend.com/api-keys
3. **Configure**:
```bash
npm install -g supabase
supabase link --project-ref rxxvbxjuyglgpimodqqp
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase functions deploy send-notification-email
supabase functions deploy process-email-queue
```

4. **Set up cron job** (Supabase Dashboard → SQL Editor):
```sql
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

1. Enable 2FA on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Configure:
```bash
supabase secrets set GMAIL_USER=your-email@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=your-16-char-password
```
4. Update edge function to use nodemailer (see EMAIL_SETUP.md)

---

## 🧪 Verify Everything Works

### Test Script
```bash
bash test_notifications.sh
```

### Manual Verification
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM notifications;
SELECT COUNT(*) FROM friends;
SELECT COUNT(*) FROM email_queue;
```

---

## 🐛 Troubleshooting

### Notifications not showing?
- Check: `SELECT * FROM notifications;` in SQL Editor
- Verify migrations applied
- Check browser console for errors

### Emails not sending?
- Check: `SELECT * FROM email_queue;` in SQL Editor
- Verify Resend API key: `supabase secrets list`
- Check logs: `supabase functions logs send-notification-email`

---

## 📚 Full Documentation

- `NOTIFICATION_ANALYSIS.md` - Complete analysis and architecture
- `NOTIFICATION_FIXES.md` - Detailed fixes and troubleshooting
- `EMAIL_SETUP.md` - Email configuration guide
- `test_notifications.sql` - Database verification script

---

## ✅ What's Working

- ✅ In-app notifications (bell icon, dropdown, full page)
- ✅ Real-time updates (no refresh needed)
- ✅ Database triggers (automatic notification creation)
- ✅ Friends system (auto-friendship on collaboration)
- ✅ Email queue system (ready for email service)

---

## ⚠️ What Needs Setup

1. **Apply migrations** (REQUIRED) - 5 minutes
2. **Set up email service** (OPTIONAL) - 20 minutes

---

**Total Time**: 10 minutes (notifications only) or 30 minutes (with email)

**Status**: Ready to deploy ✅
