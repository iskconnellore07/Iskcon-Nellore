import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Image as ImageIcon, Video } from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  title: string;
}

interface GalleryPickerProps {
  onSelect: (media: { url: string, type: "image" | "video" | "360" }[]) => void;
  maxSelection?: number;
}

export function GalleryPicker({ onSelect, maxSelection = 5 }: GalleryPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const [is360Map, setIs360Map] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const gSnap = await getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc")));
      const vSnap = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc")));
      
      const gData = gSnap.docs.map(d => ({ id: d.id, ...d.data(), type: "image" as const })) as MediaItem[];
      const vData = vSnap.docs.map(d => ({ id: d.id, ...d.data(), type: "video" as const })) as MediaItem[];
      
      setMedia([...gData, ...vData]);
    } catch (error) {
      console.error("Failed to load gallery", error);
    }
    setLoading(false);
  };

  const toggleSelect = (item: MediaItem) => {
    if (selected.find(s => s.id === item.id)) {
      setSelected(selected.filter(s => s.id !== item.id));
    } else {
      if (selected.length >= maxSelection) {
        alert(`You can only select up to ${maxSelection} items.`);
        return;
      }
      setSelected([...selected, item]);
    }
  };

  const handleConfirm = () => {
    const finalSelection = selected.map(s => ({
      url: s.url,
      type: (s.type === "image" && is360Map[s.id]) ? "360" : s.type
    }));
    onSelect(finalSelection);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open && media.length === 0) fetchMedia();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">Choose from Gallery</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <DialogTitle>Select Media from Gallery</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center">Loading gallery...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {media.map(item => {
              const isSelected = !!selected.find(s => s.id === item.id);
              return (
                <div 
                  key={item.id} 
                  className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-4 ring-primary' : ''}`}
                >
                  <div onClick={() => toggleSelect(item)} className="aspect-square bg-gray-100 flex items-center justify-center">
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <Video className="w-8 h-8 mb-2" />
                        <span className="text-xs text-center px-2">{item.title}</span>
                      </div>
                    )}
                  </div>
                  
                  {isSelected && item.type === "image" && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 flex items-center gap-2">
                      <Checkbox 
                        id={`360-${item.id}`}
                        checked={is360Map[item.id] || false}
                        onCheckedChange={(c) => setIs360Map({...is360Map, [item.id]: !!c})}
                      />
                      <label htmlFor={`360-${item.id}`} className="text-white text-xs font-medium cursor-pointer">
                        Is 360° Photo?
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center border-t pt-4">
          <span className="text-sm text-gray-600">{selected.length} / {maxSelection} selected</span>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={selected.length === 0}>Confirm Selection</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
