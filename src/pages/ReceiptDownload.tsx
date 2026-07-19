import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateBeautifulReceipt, generate80GReceipt } from "@/lib/receipt-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ReceiptDownload() {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    async function fetchTransaction() {
      if (!orderId) {
        setError("Invalid link. No order ID provided.");
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "transactions"), where("orderId", "==", orderId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError("Transaction not found. Please verify the link.");
          setLoading(false);
          return;
        }

        const data = querySnapshot.docs[0].data();
        
        const rData = {
          id: data.orderId.replace('order_', ''),
          date: new Date(data.timestamp || data.date).toLocaleDateString(),
          name: data.name,
          phone: data.phone,
          email: data.email,
          festival: data.festival || (data.formType === 'Donation' ? 'General Donation' : ''),
          amount: Number(data.amount),
          status: "PAID" as const,
          type: data.formType === 'Festivals' ? "FESTIVAL" as const : "DONATION" as const,
          claim80G: data.claim80G,
          panOrGst: data.pan,
          slot: data.slot,
          people: data.people ? Number(data.people) : undefined
        };

        setReceiptData(rData);
        setLoading(false);
        
        // Auto-download on load
        handleDownload(rData);

      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError("Unable to load receipt data. Please try again later.");
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [orderId]);

  const handleDownload = (data = receiptData) => {
    if (!data) return;
    generateBeautifulReceipt(data);
    if (data.claim80G && Number(data.amount) >= 2000) {
      setTimeout(() => generate80GReceipt(data), 1000); // Slight delay for second PDF
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            {loading ? (
              <div className="mx-auto bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="mx-auto bg-red-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            ) : (
              <div className="mx-auto bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            )}
            <CardTitle className="text-2xl">
              {loading ? "Locating Receipt..." : error ? "Receipt Not Found" : "Thank You!"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {loading ? "Please wait while we retrieve your transaction details." : error ? error : "Your transaction was successful. Your receipt should download automatically."}
            </CardDescription>
          </CardHeader>
          
          {!loading && !error && receiptData && (
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium text-right">{receiptData.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium text-right">₹{receiptData.amount}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-right">{receiptData.date}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium text-right">{receiptData.type}</span>
                </div>
              </div>
            </CardContent>
          )}

          <CardFooter className="flex flex-col gap-3">
            {!loading && !error && (
              <Button onClick={() => handleDownload()} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" /> Download PDF Receipt Again
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Return to Homepage</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
