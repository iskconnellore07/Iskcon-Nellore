import { jsPDF } from "jspdf";
import type { Booking } from "@/types";

export type ReceiptType = "FESTIVAL" | "DONATION";

export interface ReceiptData {
  id: string;
  date: string;
  name: string;
  phone: string;
  email?: string;
  festival?: string;
  slotDate?: string;
  slotTime?: string;
  people?: number;
  amount: number;
  status: string;
  type: ReceiptType;
  claim80G?: boolean;
  panOrGst?: string;
}

// Convert an image URL to a base64 string and get its dimensions
const getImageDataFromUrl = async (imageUrl: string): Promise<{ base64: string, width: number, height: number } | null> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({ base64, width: img.width, height: img.height });
        };
        img.onerror = (err) => reject(err);
        img.src = base64;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image:", error);
    return null;
  }
};

export async function generateBeautifulReceipt(data: ReceiptData) {
  // A4 size: 210 x 297 mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const primaryColor = "#c62828"; // Deep red matching the template

  // 1. Draw the Full Page Background Template
  try {
    const bgData = await getImageDataFromUrl("/src/assets/receipt_bg.png");
    if (bgData) {
      // Draw background covering the entire A4 page
      doc.addImage(bgData.base64, "PNG", 0, 0, width, height);
    }
  } catch (e) {
    console.warn("Background image not found. Proceeding with blank background.");
  }

  // 2. Receipt Title
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  const title = data.type === "FESTIVAL" ? "FESTIVAL BOOKING RECEIPT" : "DONATION RECEIPT";
  // The decorative line in the template is around Y=115. They want it right above/on it.
  doc.text(title, width / 2, 112, { align: "center" });
  
  // 3. Reset formatting for content
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor("#000000");

  // Start Festival receipts higher up because they have more lines of text
  let currentY = data.type === "FESTIVAL" ? 130 : 140;
  const leftCol = 35;
  const colonCol = 85;
  const rightCol = 95;

  const addRow = (label: string, value: string | undefined, isBold = false) => {
    if (!value) return;
    if (isBold) doc.setFont("times", "bold");
    else doc.setFont("times", "normal");
    
    doc.text(label, leftCol, currentY);
    doc.text(":", colonCol, currentY);
    doc.text(value, rightCol, currentY);
    currentY += 6;
  };

  const drawDottedLine = () => {
    currentY += 2;
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([1, 1.5], 0);
    doc.line(leftCol - 5, currentY, width - 25, currentY);
    doc.setLineDashPattern([], 0); // Reset
    currentY += 6;
  };

  // Section 1: Basic Info
  addRow("Booking ID", data.id);
  addRow("Date of Booking", data.date);
  drawDottedLine();

  // Section 2: Personal Info
  addRow("Name", data.name, true);
  addRow("Phone", data.phone);
  if (data.email) addRow("Email", data.email);
  drawDottedLine();

  // Section 3: Festival/Booking Specifics
  if (data.type === "FESTIVAL") {
    addRow("Festival", data.festival, true);
    addRow("Slot Date", data.slotDate);
    addRow("Slot Time", data.slotTime);
    if (data.people) addRow("No. of People", data.people.toString());
    drawDottedLine();
  } else {
    addRow("Donation Type", data.festival || "General Donation", true); // Reusing festival field for type
    drawDottedLine();
  }

  // Section 4: Payment Info
  currentY += 2;
  addRow("Amount Paid", `Rs. ${data.amount}`, true);
  addRow("Status", data.status, true);

  if (data.claim80G && data.panOrGst) {
    drawDottedLine();
    addRow("80G Exemption", "Claimed", true);
    addRow("Donor PAN / GST", data.panOrGst.toUpperCase(), true);
    addRow("Temple GST No", "37AAAATI0017P9ZE");
  }

  // Save the PDF
  const filename = data.type === "FESTIVAL" 
    ? `Festival_Receipt_${data.name.replace(/\s+/g, '_')}.pdf`
    : `Donation_Receipt_${data.name.replace(/\s+/g, '_')}.pdf`;
    
  doc.save(filename);
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  
  if (num < 20) return a[num].trim();
  if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + a[num % 10] : "").trim();
  if (num < 1000) return a[Math.floor(num / 100)] + "Hundred" + (num % 100 !== 0 ? " and " + numberToWords(num % 100) : "");
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "");
  return num.toString();
}

