// payment-server/schedulers/birthday-scheduler.ts
import cron from "node-cron";
import Msg91SmsService from "../services/msg91-sms.js";
import { createClient } from "@supabase/supabase-js";
import type { Devotee } from "../types/index.js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const smsService = new Msg91SmsService();

/**
 * Birthday SMS Scheduler
 * Sends birthday wishes at 13:00 IST (07:30 UTC) every day to devotees with birthdays
 *
 * IST to UTC conversion:
 * 13:00 IST = 07:30 UTC (IST is UTC+5:30)
 *
 * Cron format: minute hour day month dayOfWeek
 * "30 7 * * *" = Every day at 07:30 UTC = 13:00 IST
 */
export function initBirthdayScheduler() {
  console.log("🎂 Birthday SMS Scheduler initialized");

  // Send birthday reminders at 13:00 IST (07:30 UTC) every day
  cron.schedule("30 7 * * *", async () => {
    console.log(`\n🔔 [${new Date().toISOString()}] Running birthday reminder check...`);

    try {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      // Query devotees with today's birthday
      const { data: devotees, error } = await supabase
        .from("devotees")
        .select("*")
        .eq("status", "active")
        .not("birthday", "is", null);

      if (error) {
        console.error("❌ Database query failed:", error);
        return;
      }

      if (!devotees || devotees.length === 0) {
        console.log("ℹ️ No devotees found");
        return;
      }

      // Filter devotees with birthdays today
      const todaysBirthdays = (devotees as Devotee[]).filter((devotee) => {
        if (!devotee.birthday) return false;
        const [, bMonth, bDay] = devotee.birthday.split("-");
        return bMonth === month && bDay === day;
      });

      if (todaysBirthdays.length === 0) {
        console.log("ℹ️ No birthdays today");
        return;
      }

      console.log(`🎂 Found ${todaysBirthdays.length} devotee(s) with birthday today`);

      // Send SMS to each devotee
      for (const devotee of todaysBirthdays) {
        try {
          // Send birthday SMS via MSG91
          const smsResult = await smsService.sendBirthdayReminder(
            devotee.phone,
            devotee.name
          );

          // Log SMS in database
          const { error: logError } = await supabase
            .from("sms_logs")
            .insert({
              devotee_id: devotee.id,
              phone: devotee.phone,
              message_type: "birthday",
              message: `Birthday wish for ${devotee.name}`,
              status: smsResult.success ? "sent" : "failed",
              sms_provider: "msg91",
              provider_id: smsResult.messageId || null,
              error_message: smsResult.error || null,
              sent_at: smsResult.success ? new Date().toISOString() : null,
            });

          if (logError) {
            console.error(`❌ Failed to log SMS for ${devotee.name}:`, logError);
          } else {
            if (result.success) {
              console.log(`✅ Birthday SMS sent to ${devotee.name} (${devotee.phone})`);
            } else {
              console.error(`❌ Birthday SMS failed for ${devotee.name}: ${result.error}`);
            }
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

/**
 * One-time birthday SMS sender (for manual testing or immediate send)
 */
export async function sendBirthdaySmsByDevoteeId(devoteeId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { data: devotee, error } = await supabase
      .from("devotees")
      .select("*")
      .eq("id", devoteeId)
      .single();

    if (error || !devotee) {
      return {
        success: false,
        message: "Devotee not found",
      };
    }

    const result = await twilioService.sendBirthdayReminder(
      devotee.phone,
      devotee.name
    );

    if (result.success) {
      // Log to database
      await supabase.from("sms_logs").insert({
        devotee_id: devotee.id,
        phone: devotee.phone,
        message_type: "birthday",
        message: `Birthday wish for ${devotee.name} (manual)`,
        status: "sent",
        sms_provider: "twilio",
        provider_id: result.messageId,
        sent_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Birthday SMS sent to ${devotee.name}`,
      };
    } else {
      return {
        success: false,
        message: `Failed to send: ${result.error}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export default initBirthdayScheduler;
