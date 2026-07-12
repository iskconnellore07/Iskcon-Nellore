import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import heroImage from "@/assets/hero-temple.jpg";
import { Link } from "react-router-dom";

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  mediaType?: "image" | "video";
}

const Hero = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "website_banners"), orderBy("order", "asc")));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
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
    // Fallback to static hero
    return (
      <section className="relative h-[250px] md:h-[300px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/90" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Welcome to ISKCON Nellore
          </h1>
          <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
            Experience divine consciousness through devotion, service, and spiritual wisdom. 
            Join us in our journey of Krishna consciousness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/about">
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/darshan">View Schedule</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[250px] md:h-[400px] w-full overflow-hidden">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full h-full">
        <CarouselContent className="h-full">
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className="relative h-full basis-full">
              {banner.mediaType === "video" ? (
                <video 
                  src={banner.imageUrl} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${banner.imageUrl})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
              
              <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center animate-fade-in">
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
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

export default Hero;
