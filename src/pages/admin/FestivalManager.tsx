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
import { GalleryPicker } from "@/components/admin/GalleryPicker";

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
  const { user, role, permissions, dashboardBranchId, branchId } = useAuth();
  const activeBranch = dashboardBranchId || branchId || "nellore";
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

  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editSelectedGalleryUrl, setEditSelectedGalleryUrl] = useState<string>("");
  const [editFormId, setEditFormId] = useState("none");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFestivals();
    fetchForms();
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc")));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = data.filter((item: any) => item.branchId === activeBranch || (!item.branchId && activeBranch === 'nellore'));
      setGalleryImages(filtered);
    } catch (error) {
      console.error("Error fetching gallery:", error);
    }
  };

  const fetchForms = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, "custom_forms"), orderBy("createdAt", "desc")));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = data.filter((item: any) => item.branchId === activeBranch || (!item.branchId && activeBranch === 'nellore'));
      setAvailableForms(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFestivals = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "festivals"), orderBy("date", "asc")));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Festival[];
      const filtered = data.filter((item: any) => (item as any).branchId === activeBranch || (!(item as any).branchId && activeBranch === 'nellore'));
      setFestivals(filtered);
    } catch (error) {
      console.error("Error fetching festivals:", error);
      toast.error("Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  };

  const hasWriteAccess = role === "admin" || role === "super_admin" || role === "superadmin" ||
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
        branchId: activeBranch,
      });

      await logAudit(user?.email || "Unknown", "CREATED", "EVENT", `Title: ${title}, Date: ${date}`, activeBranch);

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

  const handleUpdateFestival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFestival) return;
    if (!editTitle || !editDate) {
      toast.error("Title and Date are required.");
      return;
    }
    
    if (!hasWriteAccess) {
      toast.error("You do not have permission to edit festivals.");
      return;
    }

    setUpdating(true);

    let imageUrl = editSelectedGalleryUrl;

    try {
      if (editImageFile && !imageUrl) {
        const imageRef = ref(storage, `festivals/${Date.now()}_${editImageFile.name}`);
        const snapshot = await uploadBytes(imageRef, editImageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "festivals", editingFestival.id), {
        title: editTitle,
        date: editDate,
        time: editTime,
        description: editDescription,
        imageUrl: imageUrl || "",
        formId: editFormId === "none" ? null : editFormId,
      });

      await logAudit(user?.email || "Unknown", "UPDATED", "EVENT", `Title: ${editTitle}, Date: ${editDate}`, activeBranch);

      toast.success("Festival updated successfully!");
      setEditingFestival(null);
      setUpdating(false);
      fetchFestivals();
    } catch (error) {
      console.error("Error updating festival:", error);
      toast.error("Failed to update the festival.");
      setUpdating(false);
    }
  };

  const openEditDialog = (festival: Festival) => {
    setEditingFestival(festival);
    setEditTitle(festival.title || "");
    setEditDate(festival.date || "");
    setEditTime(festival.time || "");
    setEditDescription(festival.description || "");
    setEditSelectedGalleryUrl(festival.imageUrl || "");
    setEditFormId(festival.formId || "none");
    setEditImageFile(null);
  };

  const handleDelete = async (festival: Festival) => {
    if (!confirm(`Are you sure you want to delete ${festival.title}?`)) return;
    
    try {
      await deleteDoc(doc(db, "festivals", festival.id));
      await logAudit(user?.email || "Unknown", "DELETED", "EVENT", `Title: ${festival.title}`, activeBranch);
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
                    {!selectedGalleryUrl && !imageFile ? (
                      <Input type="file" accept="image/*" onChange={(e) => {
                        setImageFile(e.target.files ? e.target.files[0] : null);
                        setSelectedGalleryUrl("");
                      }} />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md w-full bg-gray-50">
                        <img 
                          src={selectedGalleryUrl || (imageFile ? URL.createObjectURL(imageFile) : "")} 
                          alt="Selected" 
                          className="h-8 w-8 object-cover rounded" 
                        />
                        <span className="text-sm flex-1 truncate text-green-700 font-medium">
                          {selectedGalleryUrl ? "Selected from Gallery" : imageFile?.name}
                        </span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                          setSelectedGalleryUrl("");
                          setImageFile(null);
                        }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {!imageFile && !selectedGalleryUrl && (
                      <GalleryPicker 
                        onSelect={(media) => {
                          if (media.length > 0) {
                            setSelectedGalleryUrl(media[0].url);
                            setImageFile(null);
                          }
                        }}
                        maxSelection={1}
                        filterType="image"
                      />
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
            <Card key={festival.id} className="overflow-hidden flex flex-col relative group">
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
                    <div className="flex gap-1 -mt-2 -mr-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(festival)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(festival)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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

      <Dialog open={!!editingFestival} onOpenChange={(open) => !open && setEditingFestival(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateFestival} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Event Title</Label>
                <Input type="text" id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input type="date" id="edit-date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">Time (Optional)</Label>
                <Input type="text" id="edit-time" placeholder="e.g. 04:30 AM to 08:30 PM" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Banner Image (Optional)</Label>
                <div className="flex gap-2 items-center">
                    {!editSelectedGalleryUrl && !editImageFile ? (
                      <Input type="file" accept="image/*" onChange={(e) => {
                        setEditImageFile(e.target.files ? e.target.files[0] : null);
                        setEditSelectedGalleryUrl("");
                      }} />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md w-full bg-gray-50">
                        <img 
                          src={editSelectedGalleryUrl || (editImageFile ? URL.createObjectURL(editImageFile) : "")} 
                          alt="Selected" 
                          className="h-8 w-8 object-cover rounded" 
                        />
                        <span className="text-sm flex-1 truncate text-green-700 font-medium">
                          {editSelectedGalleryUrl ? "Selected from Gallery" : editImageFile?.name}
                        </span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => { 
                          setEditSelectedGalleryUrl(""); 
                          setEditImageFile(null); 
                        }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {!editImageFile && !editSelectedGalleryUrl && (
                      <GalleryPicker 
                        onSelect={(media) => {
                          if (media.length > 0) {
                            setEditSelectedGalleryUrl(media[0].url);
                            setEditImageFile(null);
                          }
                        }}
                        maxSelection={1}
                        filterType="image"
                      />
                    )}
                  </div>
                </div>
              
              <div className="space-y-2">
                <Label>Registration Form (Optional)</Label>
                <select 
                  value={editFormId} 
                  onChange={e => setEditFormId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="none">-- No Registration Form --</option>
                  {availableForms.map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <UITextArea 
                id="edit-description" 
                placeholder="Details about the festival..." 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)} 
                rows={4}
              />
            </div>

            {updating && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div className="bg-primary h-2.5 rounded-full w-full animate-pulse"></div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingFestival(null)}>Cancel</Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

