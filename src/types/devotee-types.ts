export interface Devotee {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string; // YYYY-MM-DD
  anniversary?: string; // YYYY-MM-DD
  donation_day_of_month?: number;
  donation_amount?: number;
  donation_type?: 'monthly' | 'yearly' | 'one-time';
  status?: 'active' | 'inactive' | 'paused';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Donation {
  id: string;
  devotee_id: string;
  amount: number;
  donation_date: string; // YYYY-MM-DD
  payment_method?: 'cash' | 'google_pay' | 'phonepe' | 'bank_transfer';
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface SmsLog {
  id: string;
  devotee_id: string;
  phone: string;
  message_type: 'donation_reminder' | 'birthday' | 'anniversary' | 'manual';
  message: string;
  status: 'sent' | 'failed' | 'pending';
  sms_provider?: 'twilio' | 'exotel';
  provider_id?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface ReminderSent {
  id: string;
  devotee_id: string;
  reminder_type: 'donation' | 'birthday' | 'anniversary';
  reminder_month?: number;
  reminder_year?: number;
  sent_date: string;
  created_at: string;
}
