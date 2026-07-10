import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const logAudit = async (userEmail: string, action: string, resourceType: string, details: string) => {
  if (!userEmail) return;
  try {
    await addDoc(collection(db, "audit_logs"), {
      user: userEmail,
      action, // e.g. "UPLOADED", "DELETED", "CREATED", "UPDATED", "LOGIN"
      resourceType, // e.g. "PHOTO", "EVENT", "FORM", "COURSE", "SYSTEM"
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
