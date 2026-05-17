# Email Notification Setup Guide

This project uses Resend for sending email notifications. Follow these steps to set up email notifications:

## 1. Create a Resend Account

1. Go to https://resend.com and sign up for a free account
2. Verify your email address
3. Add and verify your domain (or use the Resend sandbox for testing)

## 2. Get Your API Key

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Copy the API key (it starts with `re_`)

## 3. Configure Supabase Edge Function

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project to Supabase:
   ```bash
   supabase link --project-ref rxxvbxjuyglgpimodqqp
   ```

3. Set the Resend API key as a secret:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```

4. Deploy the edge function:
   ```bash
   supabase functions deploy send-notification-email
   ```

## 4. Enable pg_net Extension (Alternative Method)

If you prefer to use pg_net for HTTP requests from PostgreSQL:

1. Go to your Supabase Dashboard
2. Navigate to Database → Extensions
3. Enable the `pg_net` extension
4. Set the required configuration:
   ```sql
   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://rxxvbxjuyglgpimodqqp.supabase.co';
   ALTER DATABASE postgres SET app.settings.supabase_service_key = 'your_service_role_key';
   ```

## 5. Apply Database Migration

Run the email notification migration:

```bash
supabase db push
```

Or manually apply the migration file:
```
supabase/migrations/20260517081500_add_email_notifications.sql
```

## 6. Testing

To test email notifications:

1. Create a connection request between two users
2. Accept a connection request
3. Create a new project (if you have friends)

Check your email inbox for notification emails.

## 7. Customization

You can customize email templates in:
```
supabase/functions/send-notification-email/index.ts
```

Update the HTML templates for each notification type to match your branding.

## Alternative: Using Gmail SMTP

If you prefer to use Gmail SMTP instead of Resend:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update the edge function to use nodemailer with Gmail SMTP
4. Set environment variables:
   ```bash
   supabase secrets set GMAIL_USER=your-email@gmail.com
   supabase secrets set GMAIL_APP_PASSWORD=your-app-password
   ```

## Troubleshooting

- **Emails not sending**: Check Supabase logs with `supabase functions logs send-notification-email`
- **pg_net errors**: Ensure the extension is enabled and configured correctly
- **Rate limits**: Resend free tier has limits; upgrade if needed
- **Spam folder**: Check spam/junk folders for test emails

## Notes

- The current implementation uses Resend API for reliability
- Emails are sent asynchronously and won't block database operations
- Failed email sends are logged but don't affect the notification creation
- For production, consider adding email queuing for better reliability
