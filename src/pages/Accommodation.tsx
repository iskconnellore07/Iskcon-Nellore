import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isWithinInterval, parseISO, differenceInDays, addDays } from "date-fns";
import { Calendar as CalendarIcon, Users, Search, MapPin, Wifi, Coffee, Eye, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Pannellum } from "pannellum-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const RAZORPAY_KEY = "rzp_test_YourTestKeyHere"; // Placeholder

export default function Accommodation() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date());
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 1));
  const [guests, setGuests] = useState("2");

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  // 360 Viewer State
  const [is360Open, setIs360Open] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const snap = await getDocs(collection(db, "accommodation_rooms"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(data);
      setAvailableRooms(data.filter(r => !r.isBlocked));
    } catch (error) {
      toast.error("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }
    
    const filtered = rooms.filter(room => {
      if (room.isBlocked) return false;
      
      if (room.blockedDates && room.blockedDates.length > 0) {
        for (const bDateStr of room.blockedDates) {
          const bDate = parseISO(bDateStr);
          if (isWithinInterval(bDate, { start: checkIn, end: checkOut })) {
            return false;
          }
        }
      }
      return true;
    });

    setAvailableRooms(filtered);
    if (filtered.length === 0) toast.info("No rooms available for these dates.");
  };

  const openBooking = (room: any) => {
    setSelectedRoom(room);
    setIsBookingOpen(true);
    setReceipt(null);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const submitPaymentAndBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return toast.error("Name and Phone are required.");
    
    setIsSubmitting(true);
    const res = await loadRazorpay();
    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      setIsSubmitting(false);
      return;
    }

    const nights = Math.max(1, differenceInDays(checkOut!, checkIn!));
    const totalAmount = selectedRoom.price * nights;

    const options = {
      key: RAZORPAY_KEY,
      amount: totalAmount * 100, // Amount in paise
      currency: "INR",
      name: "ISKCON Nellore",
      description: `Booking for ${selectedRoom.roomNo}`,
      image: "https://iskcon.org/wp-content/uploads/2021/08/iskcon-logo.png",
      handler: async function (response: any) {
        try {
          // Add booking
          const bookingRef = await addDoc(collection(db, "accommodation_bookings"), {
            roomId: selectedRoom.id,
            roomNo: selectedRoom.roomNo,
            guestName: name,
            phone,
            email,
            checkIn: format(checkIn!, "yyyy-MM-dd"),
            checkOut: format(checkOut!, "yyyy-MM-dd"),
            guests,
            amountPaid: totalAmount,
            paymentId: response.razorpay_payment_id,
            status: "Confirmed",
            createdAt: new Date()
          });

          // Update blocked dates for the room
          const dateRange: string[] = [];
          let current = new Date(checkIn!);
          while (current <= checkOut!) {
            dateRange.push(format(current, "yyyy-MM-dd"));
            current = addDays(current, 1);
          }

          const existingBlocked = selectedRoom.blockedDates || [];
          await updateDoc(doc(db, "accommodation_rooms", selectedRoom.id), {
            blockedDates: Array.from(new Set([...existingBlocked, ...dateRange]))
          });

          toast.success("Payment Successful! Room Blocked.");
          setReceipt({
            bookingId: bookingRef.id,
            roomNo: selectedRoom.roomNo,
            amount: totalAmount,
            paymentId: response.razorpay_payment_id
          });
          fetchRooms(); // refresh availability
        } catch (error) {
          toast.error("Failed to save booking data.");
        } finally {
          setIsSubmitting(false);
        }
      },
      prefill: { name, email, contact: phone },
      theme: { color: "#ea580c" },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.on("payment.failed", function (response: any) {
      toast.error(response.error.description);
      setIsSubmitting(false);
    });
    paymentObject.open();
  };

  const open360 = (url: string) => {
    setViewerUrl(url);
    setIs360Open(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 pb-24 pt-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Temple Guest House</h1>
          <p className="text-orange-100 text-lg">Experience a peaceful stay at ISKCON Nellore</p>
        </div>
      </div>

      {/* MakeMyTrip Style Search Bar */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 justify-between border">
          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full text-left border rounded-lg p-3 hover:bg-gray-50 transition cursor-pointer">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block cursor-pointer">Check-In</label>
                  <div className="flex items-center gap-2 font-semibold text-lg text-primary">
                    <CalendarIcon className="w-5 h-5" />
                    {checkIn ? format(checkIn, "dd MMM yyyy") : "Select Date"}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkIn} onSelect={(date) => { if(date) setCheckIn(date); }} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full text-left border rounded-lg p-3 hover:bg-gray-50 transition cursor-pointer">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block cursor-pointer">Check-Out</label>
                  <div className="flex items-center gap-2 font-semibold text-lg text-primary">
                    <CalendarIcon className="w-5 h-5" />
                    {checkOut ? format(checkOut, "dd MMM yyyy") : "Select Date"}
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkOut} onSelect={(date) => { if(date) setCheckOut(date); }} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-full md:w-48 border rounded-lg p-3 hover:bg-gray-50 transition">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Guests & Rooms</label>
            <div className="flex items-center gap-2 font-semibold text-lg text-primary">
              <Users className="w-5 h-5" />
              <select className="bg-transparent outline-none w-full cursor-pointer" value={guests} onChange={(e) => setGuests(e.target.value)}>
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <Button onClick={handleSearch} size="lg" className="w-full h-full text-lg px-8 py-4 rounded-xl shadow-lg hover:scale-105 transition-transform">
              <Search className="w-5 h-5 mr-2" /> Search
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Available Accommodations</h2>
        
        {loading ? (
          <div className="text-center py-12">Searching for rooms...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableRooms.map(room => (
              <Card key={room.id} className="overflow-hidden hover:shadow-xl transition-shadow border-gray-200">
                <div className="flex flex-col sm:flex-row">
                  {/* Media Carousel */}
                  <div className="sm:w-2/5 relative bg-gray-200">
                    {room.media && room.media.length > 0 ? (
                      <Carousel className="w-full h-full">
                        <CarouselContent className="h-full ml-0">
                          {room.media.map((m: any, idx: number) => (
                            <CarouselItem key={idx} className="h-full p-0 relative group min-h-[200px]">
                              {m.type === "video" ? (
                                <video src={m.url} controls className="w-full h-full object-cover" />
                              ) : (
                                <>
                                  <img src={m.url} className="w-full h-full object-cover" alt="Room" />
                                  <div className="absolute inset-0 bg-black/20" />
                                  {m.type === "360" && (
                                    <Button variant="secondary" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl opacity-90 group-hover:opacity-100 transition" onClick={() => open360(m.url)}>
                                      <Eye className="w-4 h-4 mr-2" /> View 360°
                                    </Button>
                                  )}
                                </>
                              )}
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {room.media.length > 1 && (
                          <>
                            <CarouselPrevious className="absolute left-2 top-1/2 bg-white/50 hover:bg-white" />
                            <CarouselNext className="absolute right-2 top-1/2 bg-white/50 hover:bg-white" />
                          </>
                        )}
                      </Carousel>
                    ) : (
                      <div className="w-full h-full min-h-[200px] flex items-center justify-center text-gray-400">
                        No Media
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="sm:w-3/5 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{room.roomNo}</h3>
                        <div className="flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">
                          <Star className="w-3 h-3 mr-1 fill-current" /> 4.8
                        </div>
                      </div>
                      <p className="text-sm text-primary font-semibold mb-3">{room.type}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <Wifi className="w-3 h-3 mr-1" /> Free WiFi
                        </span>
                        <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <Coffee className="w-3 h-3 mr-1" /> Breakfast
                        </span>
                        <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <MapPin className="w-3 h-3 mr-1" /> Temple View
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 border-t pt-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">₹{room.price}</p>
                        <p className="text-xs text-gray-500">per night + taxes</p>
                      </div>
                      <Button onClick={() => openBooking(room)} className="bg-orange-600 hover:bg-orange-700">
                        Pay & Book
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {availableRooms.length === 0 && !loading && (
              <div className="col-span-full bg-white border p-12 text-center rounded-xl shadow-sm">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-700">No Rooms Available</h3>
                <p className="text-gray-500 mt-2">Try changing your dates to find availability.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 360 Viewer Dialog */}
      <Dialog open={is360Open} onOpenChange={setIs360Open}>
        <DialogContent className="max-w-5xl p-1 bg-black border-none">
          <div className="relative w-full aspect-video md:aspect-[2/1] rounded-md overflow-hidden">
             <Button variant="ghost" className="absolute top-2 right-2 z-50 text-white bg-black/50 hover:bg-black/70" onClick={() => setIs360Open(false)}>Close</Button>
             {is360Open && (
               <Pannellum width="100%" height="100%" image={viewerUrl} pitch={10} yaw={180} hfov={90} autoLoad />
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Form Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{receipt ? "Booking Confirmed!" : "Complete Your Booking"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {receipt ? (
              <div className="bg-green-50 p-6 rounded-lg text-center border border-green-200">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h3>
                <p className="text-gray-700 mb-4">Your room is blocked and confirmed for the selected dates.</p>
                <div className="bg-white p-4 rounded text-left shadow-sm border">
                  <p><strong>Room:</strong> {receipt.roomNo}</p>
                  <p><strong>Booking ID:</strong> {receipt.bookingId}</p>
                  <p><strong>Payment Ref:</strong> {receipt.paymentId}</p>
                  <p><strong>Amount Paid:</strong> ₹{receipt.amount}</p>
                </div>
                <Button className="mt-6 w-full" onClick={() => setIsBookingOpen(false)}>Close</Button>
              </div>
            ) : (
              <>
                <div className="bg-orange-50 p-4 rounded-md mb-4 border border-orange-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{selectedRoom?.roomNo} - {selectedRoom?.type}</p>
                    <p className="text-sm text-gray-600">
                      {checkIn ? format(checkIn, "MMM dd") : ""} to {checkOut ? format(checkOut, "MMM dd") : ""} • {guests} Guests
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-orange-600">₹{selectedRoom ? selectedRoom.price * Math.max(1, differenceInDays(checkOut!, checkIn!)) : 0}</p>
                    <p className="text-xs text-gray-500">Total Payable</p>
                  </div>
                </div>
                
                <form onSubmit={submitPaymentAndBooking} className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : `Pay ₹${selectedRoom ? selectedRoom.price * Math.max(1, differenceInDays(checkOut!, checkIn!)) : 0} & Block Room`}
                  </Button>
                </form>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
