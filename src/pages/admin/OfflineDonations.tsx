import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, getDocs, where, addDoc, doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { validatePhoneNumber } from "@/lib/utils";
import { Loader2, Plus, Download, Search, Check, AlertCircle, RefreshCw, FileText, CheckCircle2, Copy, X } from "lucide-react";
import { API_BASE_URL } from "@/config";
import { generateBeautifulReceipt, generate80GReceipt } from "@/lib/receipt-generator";
import { fetchDevotees } from "@/services/devotee-service";

export default function OfflineDonations() {
  const { dashboardBranchId, branchId } = useAuth();
  const activeBranch = dashboardBranchId || branchId || "nellore";

  const [activeTab, setActiveTab] = useState<string>("new");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [devoteesList, setDevoteesList] = useState<any[]>([]);
  const [pastDonors, setPastDonors] = useState<any[]>([]);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Autofill Autocomplete Search State
  const [searchDevoteeQuery, setSearchDevoteeQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
    amount: "",
    pan: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    referenceId: "",
    claim80G: false,
  });

  // Success State for last recorded transaction
  const [lastSuccess, setLastSuccess] = useState<any>(null);

  useEffect(() => {
    // Fetch branches to resolve current branch name
    const fetchBranches = async () => {
      try {
        const snapshot = await getDocs(collection(db, "branches"));
        setBranches(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
      } catch (e) {
        console.error("Error fetching branches:", e);
      }
    };
    fetchBranches();
  }, []);

  // Load devotees for matching suggestions
  useEffect(() => {
    const loadDevotees = async () => {
      try {
        const data = await fetchDevotees(undefined, activeBranch);
        setDevoteesList(data);
      } catch (e) {
        console.error("Failed to load devotees for search autocomplete:", e);
      }
    };
    loadDevotees();
  }, [activeBranch]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTx = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Filter for offline transactions only
      const offlineData = allTx.filter((tx: any) => tx.formType === "Offline");
      setTransactions(offlineData);

      // Extract unique donors from past transactions for autofill autocomplete
      const donorsMap = new Map<string, any>();
      allTx.forEach((tx: any) => {
        if (!tx.name || !tx.phone) return;
        const key = `${tx.name.toLowerCase().trim()}_${tx.phone.trim()}`;
        // Since transactions are ordered desc, the first we encounter is the most recent
        if (!donorsMap.has(key)) {
          donorsMap.set(key, {
            name: tx.name,
            phone: tx.phone,
            email: tx.email || "",
            address: tx.address || "",
            pincode: tx.pincode || "",
            pan: tx.pan || "",
          });
        }
      });
      setPastDonors(Array.from(donorsMap.values()));
      setLoading(false);
    }, (err) => {
      console.error("Firebase fetch error:", err);
      toast.error("Failed to load transactions list");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const currentBranch = branches.find(b => b.id === activeBranch) || { 
    id: activeBranch, 
    name: activeBranch === 'nellore' ? 'ISKCON Nellore' : activeBranch 
  };

  // Compile combined donor suggestions from formal devotee list and past transaction history
  const combinedSuggestions = useMemo(() => {
    const finalMap = new Map<string, any>();

    // 1. Add formal Devotees
    devoteesList.forEach(d => {
      const key = `${d.name.toLowerCase().trim()}_${d.phone.trim()}`;
      finalMap.set(key, {
        name: d.name,
        phone: d.phone,
        email: d.email || "",
        address: d.notes || "",
        pincode: "",
        pan: "",
        source: "Devotee"
      });
    });

    // 2. Overlay / Add past transaction history (contains complete addresses, pincodes, and PAN numbers)
    pastDonors.forEach(p => {
      const key = `${p.name.toLowerCase().trim()}_${p.phone.trim()}`;
      const existing = finalMap.get(key);
      finalMap.set(key, {
        name: p.name,
        phone: p.phone,
        email: p.email || (existing?.email || ""),
        address: p.address || (existing?.address || ""),
        pincode: p.pincode || "",
        pan: p.pan || "",
        source: "Past Donor"
      });
    });

    return Array.from(finalMap.values());
  }, [devoteesList, pastDonors]);

  // Filter suggestion lists as the user types
  const filteredSuggestions = useMemo(() => {
    if (!searchDevoteeQuery.trim()) return [];
    const queryLower = searchDevoteeQuery.toLowerCase();
    return combinedSuggestions.filter(s => 
      s.name.toLowerCase().includes(queryLower) ||
      s.phone.includes(queryLower) ||
      s.email.toLowerCase().includes(queryLower)
    );
  }, [searchDevoteeQuery, combinedSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let val = value;
    if (name === "pan") {
      val = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
    }
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, claim80G: checked }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || !formData.phone) {
      toast.error("Please fill in Name, Phone, and Amount.");
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      toast.error("Please enter a valid mobile number (10-digit mobile number, optionally starting with +91/91/0, or international format).");
      return;
    }

    if (formData.claim80G) {
      const panVal = formData.pan?.trim() || "";
      if (!panVal) {
        toast.error("PAN/GST is required for 80G Claim.");
        return;
      }
      if (panVal.length !== 10 && panVal.length !== 15) {
        toast.error("Please enter a valid 10-digit PAN (e.g. ABCDE1234F) or 15-digit GST (e.g. 37AAAATI0017P9Z).");
        return;
      }
    }

    setSubmitting(true);
    setLastSuccess(null);

    try {
      const orderId = `offline_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const amountFloat = Number(formData.amount);
      
      let result = null;
      let smsSent = false;

      // Try reaching backend Netlify Function first
      try {
        const response = await fetch(`${API_BASE_URL}/record-offline-donation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            branchId: activeBranch,
            locationName: currentBranch.name,
          }),
        });

        if (response.ok) {
          const resBody = await response.json();
          if (resBody.success) {
            result = resBody;
            smsSent = true;
          }
        }
      } catch (fetchErr) {
        console.warn("Netlify dev functions server not reachable. Falling back to direct client-side Firestore write.", fetchErr);
      }

      // Fallback: Write directly to Firestore if API failed or server is offline
      if (!result) {
        const transactionData = {
          formType: 'Offline',
          name: formData.name,
          email: formData.email || '',
          phone: formData.phone || '',
          amount: amountFloat,
          date: formData.date || new Date().toISOString().split('T')[0],
          paymentId: formData.referenceId || `off_${Date.now()}`,
          orderId: orderId,
          festival: 'Offline Donation',
          slot: '',
          people: '',
          pan: formData.pan || '',
          address: formData.address || '',
          pincode: formData.pincode || '',
          claim80G: formData.claim80G ? true : false,
          timestamp: new Date().toISOString(),
          branchId: activeBranch,
          location: currentBranch.name,
          paymentMethod: formData.paymentMethod || 'Cash'
        };

        await setDoc(doc(db, "transactions", orderId), transactionData);
        result = {
          success: true,
          transactionId: orderId,
          orderId: orderId
        };
      }

      toast.success(smsSent 
        ? "Offline donation recorded and SMS sent!" 
        : "Donation recorded to database (Direct)! SMS skipped (local dev server offline)."
      );
      
      const successData = {
        ...formData,
        orderId: result.orderId,
        branchName: currentBranch.name
      };
      
      setLastSuccess(successData);

      // Reset form (keep date and paymentMethod default)
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        pincode: "",
        amount: "",
        pan: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Cash",
        referenceId: "",
        claim80G: false,
      });

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (tx: any) => {
    let branchSettings: any = null;
    try {
      const branchQ = query(collection(db, "branches"), where("name", "==", tx.location || "ISKCON Nellore"));
      const branchSnap = await getDocs(branchQ);
      if (!branchSnap.empty) {
        branchSettings = branchSnap.docs[0].data();
      }
    } catch (e) {
      console.error("Failed to fetch branch settings for receipt", e);
    }

    const rData = {
      id: tx.orderId.replace('order_', '').replace('offline_', ''),
      date: new Date(tx.timestamp || tx.date).toLocaleDateString(),
      name: tx.name,
      phone: tx.phone,
      email: tx.email,
      festival: tx.festival || 'General Donation',
      amount: Number(tx.amount),
      status: "PAID" as const,
      type: "DONATION" as const,
      claim80G: tx.claim80G,
      panOrGst: tx.pan,
      branchName: branchSettings?.name || tx.location || 'ISKCON Nellore',
      branchAddress: branchSettings?.address,
      branchPhone: branchSettings?.phone,
      branchEmail: branchSettings?.email
    };

    generateBeautifulReceipt(rData);
    if (rData.claim80G && Number(rData.amount) >= 2000) {
      setTimeout(() => generate80GReceipt(rData), 1000);
    }
  };

  const downloadCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export.");
      return;
    }

    const headers = [
      "Date",
      "Name",
      "Phone Number",
      "Email",
      "Address",
      "Pin Code",
      "Amount (INR)",
      "Payment Method",
      "Reference ID",
      "PAN/GST",
      "80G Claimed",
      "Receipt Link"
    ];

    const csvRows = [headers.join(",")];

    for (const tx of filteredTransactions) {
      const values = [
        new Date(tx.date).toLocaleDateString("en-IN"),
        tx.name || "",
        tx.phone || "",
        tx.email || "",
        tx.address || "",
        tx.pincode || "",
        tx.amount || "",
        tx.paymentMethod || "Cash",
        tx.paymentId || "",
        tx.pan || "",
        tx.claim80G ? "Yes" : "No",
        `https://iskconnellore.com/receipt/${tx.orderId}`
      ].map(val => {
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Offline_Donations_${activeBranch}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Receipt link copied to clipboard!");
  };

  // Filter transactions by branch AND search keyword
  const branchTransactions = transactions.filter(tx => 
    tx.branchId === activeBranch || 
    (activeBranch === "nellore" && !tx.branchId)
  );

  const filteredTransactions = branchTransactions.filter(tx => {
    // Search filter
    const keyword = searchTerm.toLowerCase();
    const matchesSearch = 
      (tx.name || "").toLowerCase().includes(keyword) ||
      (tx.phone || "").includes(keyword) ||
      (tx.email || "").toLowerCase().includes(keyword) ||
      (tx.pan || "").toLowerCase().includes(keyword) ||
      (tx.paymentId || "").toLowerCase().includes(keyword);

    // 80G filter
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "80g" && tx.claim80G) ||
      (statusFilter === "non-80g" && !tx.claim80G);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offline Donations</h1>
          <p className="text-gray-500 mt-1">
            Manage offline cash, cheque, and UPI donations for <span className="font-semibold text-primary">{currentBranch.name}</span>.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="new">Record Donation</TabsTrigger>
          <TabsTrigger value="list">Donations Dashboard</TabsTrigger>
        </TabsList>

        {/* TAB 1: RECORD DONATION FORM */}
        <TabsContent value="new">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Donation Information Form</CardTitle>
                <CardDescription>
                  Enter offline donation details. Search for an existing devotee/member below to autofill form details.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleFormSubmit}>
                <CardContent className="space-y-4">
                  
                  {/* SEARCH EXTRAS: Auto-fill suggestions */}
                  <div className="relative p-4 bg-orange-50/50 border border-orange-200 rounded-lg space-y-2">
                    <Label htmlFor="searchDevotee" className="font-semibold text-orange-950 flex items-center gap-1.5 text-sm">
                      <Search className="w-4 h-4 text-orange-700" /> Search Devotee / Past Donor to Autofill
                    </Label>
                    <div className="relative">
                      <Input
                        id="searchDevotee"
                        value={searchDevoteeQuery}
                        onChange={(e) => {
                          setSearchDevoteeQuery(e.target.value);
                          setShowSearchDropdown(true);
                        }}
                        onFocus={() => setShowSearchDropdown(true)}
                        placeholder="Type name, phone, or email to search..."
                        className="bg-white pr-9"
                      />
                      {searchDevoteeQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchDevoteeQuery("");
                            setShowSearchDropdown(false);
                          }}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {showSearchDropdown && searchDevoteeQuery.trim() !== "" && (
                      <div className="absolute left-4 right-4 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg divide-y">
                        {filteredSuggestions.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            No matching devotees or donors found.
                          </div>
                        ) : (
                          filteredSuggestions.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="w-full text-left p-3 hover:bg-orange-50/40 transition-colors flex flex-col gap-0.5"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  name: s.name || "",
                                  phone: s.phone || "",
                                  email: s.email || "",
                                  address: s.address || "",
                                  pincode: s.pincode || "",
                                  pan: s.pan || "",
                                  claim80G: !!s.pan,
                                }));
                                setSearchDevoteeQuery("");
                                setShowSearchDropdown(false);
                                toast.success(`Autofilled details for ${s.name}!`);
                              }}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-semibold text-sm text-gray-900">{s.name}</span>
                                <span className="text-xs text-gray-500">{s.phone}</span>
                              </div>
                              <div className="flex justify-between items-center w-full text-xs text-gray-400">
                                <span>{s.email || "No email"}</span>
                                <span className="capitalize font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded text-[10px]">
                                  {s.source}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Donor Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Donor Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Radheshyam Das"
                        required
                      />
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 9876543210"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. donor@example.com"
                      />
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Donation Amount (₹) *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="e.g. 5000"
                        required
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date">Donation Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Pincode */}
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pin Code</Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        type="text"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="e.g. 524004"
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <select
                        id="paymentMethod"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Google Pay (Offline)">Google Pay (Offline)</option>
                        <option value="PhonePe (Offline)">PhonePe (Offline)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Reference ID */}
                    <div className="space-y-2">
                      <Label htmlFor="referenceId">Reference ID / Cheque Number</Label>
                      <Input
                        id="referenceId"
                        name="referenceId"
                        value={formData.referenceId}
                        onChange={handleInputChange}
                        placeholder="e.g. Txn ID or Cheque No."
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g. 12-3-456, Hare Krishna Road, Nellore"
                    />
                  </div>

                  {/* 80G Claim Checkbox */}
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="claim80G"
                      checked={formData.claim80G}
                      onChange={(e) => handleCheckboxChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="claim80G" className="font-semibold text-sm cursor-pointer select-none">
                      Claim 80G Tax Exemption
                    </Label>
                  </div>

                  {/* PAN/GST Field (Conditional) */}
                  {formData.claim80G && (
                    <div className="space-y-2 p-4 bg-blue-50/50 border border-blue-100 rounded-md">
                      <Label htmlFor="pan" className="text-blue-900 font-semibold">Donor PAN / GST Number *</Label>
                      <Input
                        id="pan"
                        name="pan"
                        value={formData.pan}
                        onChange={handleInputChange}
                        placeholder="e.g. ABCDE1234F"
                        className="bg-white border-blue-200"
                        required={formData.claim80G}
                      />
                      <p className="text-xs text-blue-600">Required to generate 80G Tax Exemption receipts.</p>
                    </div>
                  )}

                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("list")}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary text-white hover:bg-primary-dark"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving & Sending SMS...
                      </>
                    ) : (
                      "Record & Send Receipt"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Side column for success details */}
            <div className="space-y-4">
              {lastSuccess ? (
                <Card className="border-green-200 bg-green-50/30">
                  <CardHeader className="bg-green-50 border-b border-green-100">
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <CardTitle className="text-lg">Recorded Successfully!</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wider block">Receipt Link</span>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={`https://iskconnellore.com/receipt/${lastSuccess.orderId}`}
                          className="text-xs bg-white"
                        />
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => copyToClipboard(`https://iskconnellore.com/receipt/${lastSuccess.orderId}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-2 border-t pt-3">
                      <p><strong>Name:</strong> {lastSuccess.name}</p>
                      <p><strong>Phone:</strong> {lastSuccess.phone}</p>
                      <p><strong>Amount:</strong> ₹{Number(lastSuccess.amount).toLocaleString("en-IN")}</p>
                      <p><strong>Method:</strong> {lastSuccess.paymentMethod}</p>
                      {lastSuccess.claim80G && <p className="text-blue-700 font-semibold">✓ 80G Claimed (PAN: {lastSuccess.pan.toUpperCase()})</p>}
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => {
                        const tx = {
                          orderId: lastSuccess.orderId,
                          name: lastSuccess.name,
                          phone: lastSuccess.phone,
                          email: lastSuccess.email,
                          amount: lastSuccess.amount,
                          claim80G: lastSuccess.claim80G,
                          pan: lastSuccess.pan,
                          date: lastSuccess.date,
                          location: lastSuccess.branchName
                        };
                        handleDownloadReceipt(tx);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Receipt PDF
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-50 border-dashed border-gray-300">
                  <CardContent className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="font-medium">No recent transaction</p>
                    <p className="text-xs mt-1 text-gray-400">
                      Submit the form on the left to record a donation and see details here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: DONATIONS LIST */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Transactions Log</CardTitle>
                <CardDescription>
                  A separate dashboard of all offline transactions processed for this branch.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadCSV} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter controls */}
              <div className="flex gap-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, phone, PAN, Txn ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-white border-input"
                >
                  <option value="all">All Donations</option>
                  <option value="80g">80G Claims Only</option>
                  <option value="non-80g">Standard Donations Only</option>
                </select>
                <Button variant="ghost" size="icon" onClick={() => window.location.reload()} title="Reload data">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Transactions List styled like the first screenshot */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50/50">
                  <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p>No offline donations found matching criteria.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredTransactions.map((tx, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-base text-gray-900">{tx.name}</p>
                          <span className="inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-semibold">
                            {tx.formType || "Offline"}
                          </span>
                          <span className="inline-block bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded text-xs font-medium">
                            {tx.paymentMethod || "Cash"}
                          </span>
                          {tx.pan && (
                            <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs border border-blue-200">
                              PAN: {tx.pan.toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <p><strong>Phone:</strong> {tx.phone} {tx.email && `• Email: ${tx.email}`}</p>
                          {(tx.address || tx.pincode) && (
                            <p className="text-xs text-gray-500">
                              <strong>Address:</strong> {[tx.address, tx.pincode].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono">Reference ID: {tx.paymentId || "N/A"}</p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-3 sm:mt-0 border-t sm:border-t-0 pt-2 sm:pt-0 gap-2">
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-lg text-green-600">₹{(Number(tx.amount) || 0).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(tx)}
                            className="h-8 text-xs gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Receipt
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            onClick={() => copyToClipboard(`https://iskconnellore.com/receipt/${tx.orderId}`)}
                            title="Copy Receipt Link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-gray-500 border-t pt-4">
              Showing {filteredTransactions.length} of {branchTransactions.length} offline donation(s) for this branch.
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
