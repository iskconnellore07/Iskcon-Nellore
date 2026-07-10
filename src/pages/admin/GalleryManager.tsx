import { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, UploadCloud, Image as ImageIcon, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/audit";

interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: "image" | "video";
  uploadedBy: string;
  size?: number;
}

export default function GalleryManager() {
  const { user, role } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [category, setCategory] = useState("General");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [totalStorage, setTotalStorage] = useState(0);

  const MAX_STORAGE = 25 * 1024 * 1024 * 1024; // 25 GB

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const gallerySnapshot = await getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc")));
      const videosSnapshot = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc")));
      
      const galleryData = gallerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "image" as const })) as MediaItem[];
      const videosData = videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "video" as const })) as MediaItem[];
      
      const allMedia = [...galleryData, ...videosData];
      const totalBytes = allMedia.reduce((sum, item) => sum + (item.size || 0), 0);
      setTotalStorage(totalBytes);
      
      setMedia(allMedia.sort((a: any, b: any) => 
        (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
      ));
    } catch (error) {
      console.error("Error fetching media:", error);
      toast.error("Failed to load media.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      const validFiles = selectedFiles.filter(file => {
        if (mediaType === "image" && file.size > 9 * 1024 * 1024) {
          toast.error(`Image ${file.name} must be smaller than 9MB`);
          return false;
        }
        if (mediaType === "video" && file.size > 100 * 1024 * 1024) {
          toast.error(`Video ${file.name} must be smaller than 100MB`);
          return false;
        }
        return true;
      });
      
      setFiles(validFiles);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !title) {
      toast.error("Please provide a title and select at least one file.");
      return;
    }
    if (!auth.currentUser) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus(`Uploading ${i + 1} of ${files.length}...`);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "wt2knj9m"); // Cloudinary Upload Preset
      
      let fileType = "image";
      if (file.type.startsWith("video/") || mediaType === "video") {
        fileType = "video";
      }

      let resourceType = fileType;
      // If it's a large image, try uploading as raw or auto to bypass strict image limits if account allows
      if (fileType === "image" && file.size > 10 * 1024 * 1024) {
         resourceType = "auto";
      }

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/me9ytplz/${resourceType}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Cloudinary error:", errText);
          throw new Error("Cloudinary upload failed: " + errText);
        }

        const data = await res.json();

        if (fileType === "video") {
          await addDoc(collection(db, "videos"), {
            title: files.length > 1 ? `${title} ${i + 1}` : title,
            url: data.secure_url,
            storagePath: data.public_id,
            size: data.bytes || 0,
            uploadedBy: auth.currentUser.uid,
            createdAt: serverTimestamp(),
            category,
          });
        } else {
          await addDoc(collection(db, "gallery"), {
            title: files.length > 1 ? `${title} ${i + 1}` : title,
            url: data.secure_url,
            storagePath: data.public_id,
            size: data.bytes || 0,
            uploadedBy: auth.currentUser.uid,
            createdAt: serverTimestamp(),
            category,
          });
        }
        successCount++;
        await logAudit(user?.email || "Unknown", "UPLOADED", "PHOTO_VIDEO", `Title: ${files.length > 1 ? `${title} ${i + 1}` : title} (${file.name})`);
      } catch (error) {
        console.error("Upload Error:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploadProgress(100);
    toast.success(`Successfully uploaded ${successCount} files!`);
    setTitle("");
    setFiles([]);
    setCategory("General");
    setUploadStatus("");
    setUploading(false);
    fetchMedia();
  };

  const injectLocal360 = async () => {
    const localFiles = ["102.jpg", "103.jpg", "105.jpg", "111.jpg", "115.jpg", "118.jpg", "120.jpg", "b1.jpg", "b2.jpg", "b3.jpg"];
    try {
      for (const file of localFiles) {
        await addDoc(collection(db, "gallery"), {
          title: file.replace('.jpg', '') + ' (360° View)',
          url: `/assets/360/${file}`,
          storagePath: 'local',
          size: 14000000, // roughly 14MB
          uploadedBy: auth.currentUser?.uid || "admin",
          createdAt: serverTimestamp(),
          category: "Accommodation"
        });
      }
      toast.success("Successfully synced all 10 local 360 photos!");
      fetchMedia();
    } catch (error) {
      toast.error("Failed to sync local photos");
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm("Are you sure you want to delete this file? This cannot be undone.")) return;
    
    try {
      const collectionName = item.type === "video" ? "videos" : "gallery";
      await deleteDoc(doc(db, collectionName, item.id));
      
      toast.success("File deleted successfully");
      await logAudit(user?.email || "Unknown", "DELETED", "PHOTO_VIDEO", `Title: ${item.title}`);
      fetchMedia();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file.");
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete these ${selectedItems.length} files?`)) return;

    try {
      const itemsToDelete = media.filter(m => selectedItems.includes(m.id));
      for (const item of itemsToDelete) {
        const collectionName = item.type === "video" ? "videos" : "gallery";
        await deleteDoc(doc(db, collectionName, item.id));
      }
      toast.success(`Successfully deleted ${selectedItems.length} files`);
      setSelectedItems([]);
      fetchMedia();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete some files.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery & Media Manager</h1>
          <p className="text-gray-500 mt-1">Manage photos and short videos for the website.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={injectLocal360}>Sync Local 360 Photos</Button>
          <div className="text-right">
            <p className="text-sm font-medium">Storage Used</p>
            <p className="text-xs text-gray-500">{(totalStorage / (1024 * 1024 * 1024)).toFixed(2)} GB / 25 GB</p>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedItems.length})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Media</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="image" onValueChange={(val) => setMediaType(val as "image" | "video")}>
            <TabsList className="mb-4">
              <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2" /> Photo (Max 9MB)</TabsTrigger>
              <TabsTrigger value="video"><Video className="w-4 h-4 mr-2" /> Short Video (Max 100MB)</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="General">General (Public Gallery)</option>
                  <option value="Accommodation">Accommodation (Rooms Only)</option>
                </select>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="file">File</Label>
                <Input 
                  id="file" 
                  type="file" 
                  accept={mediaType === "image" ? "image/*" : "video/*"} 
                  onChange={handleFileChange} 
                  required 
                  multiple
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{uploadStatus}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={uploading || files.length === 0}>
                {uploading ? "Uploading..." : <><UploadCloud className="w-4 h-4 mr-2" /> Upload {files.length > 0 && `(${files.length})`}</>}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading media...</p>
        ) : media.length === 0 ? (
          <p className="text-gray-500 col-span-3">No media files uploaded yet.</p>
        ) : (
          media.map((item) => {
            const canDelete = role === "super_admin" || item.uploadedBy === user?.uid;
            const isSelected = selectedItems.includes(item.id);

            return (
              <Card key={item.id} className={`overflow-hidden relative transition-all ${isSelected ? 'ring-2 ring-red-500 shadow-lg' : ''}`}>
                {canDelete && (
                  <div className="absolute top-2 left-2 z-10 bg-white/90 rounded-sm">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 cursor-pointer accent-red-500"
                      checked={isSelected}
                      onChange={() => toggleSelection(item.id)}
                    />
                  </div>
                )}
                {item.type === "image" ? (
                <img src={item.url} alt={item.title} className="w-full h-48 object-cover" />
              ) : (
                <video src={item.url} className="w-full h-48 object-cover" controls />
              )}
              <CardContent className="p-4 flex justify-between items-center">
                <div className="truncate pr-4">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500 uppercase">{item.type}</p>
                </div>
                {canDelete && (
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
