import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const indianMobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  const internationalRegex = /^\+[1-9]\d{6,14}$/;
  return indianMobileRegex.test(cleaned) || internationalRegex.test(cleaned);
}
