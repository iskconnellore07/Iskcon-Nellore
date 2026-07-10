const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

function numberToWords(num) {
  return "ONE HUNDRED"; // simplified for sample
}

async function generateSample80GReceipt() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const primaryColor = "#c62828";

  // Simulate receipt data
  const data = {
    id: "pay_sample123",
    date: "26/06/2026",
    name: "JOHN DOE",
    panOrGst: "ABCDE1234F",
    amount: 100,
    festival: "General Donation"
  };

  // 1. Background
  try {
    const bgPath = path.join(__dirname, "src", "assets", "receipt_bg.png");
    if (fs.existsSync(bgPath)) {
      const bgData = fs.readFileSync(bgPath);
      const base64Bg = "data:image/png;base64," + bgData.toString("base64");
      doc.addImage(base64Bg, "PNG", 0, 0, width, height);
    }
  } catch (e) {
    console.warn("Background missing", e);
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
  doc.text(`Temple GST: 37AKDPY7379M1Z1`, width - 85, y);
  
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
  doc.text(data.name, 75, y);
  doc.setFont("times", "normal");

  y += 8;
  doc.text(`Donor PAN / GST:`, 25, y);
  doc.setFont("times", "bold");
  doc.text(data.panOrGst, 60, y);
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
  doc.text(data.festival, 45, y);
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

  fs.writeFileSync("SAMPLE_RECEIPT.pdf", Buffer.from(doc.output('arraybuffer')));
  console.log("SAMPLE_RECEIPT.pdf generated successfully!");
}

generateSample80GReceipt();
