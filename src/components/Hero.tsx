import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-temple.jpg";

const Hero = () => {
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
          <Button variant="hero" size="lg">
            Learn More
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg">
            View Schedule
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
