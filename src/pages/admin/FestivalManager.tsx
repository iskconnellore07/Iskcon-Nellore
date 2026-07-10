import { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, CalendarPlus, Calendar, Clock, ImagePlus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea as UITextArea } from "@/components/ui/textarea";
import { logAudit } from "@/lib/audit";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

interface Festival {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  imageUrl?: string;
  formId?: string;
}

export default function FestivalManager() {
  const { user, role, permissions } = useAuth();
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [adding, setAdding] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState<string>("");
  const [formId, setFormId] = useState("none");
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);

  useEffect(() => {
    fetchFestivals();
    fetchForms();
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc")));
      setGalleryImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching gallery:", error);
    }
  };

  const fetchForms = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "custom_forms"), orderBy("createdAt", "desc")));
      setAvailableForms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFestivals = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "festivals"), orderBy("date", "asc")));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Festival[];
      setFestivals(data);
    } catch (error) {
      console.error("Error fetching festivals:", error);
      toast.error("Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  };

  const hasWriteAccess = role === "admin" || role === "super_admin" || 
    (permissions?.calendar?.hasAccess && (!permissions.calendar.expiresAt || new Date(permissions.calendar.expiresAt) > new Date()));

  const handleCreateFestival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      toast.error("Title and Date are required.");
      return;
    }
    
    if (!hasWriteAccess) {
      toast.error("You do not have permission to add festivals.");
      return;
    }

    setAdding(true);

    let imageUrl = selectedGalleryUrl;

    try {
      if (imageFile && !imageUrl) {
        const imageRef = ref(storage, `festivals/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, "festivals"), {
        title,
        date,
        time,
        description,
        imageUrl,
        formId: formId === "none" ? null : formId,
        createdAt: serverTimestamp(),
      });

      await logAudit(user?.email || "Unknown", "CREATED", "EVENT", `Title: ${title}, Date: ${date}`);

      toast.success("Festival added to calendar successfully!");
      setTitle("");
      setDate("");
      setTime("");
      setDescription("");
      setImageFile(null);
      setSelectedGalleryUrl("");
      setFormId("none");
      setAdding(false);
      fetchFestivals();
    } catch (error) {
      console.error("Error saving festival:", error);
      toast.error("Failed to save the festival.");
      setAdding(false);
    }
  };

  const handleDelete = async (festival: Festival) => {
    if (!confirm(`Are you sure you want to delete ${festival.title}?`)) return;
    
    try {
      await deleteDoc(doc(db, "festivals", festival.id));
      await logAudit(user?.email || "Unknown", "DELETED", "EVENT", `Title: ${festival.title}`);
      toast.success("Festival deleted successfully");
      fetchFestivals();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete festival.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Calendar & Festivals</h2>
      </div>

      {hasWriteAccess && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CalendarPlus className="w-5 h-5 text-primary" />
              <CardTitle>Add New Event</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFestival} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time (Optional)</Label>
                  <Input type="text" id="time" placeholder="e.g. 04:30 AM to 08:30 PM" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Banner Image (Optional)</Label>
                  <div className="flex gap-2 items-center">
                    {!selectedGalleryUrl ? (
                      <Input type="file" accept="image/*" onChange={(e) => {
                        setImageFile(e.target.files ? e.target.files[0] : null);
                        setSelectedGalleryUrl("");
                      }} />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md w-full bg-gray-50">
                        <img src={selectedGalleryUrl} alt="Selected" className="h-8 w-8 object-cover rounded" />
                        <span className="text-sm flex-1 truncate text-green-700 font-medium">Selected from Gallery</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedGalleryUrl("")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {!imageFile && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" className="whitespace-nowrap" onClick={fetchGallery}>
                            <ImagePlus className="w-4 h-4 mr-2" /> From Gallery
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Choose from Gallery</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2">
                            {galleryImages.map((img) => (
                              <DialogClose asChild key={img.id}>
                                <div 
                                  className="cursor-pointer relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-primary"
                                  onClick={() => {
                                    setSelectedGalleryUrl(img.url);
                                    setImageFile(null);
                                  }}
                                >
                                  <img src={img.url} alt={img.title || "Gallery Image"} className="w-full h-32 object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-white text-sm font-semibold">Select</span>
                                  </div>
                                </div>
                              </DialogClose>
                            ))}
                            {galleryImages.length === 0 && (
                              <div className="col-span-full text-center text-gray-500 py-8">
                                No photos found in the gallery. Upload some photos in the Gallery Manager first.
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Registration Form (Optional)</Label>
                  <select 
                    value={formId} 
                    onChange={e => setFormId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="none">-- No Registration Form --</option>
                    {availableForms.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Don't see your form? <a href="/admin/forms" className="text-primary hover:underline font-semibold">Click here to create a new form</a>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <UITextArea 
                  id="description" 
                  placeholder="Details about the festival..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={4}
                />
              </div>

              {adding && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div className="bg-primary h-2.5 rounded-full w-full animate-pulse"></div>
                </div>
              )}
              <Button type="submit" disabled={adding} className="mt-4">
                {adding ? "Saving Event..." : "Add Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading calendar...</p>
        ) : festivals.length === 0 ? (
          <p className="text-gray-500 col-span-3">No festivals added to the calendar yet.</p>
        ) : (
          festivals.map((festival) => (
            <Card key={festival.id} className="overflow-hidden flex flex-col">
              {festival.imageUrl ? (
                <img 
                  src={festival.imageUrl} 
                  alt={festival.title} 
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-orange-100 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-orange-300" />
                </div>
              )}
              <CardContent className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-gray-900">{festival.title}</h3>
                  {hasWriteAccess && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(festival)} className="text-red-500 hover:text-red-700 hover:bg-red-50 -mt-2 -mr-2">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    {new Date(festival.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  {festival.time && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      {festival.time}
                    </div>
                  )}
                </div>
                {festival.description && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{festival.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
