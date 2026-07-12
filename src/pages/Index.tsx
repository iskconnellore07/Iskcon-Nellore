import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DynamicBanner } from "@/components/DynamicBanner";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-temple.jpg";
import { Link } from "react-router-dom";
import ServiceTiles from "@/components/ServiceTiles";
import UpcomingEvents from "@/components/UpcomingEvents";
import VirtualTour from "@/components/VirtualTour";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <DynamicBanner location="home">
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
        </DynamicBanner>
        <ServiceTiles />
        <UpcomingEvents />
        <VirtualTour />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
