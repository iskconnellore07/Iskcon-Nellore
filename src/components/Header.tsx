import { Link, useLocation } from "react-router-dom";
import { useBranchPrefix, useBranchName } from "@/hooks/useBranchPrefix";
import logo from "@/assets/iskcon_logo.avif";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Menu, Heart, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { generateBeautifulReceipt, generate80GReceipt } from "@/lib/receipt-generator";
import { API_BASE_URL } from "@/config";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Header = () => {
  const location = useLocation();
  const branchPrefix = useBranchPrefix();
  const branchName = useBranchName();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [claim80G, setClaim80G] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  
  // Default branch based on URL
  const getDefaultBranch = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('gudur')) return 'ISKCON Gudur';
    if (path.includes('kavali')) return 'ISKCON Kavali';
    if (path.includes('naidupeta')) return 'ISKCON Naidupet';
    if (path.includes('sullurpeta')) return 'ISKCON Sullurpeta';
    return 'ISKCON Nellore';
  };

  const [formData, setFormData] = useState({
    name: "", mobile: "", address: "", email: "", pan: "", pincode: "", donationFor: "general", templeLocation: getDefaultBranch()
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, templeLocation: getDefaultBranch() }));
  }, [location.pathname]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const q = query(collection(db, "branches"), where("isActive", "==", true));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Ensure Nellore is first
        const sorted = data.sort((a, b) => a.id === 'nellore' ? -1 : b.id === 'nellore' ? 1 : a.name.localeCompare(b.name));
        setBranches(sorted);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (e.target.name === "pan") {
      val = val.toUpperCase().replace(/\s+/g, "");
    }
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!formData.mobile?.trim()) {
      alert("Please enter your mobile number.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid donation amount greater than 0.");
      return;
    }
    
    if (claim80G && Number(amount) >= 2000 && !formData.pan?.trim()) {
      alert("PAN Number is required for 80G Receipt.");
      return;
    }

    setIsLoading(true);
    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsLoading(false);
      return;
    }

    try {
      const orderResponse = await fetch(`${API_BASE_URL}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, claim80G, ...formData }),
      });
      const orderData = await orderResponse.json();

      if (orderData.error) {
        alert(orderData.error);
        setIsLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ISKCON Nellore",
        description: "Donation",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verifyResponse = await fetch(`${API_BASE_URL}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              orderData: orderData.originalData,
            }),
          });
          const verifyJson = await verifyResponse.json();

          if (verifyJson.success) {
            alert("Payment successful! Thank you for your donation. Your receipt will download automatically.");
            
            const receiptData = {
              id: orderData.orderId.replace('order_', ''),
              date: new Date().toLocaleDateString(),
              name: formData.name,
              phone: formData.mobile,
              email: formData.email,
              festival: formData.donationFor,
              amount: Number(amount),
              status: "PAID",
              type: "DONATION" as const,
              claim80G: claim80G && Number(amount) >= 2000,
              panOrGst: formData.pan
            };

            generateBeautifulReceipt(receiptData);

            if (claim80G && Number(amount) >= 2000) {
              generate80GReceipt(receiptData);
            }
            
            setIsDonateOpen(false);
          } else {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.mobile,
        },
        theme: { color: "#f97316" },
      };

      const paymentObject = new (window as any).Razorpay(options);
      setIsDonateOpen(false);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to={branchPrefix || "/"} className="flex items-center space-x-2">
             <div className="h-10 w-10 flex items-center justify-center"> 
              <span className="text-primary-foreground font-bold text-lg"><img src={logo} alt="Logo" className="w-full h-full object-contain" /></span>
             </div> 
            <span className="font-bold text-lg text-foreground hidden sm:inline">ISKCON {branchName}</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <div className="relative group">
              <button className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
                Our Branches <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 top-full mt-2 w-48 rounded-md border border-border bg-background shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-2">
                  {branches.map(branch => (
                    branch.type === 'external' ? (
                      <a key={branch.id} href={branch.link} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-muted text-foreground">
                        {branch.name}
                      </a>
                    ) : (
                      <Link key={branch.id} to={branch.id === 'nellore' ? '/' : `/${branch.id}`} className="block px-4 py-2 text-sm hover:bg-muted text-foreground">
                        {branch.name}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            </div>
            <Link to={branchPrefix || "/"} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to={`${branchPrefix}/darshan`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Daily Darshan
            </Link>
            <Link to={`${branchPrefix}/events`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Events
            </Link>
            <Link to={`${branchPrefix}/about`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to={`${branchPrefix}/contact`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="hero"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setIsDonateOpen(true)}
            >
              <Heart className="mr-2 h-4 w-4" />
              Donate
            </Button>
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-in">
            <nav className="flex flex-col space-y-3">
              <div className="border-b border-border pb-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 mb-2 block">Our Branches</span>
                {branches.map(branch => (
                  branch.type === 'external' ? (
                    <a key={branch.id} href={branch.link} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2 pl-2">
                      {branch.name}
                    </a>
                  ) : (
                    <Link key={branch.id} to={branch.id === 'nellore' ? '/' : `/${branch.id}`} className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2 pl-2" onClick={() => setIsMenuOpen(false)}>
                      {branch.name}
                    </Link>
                  )
                ))}
              </div>
              <Link to={branchPrefix || "/"} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link to={`${branchPrefix}/darshan`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Daily Darshan
              </Link>
              <Link to={`${branchPrefix}/events`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Events
              </Link>
              <Link to={`${branchPrefix}/about`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
              <Link to={`${branchPrefix}/contact`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Contact
              </Link>
              <Button
                variant="hero"
                size="sm"
                className="w-full mt-2"
                onClick={() => setIsDonateOpen(true)}
              >
                <Heart className="mr-2 h-4 w-4" />
                Donate
              </Button>
            </nav>
          </div>
        )}
      </div>
      <Dialog open={isDonateOpen} onOpenChange={setIsDonateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Donation Form</DialogTitle>
            <DialogDescription>
              Please fill in your details. We will contact you if needed.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="donation-for">Donation for</Label>
              <Select 
                value={formData.donationFor} 
                onValueChange={(val) => setFormData({ ...formData, donationFor: val })}
              >
                <SelectTrigger id="donation-for">
                  <SelectValue placeholder="Select donation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General donation</SelectItem>
                  <SelectItem value="deity">Deity worship</SelectItem>
                  <SelectItem value="annadhan">Annadhan</SelectItem>
                  <SelectItem value="food">Food for life</SelectItem>
                  <SelectItem value="pooja">Offer a pooja</SelectItem>
                  <SelectItem value="birthday">Donate on birthday or special occasion</SelectItem>
                  <SelectItem value="vidya">Vidya Dhan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {getDefaultBranch() === 'ISKCON Nellore' && (
              <div className="grid gap-2">
                <Label htmlFor="temple-location">Temple Location</Label>
                <Select 
                  value={formData.templeLocation} 
                  onValueChange={(val) => setFormData({ ...formData, templeLocation: val })}
                >
                  <SelectTrigger id="temple-location">
                    <SelectValue placeholder="Select temple location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISKCON Nellore">ISKCON Nellore</SelectItem>
                    {branches.filter(b => b.id !== 'nellore').map(b => (
                      <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="donor-name">Name <span className="text-red-500">*</span></Label>
                <Input id="donor-name" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="donor-mobile">Mobile Number <span className="text-red-500">*</span></Label>
                <Input id="donor-mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} placeholder="+91" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="donor-address">Address</Label>
              <Textarea id="donor-address" name="address" value={formData.address} onChange={handleChange} placeholder="Street, city, state" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="donor-amount">Amount <span className="text-red-500">*</span></Label>
                <Input
                  id="donor-amount"
                  name="amount"
                  type="number"
                  min="1"
                  placeholder="Amount in INR"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[116, 516, 1016, 5016, 10016, 100016].map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-1 text-[11px] sm:text-xs bg-orange-50/50 hover:bg-orange-100 border-orange-200 text-orange-700 transition-colors"
                      onClick={() => setAmount(opt.toString())}
                    >
                      ₹{opt}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="donor-email">Email</Label>
                <Input id="donor-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="donor-pan">PAN / GST (Optional)</Label>
                <Input id="donor-pan" name="pan" value={formData.pan} onChange={handleChange} placeholder="ABCDE1234F" required={claim80G && Number(amount) >= 2000} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="donor-pincode">Pin code</Label>
                <Input id="donor-pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="000000" />
              </div>
            </div>
            
            {Number(amount) >= 2000 && (
              <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-md border border-border">
                <input 
                  type="checkbox" 
                  id="claim-80g" 
                  checked={claim80G}
                  onChange={(e) => setClaim80G(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="claim-80g" className="font-medium cursor-pointer">
                  Claim 80G Tax Exemption (Requires PAN or GST)
                </Label>
              </div>
            )}
            
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
