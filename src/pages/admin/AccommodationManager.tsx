import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Home as HomeIcon, Calendar as CalendarIcon, MoreVertical, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GalleryPicker } from "@/components/admin/GalleryPicker";
import { useAuth } from "@/contexts/AuthContext";

export default function AccommodationManager() {
  const { role } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New / Edit Room State
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomNo, setRoomNo] = useState("");
  const [roomType, setRoomType] = useState("Standard AC");
  const [price, setPrice] = useState("");
  const [mediaItems, setMediaItems] = useState<{url: string, type: "image"|"video"|"360"}[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Block Dates State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const roomsSnapshot = await getDocs(collection(db, "accommodation_rooms"));
      const rData = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(rData.sort((a, b) => a.roomNo.localeCompare(b.roomNo)));

      const bookingsSnapshot = await getDocs(query(collection(db, "accommodation_bookings"), orderBy("createdAt", "desc")));
      setBookings(bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching accommodation data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      if (editingRoomId) {
        await updateDoc(doc(db, "accommodation_rooms", editingRoomId), {
          roomNo,
          type: roomType,
          price: Number(price),
          media: mediaItems,
        });
        toast.success("Room updated successfully!");
      } else {
        await addDoc(collection(db, "accommodation_rooms"), {
          roomNo,
          type: roomType,
          price: Number(price),
          media: mediaItems,
          isBlocked: false,
          blockedDates: [],
          createdAt: new Date(),
        });
        toast.success("Room added successfully!");
      }
      setIsAddRoomOpen(false);
      setEditingRoomId(null);
      setRoomNo("");
      setPrice("");
      setMediaItems([]);
      fetchData();
    } catch (error) {
      toast.error(editingRoomId ? "Failed to update room" : "Failed to add room");
    } finally {
      setIsAdding(false);
    }
  };

  const openEditModal = (room: any) => {
    setEditingRoomId(room.id);
    setRoomNo(room.roomNo);
    setRoomType(room.type);
    setPrice(room.price.toString());
    setMediaItems(room.media || []);
    setIsAddRoomOpen(true);
  };

  const openAddModal = () => {
    setEditingRoomId(null);
    setRoomNo("");
    setRoomType("Standard AC");
    setPrice("");
    setMediaItems([]);
    setIsAddRoomOpen(true);
  };

  const toggleRoomBlock = async (roomId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "accommodation_rooms", roomId), { isBlocked: !currentStatus });
      toast.success(`Room ${!currentStatus ? 'blocked' : 'unblocked'}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleBlockDates = async () => {
    if (!selectedRoom) return;
    try {
      const formattedDates = selectedDates.map(d => d.toISOString().split('T')[0]);
      await updateDoc(doc(db, "accommodation_rooms", selectedRoom.id), {
        blockedDates: formattedDates
      });
      toast.success("Dates blocked successfully!");
      setIsBlockModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to block dates");
    }
  };

  const openBlockModal = (room: any) => {
    setSelectedRoom(room);
    const existingDates = (room.blockedDates || []).map((d: string) => new Date(d));
    setSelectedDates(existingDates);
    setIsBlockModalOpen(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteDoc(doc(db, "accommodation_rooms", roomId));
      toast.success("Room deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete room");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accommodation Manager</h1>
          <p className="text-gray-500 mt-1">Manage guest house rooms and bookings.</p>
        </div>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList>
          <TabsTrigger value="rooms">Rooms Layout</TabsTrigger>
          <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rooms" className="mt-6">
          <div className="flex justify-end mb-6">
            <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddModal}><Plus className="w-4 h-4 mr-2"/> Add New Room</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingRoomId ? "Edit Room" : "Add New Room"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddRoom} className="space-y-4 mt-4">
                  <div>
                    <Label>Room Number / Name</Label>
                    <Input required value={roomNo} onChange={e => setRoomNo(e.target.value)} placeholder="e.g. 101 or Krishna Block A" />
                  </div>
                  <div>
                    <Label>Room Type</Label>
                    <Input required value={roomType} onChange={e => setRoomType(e.target.value)} placeholder="e.g. Standard AC" />
                  </div>
                  <div>
                    <Label>Price per Night (₹)</Label>
                    <Input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" />
                  </div>
                  <div>
                    <Label>Media (Photos, Videos, 360)</Label>
                    <div className="flex flex-col gap-2 mt-2">
                      <GalleryPicker onSelect={setMediaItems} maxSelection={5} />
                      {mediaItems.length > 0 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                          {mediaItems.map((m, idx) => (
                            <div key={idx} className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                              {m.type === "video" ? (
                                <span className="text-[10px] text-gray-500 font-bold">VIDEO</span>
                              ) : (
                                <img src={m.url} className="w-full h-full object-cover" />
                              )}
                              {m.type === "360" && (
                                <span className="absolute bottom-0 left-0 right-0 bg-primary text-[8px] text-white text-center font-bold">360</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isAdding || mediaItems.length === 0}>
                    {isAdding ? "Saving..." : editingRoomId ? "Update Room" : "Add Room"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <Card key={room.id} className={room.isBlocked ? "border-red-200 bg-red-50" : ""}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <HomeIcon className="w-5 h-5 text-primary" />
                      {room.roomNo}
                    </CardTitle>
                    <CardDescription>{room.type} • ₹{room.price}/night</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(room)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Room Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openBlockModal(room)}>
                        <CalendarIcon className="w-4 h-4 mr-2" /> Block Future Dates
                      </DropdownMenuItem>
                      {role === "super_admin" && (
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteRoom(room.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Room
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-medium">Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${room.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {room.isBlocked ? "BLOCKED" : "AVAILABLE"}
                      </span>
                      <Switch 
                        checked={!room.isBlocked} 
                        onCheckedChange={() => toggleRoomBlock(room.id, room.isBlocked)} 
                      />
                    </div>
                  </div>
                  {(room.blockedDates?.length > 0) && (
                    <div className="mt-4 p-3 bg-white/50 border rounded-md text-xs text-gray-600">
                      <strong>{room.blockedDates.length} Specific Date(s) Blocked</strong>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {rooms.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No rooms added yet. Create your first room to get started!
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Requests</CardTitle>
              <CardDescription>Review and manage booking requests from users.</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No booking requests yet.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map(booking => (
                    <div key={booking.id} className="border p-4 rounded-lg flex justify-between items-center bg-gray-50">
                      <div>
                        <h4 className="font-bold">{booking.guestName}</h4>
                        <p className="text-sm text-gray-600">Room: {booking.roomNo} • {booking.phone}</p>
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          Check-in: {booking.checkIn} | Check-out: {booking.checkOut}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-100 text-yellow-800 uppercase">
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block Future Dates for {selectedRoom?.roomNo}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => setSelectedDates(dates as Date[])}
              className="rounded-md border"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)}>Cancel</Button>
            <Button onClick={handleBlockDates}>Save Blocked Dates</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
