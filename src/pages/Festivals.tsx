import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import * as XLSX from "xlsx";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { jsPDF } from "jspdf";
import { generateBeautifulReceipt, generate80GReceipt } from "@/lib/receipt-generator";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

async function loadRazorpayScript() {
  if (window.Razorpay) {
    return true;
  }
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Booking = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  festival: string;
  date: string;
  slot: string;
  people: number;
  amount?: number;
  paid?: boolean;
  createdAt: string;
  claim80G?: boolean;
  panOrGst?: string;
};

const FESTIVALS = [
  "Gaura Purnima",
  "Rama Navami",
  "Narasimha Jayanthi",
  "Balarama Jayanthi",
  "Janmashtami",
  "Radhashtami",
  "Nityananda Trayodashi",
  "Karthika Deepam",
  "Other Festival",
];

const FESTIVAL_PRICES: Record<string, number> = {
  "Gaura Purnima": 11000,
  "Rama Navami": 11000,
  "Narasimha Jayanthi": 11000,
  "Balarama Jayanthi": 11000,
  "Janmashtami": 2100,
  "Radhashtami": 11000,
  "Nityananda Trayodashi": 11000,
  "Karthika Deepam": 11000, // Defaulting to 11000 if not specified
  "Other Festival": 11000,
};

const FESTIVAL_DATES: Record<string, string> = {
  "Nityananda Trayodashi": "2026-01-31",
  "Gaura Purnima": "2026-03-03",
  "Rama Navami": "2026-03-27",
  "Narasimha Jayanthi": "2026-04-30",
  "Balarama Jayanthi": "2026-08-28",
  "Janmashtami": "2026-09-04",
  "Radhashtami": "2026-09-19",
  "Karthika Deepam": "2026-11-09",
  "Other Festival": "2026-12-31",
};

