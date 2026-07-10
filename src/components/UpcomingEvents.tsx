import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface Festival {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  imageUrl?: string;
  formId?: string;
}

const UpcomingEvents = () => {
  const [events, setEvents] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "festivals"), orderBy("date", "asc")));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Festival[];
        
        // Filter for upcoming events only (or just show the next 3)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = data.filter(event => new Date(event.date) >= today).slice(0, 3);
        
        // If no upcoming, just show the last 3 added to avoid empty states
        if (upcoming.length === 0 && data.length > 0) {
          setEvents(data.slice(-3).reverse());
        } else {
          setEvents(upcoming);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground">Join us for spiritual programs and celebrations</p>
          </div>
          <Link to="/events">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-500">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500">No upcoming events scheduled at this time.</p>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-elevated transition-all duration-300">
                <div className="h-48 overflow-hidden bg-orange-50 flex items-center justify-center">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  ) : (
                    <Calendar className="w-16 h-16 text-orange-200" />
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">{event.title}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-3 text-primary" />
                      <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-3 text-primary" />
                        <span>{event.time}</span>
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-3 text-primary" />
                      <span>{event.location || "ISKCON Nellore"}</span>
                    </div>
                  </div>
                  {event.formId && (
                    <Button className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white" asChild>
                      <Link to={`/forms/${event.formId}`}>Register Now</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
