// payment-server/services/msg91-sms.ts
import type { SmsLog } from "../types/index.js";

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: "msg91";
}

class Msg91SmsService {
  private authKey: string;
  private senderId: string;
  private templateId: string;

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || "";
    this.senderId = process.env.MSG91_SENDER_ID || "ISKCON"; // Placeholder Sender ID
    this.templateId = process.env.MSG91_TEMPLATE_ID || ""; // Placeholder Template ID

    if (!this.authKey) {
      console.warn("⚠️ MSG91_AUTH_KEY is missing. SMS functionality will not work.");
    }
  }

  /**
   * Send a single SMS using MSG91
   */
  async sendSms(
    to: string,
    message: string,
    senderName?: string
  ): Promise<SmsResult> {
    try {
      if (!this.authKey) {
        return { success: false, error: "MSG91 Auth Key not configured", provider: "msg91" };
      }

      // MSG91 prefers 91XXXXXXXXXX without the plus sign, but can handle with it. 
      // Let's strip any non-numeric characters just in case.
      const cleanPhone = to.replace(/\D/g, "");
      
      // If the number doesn't start with 91 and is 10 digits, prepend 91
      let finalPhone = cleanPhone;
      if (finalPhone.length === 10) {
        finalPhone = "91" + finalPhone;
      }

      // For standard transactional SMS without a registered MSG91 Template, 
      // you can use the generic SMS API. If you have DLT templates approved,
      // you should pass the DLT Template ID.
      
      const payload = {
        sender: senderName || this.senderId,
        route: "4", // 4 is typically transactional route in MSG91
        country: "91",
        sms: [
          {
            message: message,
            to: [finalPhone]
          }
        ]
      };

      // If you are using DLT Template ID (Mandatory for India)
      if (this.templateId) {
        (payload as any).DLT_TE_ID = this.templateId;
      }

      const response = await fetch("https://control.msg91.com/api/v2/sendsms", {
        method: "POST",
        headers: {
          "authkey": this.authKey,
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.type === "success") {
        console.log(`✅ MSG91 SMS sent to ${finalPhone} (ID: ${data.message})`);
        return {
          success: true,
          messageId: data.message,
          provider: "msg91",
        };
      } else {
        console.error(`❌ MSG91 SMS Failed:`, data.message);
        return {
          success: false,
          error: data.message || "Failed to send SMS",
          provider: "msg91",
        };
      }
    } catch (error: any) {
      console.error(`❌ MSG91 API Error:`, error.message);
      return {
        success: false,
        error: error.message || "Failed to connect to MSG91",
        provider: "msg91",
      };
    }
  }

  /**
   * Send birthday greeting SMS
   */
  async sendBirthdayReminder(
    phone: string,
    devoteeName: string
  ): Promise<SmsResult> {
    const message = `🎂 Happy Birthday, ${devoteeName}! Lord Krishna will bless you always. Visit ISKCON Nellore for Krishna Blessings and celebrate birthday with the blessings of Maharaj, Devotees, Gau Mata along with Annadanam Prasadam. - Hare Krishna 🙏`;

    return this.sendSms(phone, message, this.senderId);
  }

  /**
   * Send donation reminder SMS
   */
  async sendDonationReminder(
    phone: string,
    devoteeName: string,
    amount: number
  ): Promise<SmsResult> {
    const message = `🙏 Namaste ${devoteeName}! Your monthly donation of ₹${amount} is due. Your support helps Lord Krishna's mission. Donate: isckonnellore.com/donate - ISKCON Nellore 🧡`;

    return this.sendSms(phone, message, this.senderId);
  }

  /**
   * Send anniversary greeting SMS
   */
  async sendAnniversaryReminder(
    phone: string,
    devoteeName: string
  ): Promise<SmsResult> {
    const message = `💑 Happy Anniversary, ${devoteeName}! Wishing you eternal bliss in Krishna consciousness. May your bond be blessed by Lord Krishna forever. - ISKCON Nellore 🙏`;

    return this.sendSms(phone, message, this.senderId);
  }

  /**
   * Send custom SMS
   */
  async sendCustom(
    phone: string,
    message: string,
    type: "transactional" | "promotional" = "transactional"
  ): Promise<SmsResult> {
    return this.sendSms(phone, message, this.senderId);
  }
}

export default Msg91SmsService;
export type { SmsResult };
