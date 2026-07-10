# 📋 Excel to Supabase Migration Guide

## Overview
This guide walks through migrating your Excel devotee data to Supabase (PostgreSQL database) for SMS reminders.

---

## Step 1: Prepare Your Excel File

### Expected CSV Format
Export your Excel file as **CSV** with these columns:

```
Name,Phone,Email,Birthday,Anniversary,Donation Day,Donation Amount,Status
Rama Kumar,+919876543210,rama@example.com,1985-05-15,2010-08-20,25,500,active
Gita Sharma,+918765432109,gita@example.com,1990-03-22,2015-06-10,15,1000,active
```

### Column Requirements
| Column | Format | Required | Example |
|--------|--------|----------|---------|
| Name | Text | ✅ Yes | Rama Kumar |
| Phone | E.164 format | ✅ Yes | +919876543210 |
| Email | Email | ❌ No | rama@example.com |
| Birthday | YYYY-MM-DD | ❌ No | 1985-05-15 |
| Anniversary | YYYY-MM-DD | ❌ No | 2010-08-20 |
| Donation Day | 1-31 | ❌ No | 25 |
| Donation Amount | Decimal | ❌ No | 500 |
| Status | active/inactive/paused | ❌ No | active |

### Excel Export Steps
1. Open your Excel file
2. **File → Export → Change File Type → CSV (Comma delimited)**
3. Save as `devotees.csv`
4. **⚠️ Important:** Ensure phone numbers include country code (+91 for India)

---

## Step 2: Create Supabase Project

### Option A: Use Existing (Already configured ✅)
```
Your project already has Supabase integration
URL: Check .env file for VITE_SUPABASE_URL
```

### Option B: Create New Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name:** iskcon-nellore-db
   - **Database Password:** Create strong password
   - **Region:** Asia-Mumbai (Closest to India)
4. Click **"Create new project"** (5-10 mins)

---

## Step 3: Set Up Database Schema

### Automatic Setup (Recommended)
1. Go to Supabase → Your Project → **SQL Editor**
2. Click **"New Query"**
3. Paste content from `supabase/migrations/001_create_devotee_tables.sql`
4. Click **"Run"**
5. ✅ Tables created!

### Manual Setup (If above doesn't work)
Run these SQL commands in Supabase SQL Editor:

```sql
CREATE TABLE devotees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  birthday DATE,
  anniversary DATE,
  donation_day_of_month INT,
  donation_amount DECIMAL(10, 2),
  donation_type TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotee_id UUID REFERENCES devotees(id),
  amount DECIMAL(10, 2),
  donation_date DATE,
  payment_method TEXT,
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotee_id UUID REFERENCES devotees(id),
  phone TEXT,
  message_type TEXT,
  message TEXT,
  status TEXT,
  sms_provider TEXT,
  provider_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Step 4: Import Data

### Method 1: Using Admin Dashboard (Easiest ✅)

1. **Navigate** to the DevoteeAdmin page in your app:
   ```
   http://localhost:5173/admin/devotees
   ```
   OR in production: `https://www.isckonnellore.com/admin/devotees`

2. **Click "Import CSV"** button

3. **Select** your `devotees.csv` file

4. **Wait** for completion ✅

### Method 2: Manual API Upload

```typescript
// Script to upload from CSV
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

async function importCsv(file: File) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const devotees = results.data
          .filter((row: any) => row.Name && row.Phone)
          .map((row: any) => ({
            name: row.Name,
            phone: row.Phone,
            email: row.Email || null,
            birthday: row.Birthday || null,
            anniversary: row.Anniversary || null,
            donation_day_of_month: row["Donation Day"] ? parseInt(row["Donation Day"]) : null,
            donation_amount: row["Donation Amount"] ? parseFloat(row["Donation Amount"]) : null,
            status: row.Status || "active",
          }));

        const { data, error } = await supabase
          .from("devotees")
          .insert(devotees);

        if (error) reject(error);
        resolve(data);
      },
    });
  });
}
```

### Method 3: Supabase UI Upload

