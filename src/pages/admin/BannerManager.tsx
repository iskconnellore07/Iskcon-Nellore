import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { GalleryPicker } from "@/components/admin/GalleryPicker";

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  mediaType: "image" | "video";
  location: "home" | "darshan" | "goshala";
  endDate?: string;
  order: number;
}

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [location, setLocation] = useState<"home" | "darshan" | "goshala">("home");
  const [endDate, setEndDate] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: "image"|"video"}[]>([]);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "website_banners"), orderBy("order", "asc")));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl && selectedMedia.length === 0) {
      toast.error("Please provide an image URL or select from gallery");
      return;
    }

    try {
      const highestOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order)) : 0;
      let currentOrder = highestOrder + 1;

      const itemsToAdd = selectedMedia.length > 0 
        ? selectedMedia 
        : [{ url: imageUrl, type: mediaType }];

      for (const item of itemsToAdd) {
        await addDoc(collection(db, "website_banners"), {
          imageUrl: item.url,
          title,
          subtitle,
          buttonText,
          buttonLink,
          mediaType: item.type,
          location,
          endDate: endDate || null,
          order: currentOrder++,
          createdAt: serverTimestamp()
        });
      }

      toast.success(itemsToAdd.length > 1 ? `${itemsToAdd.length} Banners added successfully!` : "Banner added successfully!");
      setImageUrl("");
      setTitle("");
      setSubtitle("");
      setButtonText("");
      setButtonLink("");
      setMediaType("image");
      setLocation("home");
      setEndDate("");
      setSelectedMedia([]);
      fetchBanners();
    } catch (error) {
      console.error("Error adding banner:", error);
      toast.error("Failed to add banner");
    }
  };

  const handleDelete = async (id: string, bannerLocation: string) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    
    // Prevent deleting the last banner for a location
    const locationBanners = banners.filter(b => b.location === bannerLocation);
    if (locationBanners.length <= 1) {
      toast.error(`You cannot delete this banner. There must be at least one banner for ${bannerLocation}!`);
      return;
    }

    try {
      await deleteDoc(doc(db, "website_banners", id));
      toast.success("Banner deleted");
      fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  const moveBanner = async (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    
    // Swap order values
    const tempOrder = newBanners[index].order;
    newBanners[index].order = newBanners[newIndex].order;
    newBanners[newIndex].order = tempOrder;

    // Swap in array for immediate UI update
    const temp = newBanners[index];
    newBanners[index] = newBanners[newIndex];
    newBanners[newIndex] = temp;
    
    setBanners(newBanners);

    try {
      await updateDoc(doc(db, "website_banners", newBanners[index].id), { order: newBanners[index].order });
      await updateDoc(doc(db, "website_banners", newBanners[newIndex].id), { order: newBanners[newIndex].order });
    } catch (error) {
      toast.error("Failed to reorder");
      fetchBanners();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Website Banners</h1>
        <p className="text-gray-500 mt-1">Manage the slideshow banners on the homepage.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Banner</CardTitle>
          <CardDescription>Select an image from the gallery or paste a URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddBanner} className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <Label>Page Location (Required)</Label>
              <select 
                className="w-full border rounded px-3 py-2 bg-white"
                value={location}
                onChange={(e) => setLocation(e.target.value as "home" | "darshan" | "goshala")}
              >
                <option value="home">Homepage (Main Slideshow)</option>
                <option value="darshan">Daily Darshan Page</option>
                <option value="goshala">Goshala Page</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Banner Media (Required)</Label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant={mediaType === "image" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setMediaType("image")}
                    className={mediaType === "image" ? "bg-orange-500 hover:bg-orange-600" : ""}
                  >
                    Image Banner
                  </Button>
                  <Button 
                    type="button" 
                    variant={mediaType === "video" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setMediaType("video")}
                    className={mediaType === "video" ? "bg-orange-500 hover:bg-orange-600" : ""}
                  >
                    Video Banner
                  </Button>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      className="flex-1"
                      value={imageUrl} 
                      onChange={e => setImageUrl(e.target.value)} 
                      placeholder={mediaType === "video" ? "Paste Video URL (e.g. .mp4)" : "Paste Image URL"} 
                    />
                  </div>
                  <div className="mt-2">
                    <GalleryPicker 
                      onSelect={(items) => {
                        if (items.length > 0) {
                          const formatted = items.map(i => ({ 
                            url: i.url, 
                            type: (i.type === "video" ? "video" : "image") as "image"|"video"
                          }));
                          setSelectedMedia(formatted);
                          setImageUrl(formatted[0].url);
                          setMediaType(formatted[0].type);
                        }
                      }} 
                    />
                    {selectedMedia.length > 1 && (
                      <p className="text-sm text-blue-600 font-medium mt-2">
                        {selectedMedia.length} files selected (will create {selectedMedia.length} banners)
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-2">
                  {imageUrl && mediaType === "image" && selectedMedia.length <= 1 && (
                    <img src={imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded border" />
                  )}
                  {imageUrl && mediaType === "video" && (
                    <video src={imageUrl} className="w-32 h-20 object-cover rounded border bg-black" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (Optional)</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Welcome to ISKCON" />
              </div>
              <div className="space-y-2">
                <Label>Subtitle (Optional)</Label>
                <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Experience divine consciousness" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text (Optional)</Label>
                <Input value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="e.g. Donate Now" />
              </div>
              <div className="space-y-2">
                <Label>Button Link (Optional)</Label>
                <Input value={buttonLink} onChange={e => setButtonLink(e.target.value)} placeholder="e.g. /support-us" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Date / Expiry (Optional)</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="w-full max-w-xs"
              />
              <p className="text-xs text-gray-500">Banner will automatically hide after this date.</p>
            </div>

            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">Add Banner</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Current Banners</h2>
        {loading ? (
          <p>Loading banners...</p>
        ) : banners.length === 0 ? (
          <p className="text-gray-500">No banners added yet. The default temple image will be shown.</p>
        ) : (
          <div className="grid gap-4">
            {banners.map((banner, index) => (
              <Card key={banner.id} className="flex flex-row items-center p-4 gap-4">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => moveBanner(index, -1)} disabled={index === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveBanner(index, 1)} disabled={index === banners.length - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                {banner.mediaType === "video" ? (
                  <video src={banner.imageUrl} className="w-48 h-24 object-cover rounded border bg-black" />
                ) : (
                  <img src={banner.imageUrl} alt="Banner" className="w-48 h-24 object-cover rounded border" />
                )}
                
                <div className="flex-1">
                  <div className="flex gap-2 items-center mb-1">
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-semibold uppercase tracking-wider">
                      {banner.location === "home" ? "Homepage" : banner.location === "darshan" ? "Daily Darshan" : "Goshala"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{banner.title || "(No Title)"}</h3>
                  <p className="text-gray-500 text-sm">{banner.subtitle}</p>
                  {banner.buttonText && (
                    <div className="mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                      Button: {banner.buttonText} → {banner.buttonLink}
                    </div>
                  )}
                </div>

                <Button variant="destructive" size="icon" onClick={() => handleDelete(banner.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
