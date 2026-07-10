import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Image as ImageIcon, Video, Heart, X, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: "image" | "video";
  createdAt: any;
}

export default function Gallery() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchMedia();
  }, []);

  const openMedia = (index: number) => {
    setInitialIndex(index);
    setCurrentIndex(index);
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const el = document.getElementById(`media-item-${initialIndex}`);
        if (el) el.scrollIntoView({ behavior: 'instant' });
      }, 50);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setCurrentIndex(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    const elements = document.querySelectorAll('.media-snap-item');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isOpen, media]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const gallerySnapshot = await getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc")));
      const videosSnapshot = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc")));
      
      const galleryData = gallerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "image" as const })) as MediaItem[];
      const videosData = videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "video" as const })) as MediaItem[];
      
      const combined = [...galleryData, ...videosData]
        .filter(item => item.category !== "Accommodation")
        .sort((a: any, b: any) => 
          (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
        );
      
      setMedia(combined);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast.error("Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 p-1">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                <img src="/src/assets/iskcon_logo.avif" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Temple Gallery</h1>
              <p className="text-gray-500">Glimpses of daily darshan, festivals, and kirtan.</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-gray-500">Loading gallery...</p>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border shadow-sm">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No media yet</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for new photos and videos.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
              {media.map((item, index) => (
                <div 
                  key={item.id} 
                  className="group relative break-inside-avoid bg-black overflow-hidden rounded-md shadow-sm cursor-pointer mb-4"
                  onClick={() => openMedia(index)}
                >
                  {item.type === "image" ? (
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-auto object-contain bg-black transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <video 
                      src={item.url} 
                      className="w-full h-auto object-contain bg-black transition-transform duration-300 group-hover:scale-105"
                      muted
                      loop
                      playsInline
                      onMouseOver={e => (e.target as HTMLVideoElement).play()}
                      onMouseOut={e => (e.target as HTMLVideoElement).pause()}
                    />
                  )}
                  
                  {/* Overlay for Play Icon */}
                  {item.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <PlayCircle className="w-16 h-16 text-white/80 drop-shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:text-white" strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Hover Overlay with Title */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 text-white">
                    <p className="font-medium truncate">{item.title}</p>
                    <div className="flex space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4 fill-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-full w-full h-[100dvh] p-0 overflow-y-scroll overflow-x-hidden snap-y snap-mandatory bg-black border-none shadow-none text-white [&>button]:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <DialogTitle className="sr-only">View full media</DialogTitle>
          <DialogDescription className="sr-only">View full media</DialogDescription>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="fixed top-4 right-4 z-50 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          {media.map((item, index) => {
            return (
              <div 
                key={item.id} 
                id={`media-item-${index}`}
                data-index={index}
                className="media-snap-item w-full h-[100dvh] snap-center snap-always flex items-center justify-center relative cursor-zoom-out"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsOpen(false);
                  }
                }}
              >
                {item.type === "image" ? (
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="max-w-full max-h-[100dvh] object-contain cursor-default"
                    loading="lazy"
                  />
                ) : (
                  <video 
                    src={item.url} 
                    className="max-w-full max-h-[100dvh] object-contain cursor-default"
                    controls
                    loop
                    playsInline
                    preload="metadata"
                    ref={(el) => {
                      if (el) {
                        if (index === currentIndex) {
                          el.play().catch(() => {});
                        } else {
                          el.pause();
                        }
                      }
                    }}
                  />
                )}
                
                <div className="absolute bottom-10 left-4 right-4 text-white drop-shadow-lg bg-gradient-to-t from-black/80 to-transparent p-4 rounded-xl max-w-2xl mx-auto">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                </div>
              </div>
            );
          })}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