1. Supabase Console → **Table Editor** → **devotees**
2. Click **"Import data"** → **CSV file**
3. Select your CSV
4. Map columns correctly
5. Click **"Import"**

---

## Step 5: Verify Data

### Check in Supabase Console
```
https://app.supabase.com/project/[YOUR_PROJECT_ID]/editor/0?schema=public
→ Table: devotees
```

### Check via your app
1. Go to **DevoteeAdmin** page
2. Should see all imported devotees

### Sample Query to Verify
```sql
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active 
FROM devotees;
```

Expected: Should show your total count

---

## Step 6: Data Cleanup & Validation

### Common Issues & Fixes

#### ❌ Phone numbers duplicate
**Error:** `duplicate key value violates unique constraint "devotees_phone_key"`

**Fix:** Check CSV for duplicate phone numbers

---

#### ❌ Invalid date format
**Error:** `invalid input syntax for type date`

**Fix:** Ensure dates are in **YYYY-MM-DD** format
```
Wrong: 15/05/1985 or 05-15-1985
Right: 1985-05-15
```

---

#### ❌ Phone without country code
**Error:** Messages fail to send

**Fix:** Ensure all phone numbers include +91
```
Wrong: 9876543210
Right: +919876543210
```

---

### Fix Phone Numbers (In Supabase SQL Editor)

```sql
-- Add +91 to numbers that don't have it
UPDATE devotees
SET phone = '+91' || phone
WHERE phone NOT LIKE '+%';
```

---

## Step 7: Test SMS Functionality

### Send Test SMS
1. Go to DevoteeAdmin → SMS Logs
2. Click on a devotee
3. Click **"Send Test SMS"**
4. Should receive SMS within 10 seconds ✅

---

## Step 8: Export for Backup

### Create Backup
1. DevoteeAdmin → Click **"Export CSV"**
2. Saves as `devotees-YYYY-MM-DD.csv`
3. Keep in safe location

### Regular Backups
Set up weekly automatic backup:
```sql
-- Run weekly to export
SELECT * FROM devotees;
-- Copy results to CSV
```

---

## Environment Variables to Check

Ensure these are set in your `.env` or `.env.local`:

```env
# Frontend (.env.local)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyxxx...

# Backend (payment-server/.env)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyxxx...
TWILIO_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_FROM=+919876543210
```

---

## Troubleshooting

### Can't see data in admin dashboard
1. **Refresh** browser (Ctrl+Shift+R)
2. **Check** browser console for errors (F12)
3. **Verify** Supabase connection in Network tab

### SMS not sending
1. Check **SMS Logs** tab for errors
2. Verify **Twilio credentials** are correct
3. Ensure phone numbers include **+91**
4. Check Twilio trial balance (Free $15 included)

### Slow performance with many devotees
- Supabase free tier handles 5,000+ records fine
- Use filters to view smaller datasets
- Consider pagination if > 10,000 records

---

## Security: Enable Row Level Security (RLS)

Make sure only authenticated users can access data:

```sql
-- Run in SQL Editor
ALTER TABLE devotees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON devotees
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all data" ON devotees
  FOR ALL USING (auth.role() = 'authenticated');
```

---

## Next Steps

1. ✅ Migrate Excel data to Supabase
2. ✅ Test SMS functionality
3. ⬜ Set up scheduler for automated reminders
4. ⬜ Deploy to production
5. ⬜ Monitor SMS logs weekly

---

## Contact Support

If issues arise:
1. Check **SMS Logs** for error details
2. Verify Supabase tables via SQL Editor
3. Test with **one devotee** first
4. Check browser **Developer Console** (F12)

---

## Quick Reference

### File Locations
- Migration Scripts: `supabase/migrations/`
- Admin Dashboard: `src/components/DevoteeAdmin/`
- Services: `src/services/devotee-service.ts`
- Types: `src/integrations/supabase/devotee-types.ts`

### Important URLs
- Supabase Console: https://app.supabase.com
- Admin Dashboard: `/admin/devotees` (in your app)
- SMS Logs: DevoteeAdmin → SMS Logs tab

---

## Hare Krishna! 🙏
Your devotee database is now ready for automated SMS reminders.
