import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookHeart, Wallet, AlertCircle, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function DashboardOverview() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Donation" | "Festivals" | "80G">("Donation");

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStats(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Firebase fetch error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const totalDonations = stats
    .filter(row => row.formType === "Donation")
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const totalFestivals = stats
    .filter(row => row.formType === "Festivals").length;

  const getFilteredData = () => {
    if (activeTab === "80G") {
      return stats.filter(row => 
        row.claim80G === true || 
        (row.pan && row.pan.trim() !== "") ||
        (row["PAN "] && row["PAN "].trim() !== "") ||
        (row["PAN"] && row["PAN"].trim() !== "")
      );
    }
    return stats.filter(row => row.formType === activeTab);
  };

  const downloadCSV = () => {
    const dataToExport = getFilteredData();
    if (dataToExport.length === 0) {
      alert("No data available to download.");
      return;
    }

    // Determine all unique keys to use as headers
    const headers = Array.from(new Set(dataToExport.flatMap(Object.keys)));
    
    // Convert data to CSV string
    const csvRows = [];
    csvRows.push(headers.join(",")); // Header row
    
    for (const row of dataToExport) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTab}_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to the ISKCON Nellore Admin Portal.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            {error} <br />
            <strong>Action Required:</strong> Check your Firebase connection and permissions.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devotees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Festival Bookings</CardTitle>
            <BookHeart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : totalFestivals}</div>
            <p className="text-xs text-muted-foreground">From Database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `₹${totalDonations.toLocaleString('en-IN')}`}
            </div>
            <p className="text-xs text-muted-foreground">From Database</p>
          </CardContent>
        </Card>
      </div>

      {!loading && !error && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("Donation")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "Donation" ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Donations
                </button>
                <button
                  onClick={() => setActiveTab("Festivals")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "Festivals" ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Festivals
                </button>
                <button
                  onClick={() => setActiveTab("80G")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "80G" ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"}`}
                >
                  80G Requests
                </button>
              </div>
              <Button onClick={downloadCSV} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Export {activeTab} CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {filteredData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions found for {activeTab}.
                </div>
              ) : (
                filteredData.slice(-50).reverse().map((row, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium text-base">{row.name}</p>
                      <div className="text-sm text-gray-500 space-x-2">
                        <span className="inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-semibold">
                          {row.formType}
                        </span>
                        {row.festival && <span>• {row.festival}</span>}
                        {(row.pan || row["PAN "] || row["PAN"]) && (
                          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            PAN: {row.pan || row["PAN "] || row["PAN"]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-1">Txn ID: {row.paymentId || "N/A"}</p>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <p className="font-bold text-lg text-green-600">₹{(Number(row.amount) || 0).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-500">{new Date(row.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
