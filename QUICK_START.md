# Quick Start Guide

## What's Been Implemented

All requested features have been implemented:

1. ✅ **Profile Photo Upload** - Already functional, uploads to Supabase storage
2. ✅ **Notifications System** - In-app notifications for connection requests and friend activities
3. ✅ **Email Notifications** - Gmail notifications via Resend API
4. ✅ **Friends System** - Auto-friendship when collaborating on projects
5. ✅ **Friend Activity Notifications** - Notifies when friends create new projects

## Quick Setup (5 minutes)

### Step 1: Apply Database Migrations

```bash
cd C:\scripts\team-sync-main

# If you have Supabase CLI installed:
supabase db push

# OR manually apply in Supabase Dashboard SQL Editor:
# 1. Copy content from supabase/migrations/20260517080000_add_notifications_and_friends.sql
# 2. Run in SQL Editor
# 3. Copy content from supabase/migrations/20260517082000_add_email_queue.sql
# 4. Run in SQL Editor
```

### Step 2: Create Storage Bucket (if not exists)

In Supabase Dashboard:
1. Go to **Storage** → **Create bucket**
2. Name: `avatars`
3. Set to **Public**
4. Add policy: Allow authenticated users to upload

### Step 3: Set Up Email (Optional but Recommended)

1. **Get Resend API Key**:
   - Sign up at https://resend.com (free tier available)
   - Get API key from https://resend.com/api-keys

2. **Deploy Edge Function**:
   ```bash
   # Install Supabase CLI if needed
   npm install -g supabase
   
   # Link project
   supabase link --project-ref rxxvbxjuyglgpimodqqp
   
   # Set secret
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   
   # Deploy function
   supabase functions deploy send-notification-email
   ```

3. **Set up cron job** (optional, for email queue processing):
   - In Supabase Dashboard → Database → Cron Jobs
   - Create job to call `process-email-queue` function every 5 minutes

### Step 4: Start Development Server

```bash
npm run dev
```

## Testing the Features

### Test Profile Photo Upload
1. Log in to the app
2. Go to your profile
3. Click "Edit Profile"
4. Click "Upload Photo" under Profile Photo section
5. Select an image (max 2MB)
6. Click "Save Changes"
7. Verify photo appears in navbar, sidebar, and profile page

### Test Notifications
1. Create two user accounts (use different browsers/incognito)
2. **Test Connection Request**:
   - User A sends connection request to User B
   - User B should see notification in bell icon
   - User B should receive email (if email setup complete)
3. **Test Connection Accepted**:
   - User B accepts the request
   - User A should see notification
   - User A should receive email

### Test Friends System
1. User A creates a project
2. User B joins the project (via connection request)
3. Both users automatically become friends
4. Go to Connections page → Friends tab
5. Verify both users see each other in Friends list

### Test Friend Activity Notifications
1. User A and User B are friends (from previous test)
2. User A creates a new project
3. User B should see notification: "Friend Added New Project"
4. User B should receive email about the new project

## Troubleshooting

### "Notifications not showing"
- Check browser console for errors
- Verify migrations were applied: Check Supabase Dashboard → Database → Tables for `notifications` table
- Check triggers: Database → Functions → Verify triggers exist

### "Emails not sending"
- Verify Resend API key is set: `supabase secrets list`
- Check edge function logs: `supabase functions logs send-notification-email`
- Check email queue table: `SELECT * FROM email_queue WHERE status = 'pending'`
- For testing, check spam/junk folder

### "Profile photo not uploading"
- Verify `avatars` bucket exists in Storage
- Check bucket is public
- Verify file size is under 2MB
- Check browser console for upload errors

### "Friends not being created"
- Verify both users are in `project_members` table for the same project
- Check `friends` table: `SELECT * FROM friends`
- Verify trigger exists: `on_project_member_added`

## File Structure

```
team-sync-main/
├── src/
│   ├── components/
│   │   ├── EditProfileModal.tsx (profile photo upload)
│   │   ├── NotificationsDropdown.tsx (bell icon dropdown)
│   │   └── Avatar.tsx (displays profile photos)
│   ├── lib/
│   │   ├── notifications.tsx (notifications context)
│   │   └── data.ts (fetchFriendsForUser added)
│   └── routes/
│       ├── connections.tsx (added Friends tab)
│       └── notifications.tsx (notifications page)
├── supabase/
│   ├── migrations/
│   │   ├── 20260517080000_add_notifications_and_friends.sql
│   │   ├── 20260517081500_add_email_notifications.sql
│   │   └── 20260517082000_add_email_queue.sql
│   └── functions/
│       ├── send-notification-email/index.ts
│       └── process-email-queue/index.ts
├── EMAIL_SETUP.md (detailed email setup)
└── IMPLEMENTATION_SUMMARY.md (complete documentation)
```

## What Works Out of the Box

- ✅ Profile photo upload (just needs `avatars` bucket)
- ✅ In-app notifications (works after migrations)
- ✅ Friends system (works after migrations)
- ✅ Real-time notification updates
- ⚠️ Email notifications (requires Resend setup)

## Next Steps

1. Apply database migrations
2. Create avatars bucket
3. Test in-app features
4. Set up email (optional)
5. Test email notifications

## Need Help?

- Check `IMPLEMENTATION_SUMMARY.md` for detailed documentation
- Check `EMAIL_SETUP.md` for email setup details
- Review Supabase Dashboard logs for errors
- Check browser console for client-side errors

---

**Estimated setup time**: 5-10 minutes (without email), 15-20 minutes (with email)
