// src/services/devotee-service.ts
import { supabase } from "@/integrations/supabase/client";
import type { Devotee, Donation, SmsLog } from "@/integrations/supabase/devotee-types";

/**
 * Fetch all devotees with optional filters
 */
export async function fetchDevotees(filters?: {
  status?: string;
  search?: string;
}) {
  let query = supabase.from("devotees").select("*");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw error;
  return data as Devotee[];
}

/**
 * Fetch single devotee by ID
 */
export async function fetchDevotee(id: string) {
  const { data, error } = await supabase
    .from("devotees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Devotee;
}

/**
 * Create new devotee
 */
export async function createDevotee(devotee: Omit<Devotee, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("devotees")
    .insert(devotee)
    .select()
    .single();

  if (error) throw error;
  return data as Devotee;
}

/**
 * Update existing devotee
 */
export async function updateDevotee(
  id: string,
  updates: Partial<Omit<Devotee, "id" | "created_at">>
) {
  const { data, error } = await supabase
    .from("devotees")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Devotee;
}

/**
 * Delete devotee
 */
export async function deleteDevotee(id: string) {
  const { error } = await supabase.from("devotees").delete().eq("id", id);

  if (error) throw error;
}

/**
 * Fetch donation history for a devotee
 */
export async function fetchDonationHistory(devoteeId: string) {
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("devotee_id", devoteeId)
    .order("donation_date", { ascending: false });

  if (error) throw error;
  return data as Donation[];
}

/**
 * Add donation record
 */
export async function addDonation(donation: Omit<Donation, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("donations")
    .insert(donation)
    .select()
    .single();

  if (error) throw error;
  return data as Donation;
}

/**
 * Get SMS logs for a devotee
 */
export async function fetchSmsLogs(devoteeId?: string) {
  let query = supabase.from("sms_logs").select("*");

  if (devoteeId) {
    query = query.eq("devotee_id", devoteeId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data as SmsLog[];
}

/**
 * Get SMS statistics
 */
export async function getSmsStats() {
  const { data, error } = await supabase
    .from("sms_logs")
    .select("status, COUNT(*) as count", { count: "exact" })
    .group_by("status");

  if (error) throw error;
  
  const stats = {
    sent: 0,
    failed: 0,
    pending: 0,
  };

  (data as any[])?.forEach((item) => {
    stats[item.status as keyof typeof stats] = item.count;
  });

  return stats;
}

/**
 * Get devotee statistics
 */
export async function getDevoteeStats() {
  const { data, error } = await supabase
    .from("devotees")
    .select("status, COUNT(*) as count", { count: "exact" })
    .group_by("status");

  if (error) throw error;

  const stats = {
    active: 0,
    inactive: 0,
    paused: 0,
  };

  (data as any[])?.forEach((item) => {
    stats[item.status as keyof typeof stats] = item.count;
  });

  return stats;
}

/**
 * Export devotees to CSV
 */
export function exportDevokeesToCsv(devotees: Devotee[]) {
  const headers = [
    "Name",
    "Phone",
    "Email",
    "Birthday",
    "Anniversary",
    "Donation Day",
    "Donation Amount",
    "Status",
  ];

  const rows = devotees.map((d) => [
    d.name,
    d.phone,
    d.email || "",
    d.birthday || "",
    d.anniversary || "",
    d.donation_day_of_month || "",
    d.donation_amount || "",
    d.status || "active",
  ]);

  const csv =
    [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devotees-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Import devotees from CSV
 */
export async function importDevoteesFromCsv(file: File) {
  return new Promise<Devotee[]>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        const devotees: Omit<Devotee, "id" | "created_at" | "updated_at">[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const devotee: any = {};

          headers.forEach((header, index) => {
            if (header === "name") devotee.name = values[index];
            if (header === "phone") devotee.phone = values[index];
            if (header === "email") devotee.email = values[index] || undefined;
            if (header === "birthday") devotee.birthday = values[index] || undefined;
            if (header === "anniversary") devotee.anniversary = values[index] || undefined;
            if (header === "donation day") devotee.donation_day_of_month = parseInt(values[index]) || undefined;
            if (header === "donation amount") devotee.donation_amount = parseFloat(values[index]) || undefined;
            if (header === "status") devotee.status = values[index] || "active";
          });

          if (devotee.name && devotee.phone) {
            devotees.push(devotee);
          }
        }

        // Bulk insert
        if (devotees.length > 0) {
          const { data, error } = await supabase
            .from("devotees")
            .insert(devotees)
            .select();

          if (error) throw error;
          resolve(data as Devotee[]);
        } else {
          resolve([]);
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Get devotees with birthdays in next N days
 */
export async function getUpcomingBirthdays(days: number = 7) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  const { data, error } = await supabase
    .from("devotees")
    .select("*")
    .eq("status", "active")
    .not("birthday", "is", null);

  if (error) throw error;

  // Filter in JS since SQL date filtering is tricky for birthdays
  return (data as Devotee[]).filter((d) => {
    if (!d.birthday) return false;
    const [, month, day] = d.birthday.split("-");
    const birthDate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));

    return birthDate >= today && birthDate <= endDate;
  });
}

/**
 * Get devotees with upcoming donations
 */
export async function getUpcomingDonations(days: number = 7) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  const targetDays = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    targetDays.push(d.getDate());
  }

  const { data, error } = await supabase
    .from("devotees")
    .select("*")
    .eq("status", "active")
    .in("donation_day_of_month", targetDays);

  if (error) throw error;
  return data as Devotee[];
}
