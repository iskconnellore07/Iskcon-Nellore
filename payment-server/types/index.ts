// payment-server/types/index.ts
export interface Devotee {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  anniversary?: string;
  donation_day_of_month?: number;
  donation_amount?: number;
  donation_type?: "monthly" | "yearly" | "one-time";
  status?: "active" | "inactive" | "paused";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SmsLog {
  id: string;
  devotee_id: string;
  phone: string;
  message_type: "donation_reminder" | "birthday" | "anniversary" | "manual";
  message: string;
  status: "sent" | "failed" | "pending";
  sms_provider?: "twilio" | "exotel";
  provider_id?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface PaymentOrder {
  id: string;
  name: string;
  phone: string;
  email: string;
  festival: string;
  date: string;
  slot: string;
  people: number;
  amount: number;
  status: "created" | "paid" | "failed";
  created_at: string;
}
