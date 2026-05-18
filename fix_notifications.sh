#!/bin/bash

# Quick Fix Script for Notifications
# Run this to apply all migrations and verify setup

echo "=========================================="
echo "🔧 NOTIFICATION SYSTEM - QUICK FIX"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Applying Database Migrations...${NC}"
echo "----------------------------------------"

# Check if supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓ Supabase CLI found${NC}"
    echo ""
    echo "Applying migrations..."
    supabase db push

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migrations applied successfully!${NC}"
    else
        echo -e "${RED}✗ Migration failed${NC}"
        echo ""
        echo -e "${YELLOW}Manual steps:${NC}"
        echo "1. Go to Supabase Dashboard → SQL Editor"
        echo "2. Run these files in order:"
        echo "   - supabase/migrations/20260517080000_add_notifications_and_friends.sql"
        echo "   - supabase/migrations/20260517082000_add_email_queue.sql"
        echo "   - supabase/migrations/20260518064300_ensure_email_queue.sql"
        echo "   - supabase/migrations/20260518064400_fix_gmail_notifications.sql"
    fi
else
    echo -e "${YELLOW}⚠ Supabase CLI not installed${NC}"
    echo ""
    echo -e "${YELLOW}Manual steps required:${NC}"
    echo "1. Go to Supabase Dashboard → SQL Editor"
    echo "2. Run these files in order:"
    echo "   - supabase/migrations/20260517080000_add_notifications_and_friends.sql"
    echo "   - supabase/migrations/20260517082000_add_email_queue.sql"
    echo "   - supabase/migrations/20260518064300_ensure_email_queue.sql"
    echo "   - supabase/migrations/20260518064400_fix_gmail_notifications.sql"
fi

echo ""
echo -e "${BLUE}Step 2: Verification${NC}"
echo "----------------------------------------"
echo "Run this SQL in Supabase SQL Editor to verify:"
echo ""
echo -e "${YELLOW}SELECT 'notifications' as table_name,"
echo "  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') as exists"
echo "UNION ALL"
echo "SELECT 'email_queue',"
echo "  EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue');"
echo ""
echo "SELECT tgname, tgenabled FROM pg_trigger WHERE tgname LIKE '%notify%';${NC}"

echo ""
echo -e "${BLUE}Step 3: Test Notifications${NC}"
echo "----------------------------------------"
echo "1. Start dev server: ${GREEN}npm run dev${NC}"
echo "2. Create two test accounts"
echo "3. User A sends connection request to User B"
echo "4. User B should see bell icon with badge"
echo "5. Check email_queue table for queued email"

echo ""
echo -e "${BLUE}Step 4: Set Up Email Delivery (Optional)${NC}"
echo "----------------------------------------"
echo "1. Sign up at https://resend.com"
echo "2. Get API key"
echo "3. Run:"
echo "   ${GREEN}supabase secrets set RESEND_API_KEY=re_your_key${NC}"
echo "   ${GREEN}supabase functions deploy send-notification-email${NC}"
echo "   ${GREEN}supabase functions deploy process-email-queue${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Fix script complete!${NC}"
echo "=========================================="
echo ""
echo "Next: Apply migrations and test"
echo "See CRITICAL_FIX_NOTIFICATIONS.md for details"
echo ""
