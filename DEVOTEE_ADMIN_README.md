# 🙏 Devotee Management Admin Dashboard - Setup Guide

## Overview
A complete admin dashboard for managing ISKCON Nellore devotees, donations, and automated SMS reminders.

---

## 📁 File Structure

```
project/
├── src/
│   ├── components/
│   │   └── DevoteeAdmin/
│   │       ├── DevoteeAdmin.tsx          # Main dashboard
│   │       ├── DevoteeForm.tsx           # Add/Edit form
│   │       ├── DevoteeTable.tsx          # Devotee list table
│   │       ├── DonationHistory.tsx       # Donation management
│   │       ├── SmsLogs.tsx               # SMS audit trail
│   │       └── DashboardStats.tsx        # Statistics cards
│   ├── pages/
│   │   └── DevoteeAdmin.tsx              # Route page
│   ├── services/
│   │   └── devotee-service.ts            # Database operations
│   └── integrations/supabase/
│       ├── client.ts                     # Supabase client
│       └── devotee-types.ts              # TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_create_devotee_tables.sql # Database schema
├── public/
│   └── sample-devotees.csv               # Sample data
├── DATA_MIGRATION_GUIDE.md               # Excel→DB migration
└── DEVOTEE_ADMIN_README.md               # This file
```

---

## 🚀 Quick Start (5 minutes)

### 1. Add Route to App

In your `src/App.tsx` or routing file:

```typescript
import DevoteeAdmin from "@/pages/DevoteeAdmin";

// Add this route
const routes = [
  // ... existing routes
  {
    path: "/admin/devotees",
    element: <DevoteeAdmin />,
    // Optional: Add authentication check
    // requiresAuth: true
  }
];
```

### 2. Create Database Tables

1. Go to Supabase Console
2. SQL Editor → New Query
3. Paste from `supabase/migrations/001_create_devotee_tables.sql`
4. Click Run ✅

### 3. Start Using

```bash
npm run dev
```

Visit: `http://localhost:5173/admin/devotees`

---

## 🎯 Features

### ✅ Devotee Management
- **Create** new devotees with complete info
- **Read** search and filter devotees
- **Update** edit existing records
- **Delete** remove devotees
- **Import** from CSV files
- **Export** to CSV for backup

### ✅ Donation Tracking
- Record individual donations
- Track donation history per devotee
- View statistics (total, average, count)
- Support multiple payment methods

### ✅ SMS Monitoring
- View all SMS sent/failed/pending
- Filter by message type (donation, birthday, anniversary)
- Error details for failed messages
- Provider information (Twilio, Exotel, etc.)

### ✅ Dashboard Statistics
- Active/Inactive/Paused devotees count
- SMS success rate percentage
- Failed messages tracking
- Real-time updates

---

## 📊 Database Schema

### Devotees Table
```
id (UUID)                    - Unique identifier
name (Text)                  - Devotee name [Required]
phone (Text)                 - Phone number [Required, Unique, +91...]
email (Text)                 - Email address
birthday (Date)              - Birthday (YYYY-MM-DD)
anniversary (Date)           - Anniversary (YYYY-MM-DD)
donation_day_of_month (INT)  - Day 1-31 for monthly reminder
donation_amount (Decimal)    - Amount in rupees
donation_type (Text)         - 'monthly', 'yearly', 'one-time'
status (Text)                - 'active', 'inactive', 'paused'
notes (Text)                 - Additional notes
created_at (Timestamp)       - Creation time
updated_at (Timestamp)       - Last update time
```

### Donations Table
```
id (UUID)                    - Unique identifier
devotee_id (UUID)            - Reference to devotee
amount (Decimal)             - Donation amount
donation_date (Date)         - Date of donation
payment_method (Text)        - 'cash', 'google_pay', 'phonepe', 'bank_transfer'
reference_id (Text)          - Transaction ID
notes (Text)                 - Additional notes
created_at (Timestamp)       - Record creation time
```

### SMS Logs Table
```
id (UUID)                    - Unique identifier
devotee_id (UUID)            - Reference to devotee
phone (Text)                 - Recipient phone
message_type (Text)          - 'donation_reminder', 'birthday', 'anniversary', 'manual'
message (Text)               - SMS content
status (Text)                - 'sent', 'failed', 'pending'
sms_provider (Text)          - 'twilio', 'exotel'
provider_id (Text)           - External message ID
error_message (Text)         - Error details if failed
sent_at (Timestamp)          - When SMS was sent
created_at (Timestamp)       - Record creation time
```

---

## 🔐 User Roles & Permissions

### Current Setup
- **Authenticated users only** - Can access admin dashboard
- Full CRUD access for devotee data

### Future Enhancement (Optional)
Add role-based access:
```sql
-- Add roles
ALTER TABLE devotees ADD COLUMN created_by UUID REFERENCES auth.users(id);
ALTER TABLE devotees ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- RLS policies by role
CREATE POLICY "Admins only" ON devotees
  FOR ALL USING (
    (SELECT role FROM auth.user_roles WHERE user_id = auth.uid()) = 'admin'
  );
```

---

## 📥 Importing Data from Excel

### Step-by-Step

1. **Prepare Excel File**
   - Export as CSV with correct headers
   - Ensure phone numbers have +91 prefix
   - Dates must be YYYY-MM-DD format

2. **Use Admin Dashboard** (Easiest)
   - Go to `/admin/devotees`
   - Click "Import CSV"
   - Select your file
   - ✅ Done!