export default function Festivals() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [festival, setFestival] = useState(FESTIVALS[0]);
  const [date, setDate] = useState<Date | undefined>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today;
  });
  const [slot, setSlot] = useState("06:00 - 07:00");
  const [people, setPeople] = useState<number>(1);
  const [message, setMessage] = useState<string | null>(null);

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [previewBooking, setPreviewBooking] = useState<Partial<Booking> | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);

  const [claim80G, setClaim80G] = useState(false);
  const [pan, setPan] = useState("");

  function validate(): string | null {
    if (!name.trim()) return "Please enter your name.";
    if (!phone.trim()) return "Please enter your phone number.";
    if (!date) return "Please choose a date.";
    if (claim80G && !pan.trim()) return "PAN Number is required for 80G Receipt.";
    return null;
  }

  function getAmount(festival: string, people: number) {
    // Flat rate for a couple/small family, regardless of number of people entered
    return FESTIVAL_PRICES[festival] || 11000; 
  }

  function downloadBookingsFile(bookings: Booking[]) {
    const ws = XLSX.utils.json_to_sheet(bookings);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPDFReceipt(booking: Booking) {
    const receiptData = {
      id: booking.id,
      date: new Date(booking.createdAt).toLocaleDateString(),
      name: booking.name,
      amount: booking.amount || 0,
      status: "PAID" as const,
      type: "FESTIVAL" as const,
      festival: booking.festival,
      panOrGst: booking.panOrGst
    };

    generateBeautifulReceipt(receiptData);

    if (booking.claim80G) {
      generate80GReceipt(receiptData);
    }
  }

  async function submitBooking(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);
    const err = validate();
    if (err) {
      setMessage(err);
      return;
    }

    const preview: Partial<Booking> = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      festival,
      date: date ? format(date, "yyyy-MM-dd") : "",
      slot,
      people: Number(people),
      amount: getAmount(festival, Number(people)),
      claim80G,
      panOrGst: pan.trim() ? pan.toUpperCase().replace(/\s+/g, "") : undefined,
    };

    setPreviewBooking(preview);
    setMessage("Creating payment order...");
    await createOrderOnServer(preview);
  }

  async function finalizePaymentAndBook(
    paymentResult: { orderId: string; paymentId: string; signature: string },
    previewData: Partial<Booking>
  ) {
    if (!previewData) return;
    setPaymentProcessing(true);
    try {
      const resp = await fetch('http://localhost:4000/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: paymentResult.orderId, paymentId: paymentResult.paymentId, signature: paymentResult.signature }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setPaymentProcessing(false);
        setMessage('Payment verification failed.');
        return;
      }
    } catch (err) {
      setPaymentProcessing(false);
      setMessage('Payment verification error.');
      return;
    }

    const booking: Booking = {
      id: `${Date.now()}`,
      name: (previewData.name || "").toString(),
      phone: (previewData.phone || "").toString(),
      email: previewData.email,
      festival: (previewData.festival || "").toString(),
      date: (previewData.date || "").toString(),
      slot: (previewData.slot || "").toString(),
      people: Number(previewData.people || 1),
      amount: Number(previewData.amount || 0),
      paid: true,
      createdAt: new Date().toISOString(),
      claim80G: previewData.claim80G,
      panOrGst: previewData.panOrGst,
    };

    const existing = JSON.parse(localStorage.getItem("festival_bookings") || "[]") as Booking[];
    existing.push(booking);
    localStorage.setItem("festival_bookings", JSON.stringify(existing));

    setPaymentProcessing(false);
    setLastBooking(booking);
    setDialogOpen(true);
    setMessage("Booking created and payment received.");
    
    // Auto-download the receipt so they don't lose it!
    downloadPDFReceipt(booking);
    setName("");
    setPhone("");
    setEmail("");
    setPeople(1);
    setPreviewBooking(null);
  }

  // Create an order on the local Express payment server and launch Razorpay checkout
  async function createOrderOnServer(booking: Partial<Booking>) {
    try {
      const resp = await fetch('http://localhost:4000/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
      if (!resp.ok) {
        setMessage("Payment server error. Is the server running?");
        setPaymentProcessing(false);
        return;
      }
      const data = await resp.json();
      (booking as any).orderId = data.orderId;
      setPreviewBooking({ ...booking });

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        setMessage("Unable to load payment gateway. Check your internet connection.");
        setPaymentProcessing(false);
        return;
      }

      setMessage("Launching payment gateway...");
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ISKCON Nellore',
        description: 'Festival Booking',
        order_id: data.orderId,
        prefill: {
          name: booking.name,
          email: booking.email,
          contact: booking.phone,
        },
        notes: {
          festival: booking.festival,
          date: booking.date,
          slot: booking.slot,
          people: booking.people?.toString() || '1',
          claim80G: booking.claim80G,
          pan: booking.panOrGst,
        },
        theme: {
          color: '#0ea5a4',
        },
        handler: (response: any) => {
          setMessage("Verifying payment...");
          finalizePaymentAndBook({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }, booking);
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setMessage("Payment popup closed.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setPaymentProcessing(false);
        const desc = response?.error?.description || "Payment failed. Please try again.";
        setMessage(desc);
      });
      rzp.open();
    } catch (err) {
      console.error("Error launching payment gateway", err);
      setMessage("Unable to reach payment server.");
      setPaymentProcessing(false);
      setPreviewBooking(booking);
    }
  }

  const slots = ["06:00 - 07:00", "07:00 - 08:00", "08:00 - 09:00", "17:00 - 18:00", "18:00 - 19:00"];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">Festival Slot Booking</h1>

          <Card>
            <form onSubmit={submitBooking}>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Select festival day, slot and enter attendee details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Email (optional)</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>People (Max 2)</Label>
                    <Input type="number" min={1} max={2} value={people} onChange={(e) => setPeople(Number(e.target.value))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
                  <div className="flex flex-col gap-2">
                    <Label>Festival</Label>
                    <select 
                      className="w-full p-2 border rounded" 
                      value={festival} 
                      onChange={(e) => {
                        const newFestival = e.target.value;
                        setFestival(newFestival);
                        if (FESTIVAL_DATES[newFestival]) {
                          setDate(new Date(FESTIVAL_DATES[newFestival]));
                        }
                      }}
                    >
                      {FESTIVALS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal overflow-hidden",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {date ? format(date, "PPP") : "Pick a date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Slot</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {slots.map((s) => (
                      <button type="button" key={s} onClick={() => setSlot(s)} className={cn("py-2 px-3 rounded border", slot === s ? "bg-primary text-primary-foreground border-primary" : "bg-background")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Amount</Label>
                  <div className="text-lg font-semibold">₹ {getAmount(festival, people)}</div>
                </div>

                <div className="mt-4 p-4 border rounded bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="fest-claim-80g" 
                      checked={claim80G}
                      onChange={(e) => setClaim80G(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="fest-claim-80g" className="font-medium cursor-pointer">
                      I need an 80G Receipt for Tax Exemption
                    </Label>
                  </div>
                  
                  {claim80G && (
                    <div className="mt-3">
                      <Label htmlFor="fest-pan">PAN / GST</Label>
                      <Input 
                        id="fest-pan" 
                        value={pan} 
                        onChange={(e) => setPan(e.target.value.toUpperCase().replace(/\s+/g, ""))} 
                        placeholder="ABCDE1234F" 
                        required 
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex flex-col gap-4 w-full">
                  <div className="text-xs text-muted-foreground text-center leading-relaxed px-2">
                    All payments are collected and processed by JAYAORA Solutions and Management on behalf of ISKCON Nellore. 100% of your donation is transferred to ISKCON Nellore's designated account.
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="submit">Pay & Book</Button>
                  </div>
                </div>
              </CardFooter>
            </form>
          </Card>

          {message ? <div className="mt-4 text-sm text-foreground">{message}</div> : null}

        </div>
      </main>
      <Footer />



      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Confirmed</DialogTitle>
            <DialogDescription>Your Festival slot has been reserved. Below are the details.</DialogDescription>
          </DialogHeader>
          {lastBooking ? (
            <div className="mt-4 space-y-2">
              <div><strong>Name:</strong> {lastBooking.name}</div>
              <div><strong>Phone:</strong> {lastBooking.phone}</div>
              <div><strong>Festival:</strong> {lastBooking.festival}</div>
              <div><strong>Date:</strong> {lastBooking.date}</div>
              <div><strong>Slot:</strong> {lastBooking.slot}</div>
              <div><strong>People:</strong> {lastBooking.people}</div>
              <div><strong>Amount:</strong> ₹ {lastBooking.amount}</div>
              <div><strong>Paid:</strong> {lastBooking.paid ? "Yes" : "No"}</div>
            </div>
          ) : null}
          <DialogFooter>
            <div className="flex gap-2">
              <Button onClick={() => {
                if (lastBooking) downloadPDFReceipt(lastBooking);
              }}>Download Receipt (PDF)</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
