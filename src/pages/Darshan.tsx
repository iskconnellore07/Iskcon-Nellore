import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Video } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import darshanImage from "@/assets/darshan-altar.jpg";
import eventKirtan from "@/assets/event-kirtan.jpg";
import heroTemple from "@/assets/hero-temple.jpg";

const Darshan = () => {
  const schedule = [
    { time: "4:30 AM", event: "Mangala Aarti" },
    { time: "7:00 AM", event: "Darshan Aarti" },
    { time: "12:30 PM", event: "Raj Bhoga Aarti" },
    { time: "7:00 PM", event: "Sandhya Aarti" },
    { time: "8:30 PM", event: "Shayan Aarti" },
  ];

  const images = [darshanImage, eventKirtan, heroTemple];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Daily Darshan</h1>
              <p className="text-lg text-muted-foreground text-center mb-8">
                Experience the divine presence of Lord Krishna through daily worship and aarti
              </p>

              <Card className="mb-8">
                {/* Carousel that fetches images from assets */}
                <Carousel className="relative">
                  <CarouselContent className="w-full">
                    {images.map((src, idx) => (
                      <CarouselItem key={idx}>
                        <div className="aspect-video overflow-hidden rounded-t-lg">
                          <img src={src} alt={`Darshan ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="mr-2 h-5 w-5 text-primary" />
                    Live Darshan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Join us for live darshan during aarti times. Experience the divine atmosphere from anywhere in the world.
                  </p>
                  <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Live streaming available during all aarti times. Check the schedule below for timing.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    Daily Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {schedule.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-card rounded-lg hover:shadow-soft transition-all"
                      >
                        <span className="font-semibold text-lg">{item.event}</span>
                        <span className="text-primary font-medium">{item.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Timing may vary on special occasions and festivals. 
                      Please check our events calendar for updates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Darshan;
