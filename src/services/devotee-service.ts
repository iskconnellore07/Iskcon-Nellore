import { db } from "@/lib/firebase";
import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, writeBatch 
} from "firebase/firestore";
import type { Devotee, Donation, SmsLog } from "@/types/devotee-types";

// Helper to push to Google Sheets
async function syncToGoogleSheets(devotee: Partial<Devotee>) {
  const url = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxZ-DlzUDiC-0TfPUPEo_GlMQCTE8ykJXY8CCt-TdrKmAb7DiwAFaJiIFLASEduh7JRdg/exec";
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        formType: "DevoteeCRM",
        name: devotee.name || "",
        phone: devotee.phone || "",
        email: devotee.email || "",
        birthday: devotee.birthday || "",
        anniversary: devotee.anniversary || "",
        status: devotee.status || "active",
        date: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error("Failed to sync devotee to Google Sheets", err);
  }
}

export async function fetchDevotees(filters?: { status?: string; search?: string }) {
  let q = query(collection(db, "devotees"), orderBy("created_at", "desc"));
  
  if (filters?.status) {
    // Firestore requires compound index if orderBy is different than where, so we just filter status in JS if needed.
    // For simplicity, we fetch all and filter to avoid needing an index.
  }
  
  const snapshot = await getDocs(q);
  let devotees: Devotee[] = [];
  snapshot.forEach(docSnap => {
    devotees.push({ id: docSnap.id, ...docSnap.data() } as Devotee);
  });

  if (filters?.status) {
    devotees = devotees.filter(d => d.status === filters.status);
  }

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    devotees = devotees.filter(d => 
      (d.name?.toLowerCase() || '').includes(s) || 
      (d.phone || '').includes(s) || 
      (d.email?.toLowerCase() || '').includes(s)
    );
  }
  return devotees;
}

export async function fetchDevotee(id: string) {
  const docSnap = await getDoc(doc(db, "devotees", id));
  if (!docSnap.exists()) throw new Error("Not found");
  return { id: docSnap.id, ...docSnap.data() } as Devotee;
}

function removeUndefined(obj: any) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}

export async function createDevotee(devotee: Omit<Devotee, "id" | "created_at" | "updated_at">) {
  const data = removeUndefined({ ...devotee, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  const docRef = await addDoc(collection(db, "devotees"), data);
  const newDevotee = { id: docRef.id, ...data } as Devotee;
  
  syncToGoogleSheets(newDevotee).catch(console.error); // Fire and forget
  return newDevotee;
}

export async function updateDevotee(id: string, updates: Partial<Omit<Devotee, "id" | "created_at">>) {
  updates.updated_at = new Date().toISOString();
  await updateDoc(doc(db, "devotees", id), removeUndefined(updates));
  
  const updatedDoc = await fetchDevotee(id);
  syncToGoogleSheets(updatedDoc).catch(console.error); // Fire and forget
  return updatedDoc;
}

export async function deleteDevotee(id: string) {
  await deleteDoc(doc(db, "devotees", id));
}

export async function fetchDonationHistory(devoteeId: string) {
  const q = query(collection(db, "donations"), where("devotee_id", "==", devoteeId));
  const snapshot = await getDocs(q);
  const donations: Donation[] = [];
  snapshot.forEach(docSnap => {
    donations.push({ id: docSnap.id, ...docSnap.data() } as Donation);
  });
  return donations.sort((a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime());
}

export async function addDonation(donation: Omit<Donation, "id" | "created_at">) {
  const data = { ...donation, created_at: new Date().toISOString() };
  const docRef = await addDoc(collection(db, "donations"), data);
  return { id: docRef.id, ...data } as Donation;
}

export async function fetchSmsLogs(devoteeId?: string) {
  let q = query(collection(db, "sms_logs"));
  if (devoteeId) {
    q = query(collection(db, "sms_logs"), where("devotee_id", "==", devoteeId));
  }
  const snapshot = await getDocs(q);
  const logs: SmsLog[] = [];
  snapshot.forEach(docSnap => {
    logs.push({ id: docSnap.id, ...docSnap.data() } as SmsLog);
  });
  return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getSmsStats() {
  const logs = await fetchSmsLogs();
  const stats = { sent: 0, failed: 0, pending: 0 };
  logs.forEach(log => {
    if (log.status === "sent") stats.sent++;
    if (log.status === "failed") stats.failed++;
    if (log.status === "pending") stats.pending++;
  });
  return stats;
}

export async function getDevoteeStats() {
  const devs = await fetchDevotees();
  const stats = { active: 0, inactive: 0, paused: 0 };
  devs.forEach(d => {
    if (d.status === "active") stats.active++;
    if (d.status === "inactive") stats.inactive++;
    if (d.status === "paused") stats.paused++;
  });
  return stats;
}

export function exportDevokeesToCsv(devotees: Devotee[]) {
  const headers = ["Name", "Phone", "Email", "Birthday", "Anniversary", "Donation Day", "Donation Amount", "Status"];
  const rows = devotees.map(d => [
    d.name, d.phone, d.email || "", d.birthday || "", d.anniversary || "", 
    d.donation_day_of_month || "", d.donation_amount || "", d.status || "active"
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devotees-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function importDevoteesFromCsv(file: File) {
  return new Promise<Devotee[]>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        if (lines.length < 2) return resolve([]);
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        
        const devoteesToInsert = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const devotee: any = { created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          
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
            devoteesToInsert.push(devotee);
          }
        }

        if (devoteesToInsert.length > 0) {
          const batch = writeBatch(db);
          const newDevotees: Devotee[] = [];
          devoteesToInsert.forEach(d => {
            const newRef = doc(collection(db, "devotees"));
            const cleanData = removeUndefined(d);
            batch.set(newRef, cleanData);
            newDevotees.push({ id: newRef.id, ...cleanData } as Devotee);
          });
          await batch.commit();
          resolve(newDevotees);
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

export async function getUpcomingBirthdays(days: number = 7) {
  const devs = await fetchDevotees({ status: "active" });
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  return devs.filter(d => {
    if (!d.birthday) return false;
    const parts = d.birthday.split("-");
    if (parts.length !== 3) return false;
    const [, month, day] = parts;
    const birthDate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
    return birthDate >= today && birthDate <= endDate;
  });
}

export async function getUpcomingDonations(days: number = 7) {
  const devs = await fetchDevotees({ status: "active" });
  const today = new Date();
  const targetDays = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    targetDays.push(d.getDate());
  }

  return devs.filter(d => 
    d.donation_day_of_month && targetDays.includes(d.donation_day_of_month)
  );
}
