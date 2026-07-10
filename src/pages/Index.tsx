import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import ServiceTiles from "@/components/ServiceTiles";
import UpcomingEvents from "@/components/UpcomingEvents";
import VirtualTour from "@/components/VirtualTour";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <ServiceTiles />
        <UpcomingEvents />
        <VirtualTour />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
