import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, GripVertical } from "lucide-react";
import { GalleryPicker } from "@/components/admin/GalleryPicker";

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
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
    if (!imageUrl) {
      toast.error("Please provide an image URL or select from Gallery");
      return;
    }

    try {
      const newOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 0;
      await addDoc(collection(db, "website_banners"), {
        imageUrl,
        title,
        subtitle,
        buttonText,
        buttonLink,
        order: newOrder,
        createdAt: serverTimestamp()
      });
      toast.success("Banner added successfully!");
      setImageUrl("");
      setTitle("");
      setSubtitle("");
      setButtonText("");
      setButtonLink("");
      fetchBanners();
    } catch (error) {
      console.error("Error adding banner:", error);
      toast.error("Failed to add banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteDoc(doc(db, "website_banners", id));
      toast.success("Banner deleted");
      fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  const moveBanner = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;

    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap order values
    const tempOrder = newBanners[index].order;
    newBanners[index].order = newBanners[targetIndex].order;
    newBanners[targetIndex].order = tempOrder;

    // Swap in array for immediate UI update
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;
    
    setBanners(newBanners);

    try {
      await updateDoc(doc(db, "website_banners", newBanners[index].id), { order: newBanners[index].order });
      await updateDoc(doc(db, "website_banners", newBanners[targetIndex].id), { order: newBanners[targetIndex].order });
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
              <Label>Banner Image (Required)</Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input 
                    value={imageUrl} 
                    onChange={e => setImageUrl(e.target.value)} 
                    placeholder="https://..." 
                    required 
                  />
                  <div className="mt-2">
                    <GalleryPicker 
                      onSelect={(items) => items.length > 0 && setImageUrl(items[0].url)} 
                      maxSelection={1} 
                    />
                  </div>
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded border" />
                )}
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

            <Button type="submit">Add Banner</Button>
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
                  <Button variant="ghost" size="icon" onClick={() => moveBanner(index, 'up')} disabled={index === 0}>
                    <GripVertical className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveBanner(index, 'down')} disabled={index === banners.length - 1}>
                    <GripVertical className="w-4 h-4" />
                  </Button>
                </div>
                
                <img src={banner.imageUrl} alt="Banner" className="w-48 h-24 object-cover rounded border" />
                
                <div className="flex-1">
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
