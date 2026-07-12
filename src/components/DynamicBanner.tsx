import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Link } from "react-router-dom";

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  mediaType?: "image" | "video";
  location: string;
}

interface DynamicBannerProps {
  location: "home" | "darshan" | "goshala";
  children?: React.ReactNode;
}

export const DynamicBanner = ({ location, children }: DynamicBannerProps) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "website_banners")));
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
        
        // Filter by location, sort, and exclude expired banners
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        data = data
          .filter(b => b.location === location)
          .filter(b => !b.endDate || new Date(b.endDate) >= now)
          .sort((a, b) => a.order - b.order);
          
        setBanners(data);
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!api || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000); // Auto-slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [api, banners.length]);

  if (banners.length === 0) {
    // Fallback to static hero/header provided by parent
    return <>{children}</>;
  }

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className="relative basis-full flex items-center justify-center">
              {banner.mediaType === "video" ? (
                <video 
                  src={banner.imageUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full max-h-[75vh] object-contain"
                />
              ) : (
                <img 
                  src={banner.imageUrl}
                  alt={banner.title || "Banner"}
                  className="w-full max-h-[75vh] object-contain"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70 pointer-events-none" />
              
              <div className="absolute inset-0 z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center animate-fade-in pointer-events-none">
                {banner.title && (
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-md">
                    {banner.title}
                  </h1>
                )}
                {banner.subtitle && (
                  <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto drop-shadow-sm">
                    {banner.subtitle}
                  </p>
                )}
                {banner.buttonText && banner.buttonLink && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
                    <Button variant="hero" size="lg" asChild>
                      {banner.buttonLink.startsWith('http') ? (
                        <a href={banner.buttonLink} target="_blank" rel="noopener noreferrer">
                          {banner.buttonText}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </a>
                      ) : (
                        <Link to={banner.buttonLink}>
                          {banner.buttonText}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};
