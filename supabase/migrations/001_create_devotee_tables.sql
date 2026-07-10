-- Devotees Table
CREATE TABLE IF NOT EXISTS devotees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  birthday DATE,
  anniversary DATE,
  donation_day_of_month INT CHECK (donation_day_of_month >= 1 AND donation_day_of_month <= 31),
  donation_amount DECIMAL(10, 2),
  donation_type TEXT DEFAULT 'monthly', -- 'monthly', 'yearly', 'one-time'
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'paused'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Donations Ledger
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotee_id UUID NOT NULL REFERENCES devotees(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  donation_date DATE NOT NULL,
  payment_method TEXT, -- 'cash', 'google_pay', 'phonepe', 'bank_transfer'
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotee_id UUID NOT NULL REFERENCES devotees(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'donation_reminder', 'birthday', 'anniversary', 'manual'
  message TEXT NOT NULL,
  status TEXT NOT NULL, -- 'sent', 'failed', 'pending'
  sms_provider TEXT, -- 'twilio', 'exotel'
  provider_id TEXT, -- External message ID
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reminders History (Track what reminders were sent)
CREATE TABLE IF NOT EXISTS reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotee_id UUID NOT NULL REFERENCES devotees(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'donation', 'birthday', 'anniversary'
  reminder_month INT,
  reminder_year INT,
  sent_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(devotee_id, reminder_type, reminder_month, reminder_year)
);

-- Create indexes for faster queries
CREATE INDEX idx_devotees_phone ON devotees(phone);
CREATE INDEX idx_devotees_status ON devotees(status);
CREATE INDEX idx_devotees_birthday ON devotees(birthday);
CREATE INDEX idx_devotees_anniversary ON devotees(anniversary);
CREATE INDEX idx_devotees_donation_day ON devotees(donation_day_of_month);
CREATE INDEX idx_sms_logs_devotee_id ON sms_logs(devotee_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_created_at ON sms_logs(created_at);
CREATE INDEX idx_donations_devotee_id ON donations(devotee_id);
CREATE INDEX idx_donations_date ON donations(donation_date);

-- Enable Row Level Security (RLS)
ALTER TABLE devotees ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders_sent ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admin Only
CREATE POLICY "Admin full access" ON devotees
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access" ON donations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access" ON sms_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access" ON reminders_sent
  FOR ALL USING (auth.role() = 'authenticated');

-- Triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER devotees_updated_at BEFORE UPDATE ON devotees
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