3. **Sample Data**
   - Use `public/sample-devotees.csv` for testing
   - Hindi names included for reference

### CSV Format
```
Name,Phone,Email,Birthday,Anniversary,Donation Day,Donation Amount,Status
राम कुमार,+919876543210,ram@example.com,1985-05-15,2010-08-20,25,500,active
```

---

## 💾 Exporting Data

### Backup Your Data
1. `/admin/devotees`
2. Click "Export CSV"
3. Save `devotees-YYYY-MM-DD.csv`
4. Store safely

### Uses
- Regular backups
- Analysis in Excel
- Database migrations
- Data sharing

---

## 🔑 API Operations

### Core Service Functions

```typescript
import { 
  fetchDevotees,           // Get all devotees
  fetchDevotee,            // Get single devotee
  createDevotee,           // Create new
  updateDevotee,           // Update existing
  deleteDevotee,           // Delete devotee
  fetchDonationHistory,    // Get donations
  addDonation,             // Record donation
  fetchSmsLogs,            // Get SMS logs
  getDevoteeStats,         // Statistics
  getSmsStats,             // SMS statistics
  exportDevokeesToCsv,     // Export to CSV
  importDevoteesFromCsv,   // Import from CSV
  getUpcomingBirthdays,    // Birthdays next N days
  getUpcomingDonations     // Donations due soon
} from "@/services/devotee-service";
```

### Example Usage

```typescript
// Import devotees
const devotees = await fetchDevotees({
  status: "active",
  search: "Ram"
});

// Create devotee
const newDevotee = await createDevotee({
  name: "राम कुमार",
  phone: "+919876543210",
  email: "ram@example.com",
  birthday: "1985-05-15",
  donation_day_of_month: 25,
  donation_amount: 500,
  status: "active"
});

// Record donation
const donation = await addDonation({
  devotee_id: "uuid-here",
  amount: 500,
  donation_date: "2024-03-20",
  payment_method: "google_pay"
});
```

---

## 🧪 Testing

### Test with Sample Data

1. **Load Sample CSV**
   - Admin → Import CSV
   - Choose `public/sample-devotees.csv`
   - ✅ 10 test records imported

2. **Test Each Feature**
   - Search: Type "Ram" in search box
   - Filter: Select "Active" status
   - Edit: Click edit on any devotee
   - Create: Click "Add Devotee"
   - Delete: Click delete (confirms first)

3. **Test Donations Tab**
   - Select any devotee
   - Click "Donations" tab
   - Add a test donation
   - Verify in table

4. **Test SMS Logs Tab**
   - Should be empty initially
   - Populates once SMS are sent
   - View all logs there

---

## 🐛 Troubleshooting

### Admin page not loading
```
Error: "Cannot find component"
Solution: Ensure route is properly configured in App.tsx
```

### Can't import CSV
```
Error: "Field count mismatch"
Solution: Check CSV headers match exactly:
  Name,Phone,Email,Birthday,Anniversary,Donation Day,Donation Amount,Status
```

### Phone number validation fails
```
Error: "Phone must be unique"
Solution: Check for duplicates in CSV
  Use: SELECT phone, COUNT(*) FROM devotees GROUP BY phone HAVING COUNT(*) > 1;
```

### Supabase connection error
```
Error: "Failed to load devotees"
Solution: Verify environment variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## 🚀 Enhancement Ideas

### Phase 2 Features
- [ ] SMS template builder
- [ ] Bulk SMS sending
- [ ] Event management (weddings, events)
- [ ] Attendance tracking
- [ ] Donation receipts/invoices
- [ ] Birthday/Anniversary report
- [ ] Payment gateway integration
- [ ] Mobile app version

### Phase 3 Features
- [ ] AI-powered donor matching
- [ ] Predictive giving patterns
- [ ] Multi-language support
- [ ] QR code donations
- [ ] Real-time dashboards
- [ ] Advanced analytics
- [ ] WhatsApp integration
- [ ] Email reminders

---

## 📱 Mobile Responsive

The dashboard is fully responsive:
- ✅ Mobile phones (320px+)
- ✅ Tablets (768px+)
- ✅ Desktops (1024px+)

---

## 🔒 Security Checklist

- [ ] Enable Row Level Security (RLS)
- [ ] Create authentication middleware
- [ ] Log all admin actions
- [ ] Regular backups scheduled
- [ ] API rate limiting enabled
- [ ] Input validation on all forms
- [ ] HTTPS enforced in production
- [ ] Environment variables secured

---

## 📞 Support

### Get Help
1. Check SMS Logs for errors
2. Verify database in Supabase Console
3. Test with sample data first
4. Review browser console (F12)

### Common Questions

**Q: How many devotees can I manage?**
A: Supabase free tier supports 500MB and unlimited records. Scale up as needed.

**Q: Can I export to Excel?**
A: Yes! Click "Export CSV" and open in Excel.

**Q: How often do reminders send?**
A: Depends on scheduler configuration (usually daily).

**Q: Can multiple admins access?**
A: Yes, with Supabase authentication.

---

## 📚 Related Documentation

- **Migration Guide:** `DATA_MIGRATION_GUIDE.md`
- **SMS Setup:** `payment-server/README.md`
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev

---

## 🙏 Hari Om!

Thank you for using this dashboard for ISKCON Nellore's Seva.
May Lord Krishna bless all devotees! 🙏

---

**Version:** 1.0.0
**Last Updated:** March 2026
**Maintained by:** ISKCON Nellore Tech Team
