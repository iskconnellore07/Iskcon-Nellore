import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Eye, Heart, Users, ShoppingBag, Book, HandHeart, Gift, Image } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Eye,
    title: "Daily Darshan",
    description: "Experience divine darshan of the deities",
    link: "/darshan",
    color: "text-primary",
  },
  {
    icon: Calendar,
    title: "Calendar",
    description: "View upcoming festivals and daily programs",
    link: "/events",
    color: "text-accent",
  },
  {
    icon: Heart,
    title: "Support Us",
    description: "Contribute to our mission and service",
    link: "/support-us",
    color: "text-destructive",
  },
  {
    icon: Users,
    title: "Accommodation",
    description: "Book your stay at our Guest House",
    link: "/accommodation",
    color: "text-primary",
  },
  {
    icon: Image,
    title: "Gallery",
    description: "View photos and videos of Darshan & Festivals",
    link: "/gallery",
    color: "text-accent",
  },
  {
    icon: Book,
    title: "Courses",
    description: "Learn Bhagavad Gita and Vedic wisdom",
    link: "/courses",
    color: "text-primary",
  },
  {
    icon: HandHeart,
    title: "Annadaan",
    description: "Food distribution service",
    link: "/annadaan",
    color: "text-destructive",
  },
  {
    icon: Gift,
    title: "Nitya Seva",
    description: "Daily worship sponsorship",
    link: "/nitya-seva",
    color: "text-accent",
  },
];

const ServiceTiles = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore the various ways to engage in devotional service and spiritual growth
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Link key={index} to={service.link}>
                <Card className="h-full hover:shadow-elevated transition-all duration-300 cursor-pointer group bg-gradient-card">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className={`h-7 w-7 ${service.color}`} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServiceTiles;
