# 🙏 ISKCON Nellore Payment & SMS Server

This Express server powers:
1. ✅ **Abhishekam Bookings** - Razorpay payment processing
2. ✅ **SMS Reminders** - Birthday & donation notifications via Twilio
3. ✅ **Devotee Management** - Supabase database integration

---

## 📋 Quick Setup

### 1. Install Dependencies

```bash
cd payment-server
npm install
```

### 2. Configure Environment Variables

Create `.env` file:

```env
# ========== TWILIO SMS CONFIGURATION ==========
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM=+91XXXXXXXXXX

# ========== SUPABASE CONFIGURATION ==========
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyxxx...

# ========== RAZORPAY CONFIGURATION ==========
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# ========== SERVER ==========
PORT=4000
```

### 3. Start Server

```bash
npm start

# Expected output:
# ✅ Birthday scheduler running (checks daily at 13:00 IST / 07:30 UTC)
# 🚀 Payment Server running on port 4000
```

---

## 🇮🇳 India TRAI Compliance

**Important:** For production SMS in India, register with TRAI:

| Step | Action | Timeline | Status |
|------|--------|----------|--------|
| 1 | Register sender "ISKCON" in DLT | 1 day | ⏳ To Do |
| 2 | Wait for approval | 2-5 days | ⏳ To Do |
| 3 | Sender becomes active | Immediate | ⏳ Pending |

👉 **See SETUP GUIDE below for detailed DLT registration steps**

---

## 🚀 SMS Features

### ✅ Birthday Reminders
- **Trigger:** March 22 at 13:00 IST every year
- **Recipient:** Tagore Anand (+917842557205)
- **Message:** Personalized birthday wish
- **Scheduler:** Runs automatically via cron

### ✅ Donation Reminders
- **Trigger:** 7 days before donation due date
- **Message:** Friendly reminder with donation link
- **Status:** Active (automatic daily check)

### ✅ Anniversary Greetings
- **Trigger:** Anniversary date every year
- **Message:** Personalized anniversary blessing
- **Status:** Active (ready to use)

---

## 📊 Database Schema

All SMS details logged in Supabase:

```sql
SELECT * FROM sms_logs
-- Shows: message_type, status, provider, error_message
-- Example types: 'birthday', 'donation_reminder', 'anniversary'
-- Example status: 'sent', 'failed', 'pending'
```

---

## 🔐 Complete Setup Guide

### Step 1: Twilio Credentials

1. Go to https://www.twilio.com/console
2. Copy **Account SID** (starts with AC...)
3. Click **Show** Auth Token and copy it
4. Get a **Twilio Number** or use your phone
5. Add to `.env`:

```env
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Your Account SID
TWILIO_AUTH_TOKEN=xxx...                    # Your Auth Token
TWILIO_FROM=+91XXXXXXXXXX                   # Your Twilio number
```

### Step 2: Supabase Credentials

1. Go to https://app.supabase.com/project/{YOUR_PROJECT}
2. Settings → API → Copy **Project URL**
3. Settings → API → Scroll to **Service Role** → Copy key
4. Add to `.env`:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyxxx...
```

### Step 3: TRAI DLT Registration (Production)

**For India SMS to work properly, you MUST register:**

1. Visit: https://www.bsda.gov.in/content/dlt/2/home.html
2. Register entity as: **ISKCON Nellore Temple**
3. Sender ID: **ISKCON** (or ISKCON-NL)
4. Upload:
   - Organization certificate
   - PAN card
   - Board resolution
   - Authorized signatory ID
5. **Wait 2-5 business days for approval**
6. Once approved, SMS will deliver reliably

**Without DLT registration:** SMS may be rejected/delayed in India

### Step 4: Add Tagore Anand

Option A - Via Admin Dashboard:
```
Go to: http://localhost:5173/admin/devotees
Click "Add Devotee"
Fill: Name=Tagore Anand, Phone=+917842557205, Birthday=1994-03-22
```

Option B - Via Supabase SQL:
```sql
INSERT INTO devotees (name, phone, birthday, status)
VALUES ('Tagore Anand', '+917842557205', '1994-03-22', 'active');
```

### Step 5: Test SMS

```bash
# Start server
npm start

# Test birthday SMS for Tagore Anand
curl -X POST http://localhost:4000/send-birthday-test \
  -H "Content-Type: application/json" \
  -d '{"phone": "+917842557205", "name": "Tagore Anand"}'
```

---

## 📱 SMS Service API

### Services Available

```typescript
// 1. Send Birthday Reminder
sendBirthdayReminder(phone, name)

// 2. Send Donation Reminder  
sendDonationReminder(phone, name, amount)

// 3. Send Anniversary Greeting
sendAnniversaryReminder(phone, name)

// 4. Send Custom Message
sendCustom(phone, message, type)
```

### Example Usage

```javascript
import TwilioSmsService from "./services/twilio-sms.js";

const sms = new TwilioSmsService();

// Send birthday SMS
const result = await sms.sendBirthdayReminder(
  "+917842557205",
  "Tagore Anand"
);

if (result.success) {
  console.log("✅ SMS sent:", result.messageId);
} else {
  console.error("❌ SMS failed:", result.error);
}
```

---

## ⏰ Scheduler Configuration

### Birthday Scheduler (Runs Daily)

**Cron Expression:** `30 7 * * *`
- **When:** 07:30 UTC = 13:00 IST (1 PM India time)
- **Frequency:** Every day (checks birthdays)
- **Action:** Sends SMS to devotees with birthdays today

### Files

- `schedulers/birthday-scheduler.ts` - Main birthday logic
- `services/twilio-sms.ts` - Twilio integration
- `types/index.ts` - TypeScript types

---

## 🧪 Testing
cp .env.example .env
# set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
```

4. Start the server:

```bash
npm start
```

Endpoints

- `POST /create-order` — creates a Razorpay order. Body: `{ name, phone, email, festival, date, slot, people, amount }`. Returns: `{ orderId, amount, currency, keyId, amountInRupees }` for Razorpay Checkout.
- `POST /verify-payment` — verifies the Razorpay signature and marks the order paid. Body: `{ orderId, paymentId, signature }`.
- `GET /orders/:id` — fetch stored order metadata (in-memory store; test use only).

Orders are held in memory, so restart clears history. Use Razorpay test keys only in this environment.
