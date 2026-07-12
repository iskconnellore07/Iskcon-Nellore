import cron from "node-cron";
import Msg91SmsService from "../services/msg91-sms.js";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, addDoc } from "firebase/firestore";
import type { Devotee } from "../types/index.js";

const firebaseConfig = {
  apiKey: "AIzaSyAiRwVZi3NWMALFOGuW9VFunYfRWY0qQIo",
  authDomain: "iskcon-nellore.firebaseapp.com",
  projectId: "iskcon-nellore",
  storageBucket: "iskcon-nellore.firebasestorage.app",
  messagingSenderId: "866388993763",
  appId: "1:866388993763:web:635954965e4f2e2127c7d6",
  measurementId: "G-XJ5VFDB8PS"
};

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

const smsService = new Msg91SmsService();

export function initBirthdayScheduler() {
  console.log("🎂 Birthday SMS Scheduler initialized (Firebase)");

  cron.schedule("30 7 * * *", async () => {
    console.log(`\n🔔 [${new Date().toISOString()}] Running birthday reminder check...`);

    try {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      const q = query(collection(firestoreDb, "devotees"), where("status", "==", "active"));
      const snapshot = await getDocs(q);
      
      const devotees: Devotee[] = [];
      snapshot.forEach(docSnap => {
        devotees.push({ id: docSnap.id, ...docSnap.data() } as any);
      });

      if (devotees.length === 0) {
        console.log("ℹ️ No devotees found");
        return;
      }

      const todaysBirthdays = devotees.filter((devotee) => {
        if (!devotee.birthday) return false;
        const parts = devotee.birthday.split("-");
        if (parts.length !== 3) return false;
        const [, bMonth, bDay] = parts;
        return bMonth === month && bDay === day;
      });

      if (todaysBirthdays.length === 0) {
        console.log("ℹ️ No birthdays today");
        return;
      }

      console.log(`🎂 Found ${todaysBirthdays.length} devotee(s) with birthday today`);

      for (const devotee of todaysBirthdays) {
        try {
          const smsResult = await smsService.sendBirthdayReminder(
            devotee.phone,
            devotee.name
          );

          try {
            await addDoc(collection(firestoreDb, "sms_logs"), {
              devotee_id: devotee.id,
              phone: devotee.phone,
              message_type: "birthday",
              message: `Birthday wish for ${devotee.name}`,
              status: smsResult.success ? "sent" : "failed",
              sms_provider: "msg91",
              provider_id: smsResult.messageId || null,
              error_message: smsResult.error || null,
              sent_at: smsResult.success ? new Date().toISOString() : null,
              created_at: new Date().toISOString()
            });
            
            if (smsResult.success) {
              console.log(`✅ Birthday SMS sent to ${devotee.name} (${devotee.phone})`);
            } else {
              console.error(`❌ Birthday SMS failed for ${devotee.name}: ${smsResult.error}`);
            }
          } catch (logError) {
            console.error(`❌ Failed to log SMS for ${devotee.name}:`, logError);
          }
        } catch (error: any) {
          console.error(`❌ Error processing ${devotee.name}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error("❌ Birthday scheduler error:", error.message);
    }
  });

  console.log("✅ Birthday scheduler running (checks daily at 13:00 IST / 07:30 UTC)");
}

export async function sendBirthdaySmsByDevoteeId(devoteeId: string): Promise<{
  success: boolean;
  message: string;
}> {
  return { success: false, message: "Manual trigger disabled" };
}

export default initBirthdayScheduler;