export async function generate80GReceipt(data: ReceiptData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const primaryColor = "#c62828";

  // 1. Background
  try {
    const bgData = await getImageDataFromUrl("/src/assets/receipt_bg.png");
    if (bgData) doc.addImage(bgData.base64, "PNG", 0, 0, width, height);
  } catch (e) {
    console.warn("Background missing");
  }

  // 2. Title
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text("DONATION RECEIPT (80G)", width / 2, 112, { align: "center" });

  doc.setTextColor("#000000");
  
  // 3. Organization Header
  let y = 130;
  doc.setFontSize(14);
  doc.text("International Society for Krishna Consciousness", width / 2, y, { align: "center" });
  
  y += 6;
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text("Founder-Acharya: His Divine Grace A.C. Bhaktivedanta Swami Prabhupada", width / 2, y, { align: "center" });
  
  y += 10;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Branch: ISKCON City, Hare Krishna Road, Nellore 524004 A.P.", width / 2, y, { align: "center" });
  y += 5;
  doc.text("Phone: 9985058550 / 7018620155  |  E-mail: sukadevaswami@gmail.com", width / 2, y, { align: "center" });

  y += 10;
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text(`Unique Regn. No. (80G): AAATI0017PF20219`, 25, y);
  doc.text(`Temple GST: 37AAAATI0017P9ZE`, width - 85, y);
  
  // Line separator
  y += 5;
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(25, y, width - 25, y);
  
  // 4. Receipt Details
  y += 8;
  doc.setFont("times", "normal");
  doc.text(`Receipt No: ${data.id}`, 25, y);
  doc.text(`Date: ${data.date}`, width - 60, y);

  y += 10;
  doc.text(`Received with thanks from:`, 25, y);
  doc.setFont("times", "bold");
  doc.text(data.name.toUpperCase(), 75, y);
  doc.setFont("times", "normal");

  y += 8;
  doc.text(`Donor PAN / GST:`, 25, y);
  doc.setFont("times", "bold");
  doc.text((data.panOrGst || "NOT PROVIDED").toUpperCase(), 60, y);
  doc.setFont("times", "normal");

  y += 8;
  doc.text(`A sum of Rupees:`, 25, y);
  doc.setFont("times", "bold");
  doc.text(`Rs. ${data.amount}/-`, 55, y);
  
  y += 6;
  doc.text(`(${numberToWords(data.amount)} Only)`, 55, y);
  doc.setFont("times", "normal");

  y += 10;
  doc.text(`Towards:`, 25, y);
  doc.setFont("times", "bold");
  doc.text(data.festival || "General Donation", 45, y);
  doc.setFont("times", "normal");

  // Legal declaration
  y += 15;
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.text("Donations to the trust are exempt under Section 80G(5)(vi) of the Income Tax Act, 1961.", width / 2, y, { align: "center" });
  y += 5;
  doc.text("Head Office: Hare Krishna Land, Juhu, Mumbai - 400 049. Mobile: 72088 46210. E-mail: info@iskconindia.org", width / 2, y, { align: "center" });

  y += 20;
  doc.setFont("times", "bold");
  doc.text("Authorized Signatory", width - 50, y, { align: "center" });
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.text("(Computer Generated Receipt)", width - 50, y + 4, { align: "center" });

  doc.save(`80G_Receipt_${data.name.replace(/\s+/g, '_')}.pdf`);
}
