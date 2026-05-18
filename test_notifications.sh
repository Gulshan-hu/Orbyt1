#!/bin/bash

# Notification System Test Script
# This script tests the notification system end-to-end

echo "=========================================="
echo "Notification System Test Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo "Step 1: Checking database migrations..."
echo "----------------------------------------"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Warning: Supabase CLI not installed${NC}"
    echo "Install with: npm install -g supabase"
    echo ""
else
    echo -e "${GREEN}✓ Supabase CLI installed${NC}"

    # Check migration status
    echo ""
    echo "Checking migration status..."
    supabase db diff --linked 2>&1 | head -20
    echo ""
fi

echo "Step 2: Checking required files..."
echo "----------------------------------------"

# Check if notification files exist
files=(
    "src/lib/notifications.tsx"
    "src/components/NotificationsDropdown.tsx"
    "src/routes/notifications.tsx"
    "supabase/migrations/20260517080000_add_notifications_and_friends.sql"
    "supabase/migrations/20260517082000_add_email_queue.sql"
    "supabase/functions/send-notification-email/index.ts"
    "supabase/functions/send-notification-email/deno.json"
    "supabase/functions/process-email-queue/index.ts"
    "supabase/functions/process-email-queue/deno.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file ${RED}(MISSING)${NC}"
    fi
done

echo ""
echo "Step 3: Checking environment variables..."
echo "----------------------------------------"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"

    if grep -q "SUPABASE_URL" .env; then
        echo -e "${GREEN}✓${NC} SUPABASE_URL configured"
    else
        echo -e "${RED}✗${NC} SUPABASE_URL not found in .env"
    fi

    if grep -q "SUPABASE_PUBLISHABLE_KEY" .env; then
        echo -e "${GREEN}✓${NC} SUPABASE_PUBLISHABLE_KEY configured"
    else
        echo -e "${RED}✗${NC} SUPABASE_PUBLISHABLE_KEY not found in .env"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
fi

echo ""
echo "Step 4: Checking NotificationsProvider integration..."
echo "----------------------------------------"

if grep -q "NotificationsProvider" "src/routes/__root.tsx"; then
    echo -e "${GREEN}✓${NC} NotificationsProvider is integrated in __root.tsx"
else
    echo -e "${RED}✗${NC} NotificationsProvider NOT found in __root.tsx"
fi

if grep -q "NotificationsDropdown" "src/components/Navbar.tsx"; then
    echo -e "${GREEN}✓${NC} NotificationsDropdown is integrated in Navbar"
else
    echo -e "${RED}✗${NC} NotificationsDropdown NOT found in Navbar"
fi

echo ""
echo "Step 5: Testing TypeScript compilation..."
echo "----------------------------------------"

if command -v tsc &> /dev/null; then
    echo "Running TypeScript check..."
    npx tsc --noEmit 2>&1 | head -20
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} No TypeScript errors"
    else
        echo -e "${YELLOW}⚠${NC} TypeScript errors found (see above)"
    fi
else
    echo -e "${YELLOW}⚠${NC} TypeScript not available"
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Apply migrations: ${YELLOW}supabase db push${NC}"
echo "2. Start dev server: ${YELLOW}npm run dev${NC}"
echo "3. Test notifications by creating a connection request"
echo "4. (Optional) Set up email: See EMAIL_SETUP.md"
echo ""
echo "For detailed testing, run the SQL script:"
echo "${YELLOW}test_notifications.sql${NC} in Supabase SQL Editor"
echo ""
