export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Devotee Types
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

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      devotees: {
        Row: Devotee;
        Insert: Omit<Devotee, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Devotee, 'id' | 'created_at'>>;
      };
      donations: {
        Row: Donation;
        Insert: Omit<Donation, 'id' | 'created_at'>;
        Update: Partial<Omit<Donation, 'id' | 'created_at'>>;
      };
      sms_logs: {
        Row: SmsLog;
        Insert: Omit<SmsLog, 'id' | 'created_at'>;
        Update: Partial<Omit<SmsLog, 'id' | 'created_at'>>;
      };
      reminders_sent: {
        Row: ReminderSent;
        Insert: Omit<ReminderSent, 'id' | 'created_at'>;
        Update: Partial<Omit<ReminderSent, 'id' | 'created_at'>>;
      };
      announcements: {
        Row: {
          active: boolean | null
          content: string
          created_at: string | null
          created_by: string | null
          expire_at: string | null
          id: string
          placement: string | null
          start_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string | null
          created_by?: string | null
          expire_at?: string | null
          id?: string
          placement?: string | null
          start_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          expire_at?: string | null
          id?: string
          placement?: string | null
          start_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
