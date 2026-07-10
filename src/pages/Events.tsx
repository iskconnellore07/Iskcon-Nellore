import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin, Clock, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

import eventImage from "@/assets/event-kirtan.jpg";

// Sync with Festivals.tsx
const FESTIVALS_2026 = [
  {
    title: "Nityananda Trayodashi",
    date: new Date("2026-01-31"),
    description: "Appearance day of Lord Nityananda. Fasting till noon.",
    time: "All Day Event",
  },
  {
    title: "Gaura Purnima",
    date: new Date("2026-03-03"),
    description: "Appearance day of Lord Chaitanya Mahaprabhu. Fasting till moonrise.",
    time: "All Day Event",
  },
  {
    title: "Rama Navami",
    date: new Date("2026-03-27"),
    description: "Appearance day of Lord Ramachandra. Fasting till sunset.",
    time: "All Day Event",
  },
  {
    title: "Narasimha Jayanthi",
    date: new Date("2026-04-30"),
    description: "Appearance day of Lord Narasimhadeva. Fasting till dusk.",
    time: "All Day Event",
  },
  {
    title: "Balarama Jayanthi",
    date: new Date("2026-08-28"),
    description: "Appearance day of Lord Balarama. Fasting till noon.",
    time: "All Day Event",
  },
  {
    title: "Janmashtami",
    date: new Date("2026-09-04"),
    description: "Grand celebration of Lord Krishna's appearance day with special programs, kirtan, and midnight aarti.",
    time: "All Day Event",
  },
  {
    title: "Radhashtami",
    date: new Date("2026-09-19"),
    description: "Appearance day of Srimati Radharani. Fasting till noon.",
    time: "All Day Event",
  },
  {
    title: "Karthika Deepam",
    date: new Date("2026-11-09"),
    description: "Festival of offering lamps to Lord Damodara during the auspicious month of Karthika.",
    time: "Evening",
  },
];

const WEEKLY_EVENTS = [
  {
    title: "Sunday Feast Program",
    description: "Join us for prasadam, kirtan, and discourse on Bhagavad Gita. A spiritual feast for the soul.",
    time: "Every Sunday, 11:00 AM - 2:00 PM",
    location: "ISKCON Temple Main Hall",
    image: eventImage,
  },
  {
    title: "Bhagavad Gita Study Circle",
    description: "Daily classes on the timeless wisdom of Bhagavad Gita. Learn practical spirituality for modern life.",
    time: "Daily, 7:00 PM - 8:00 PM",
    location: "Temple Hall",
    image: eventImage,
  },
];

export default function Events() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-09-04")); // Default to Janmashtami month
  const [month, setMonth] = useState<Date>(new Date("2026-09-01"));

  // Check if a date has a festival
  const getFestivalForDate = (day: Date) => {
    return FESTIVALS_2026.find(f => isSameDay(f.date, day));
  };

  const selectedFestival = getFestivalForDate(selectedDate);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Vaishnava Calendar & Events</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our upcoming festivals and daily spiritual programs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Calendar Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                      Festival Calendar
                    </CardTitle>
                    <CardDescription>Select a highlighted date to view details.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center pb-6">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(day) => {
                        if (day) setSelectedDate(day);
                      }}
                      month={month}
                      onMonthChange={setMonth}
                      modifiers={{
                        festival: FESTIVALS_2026.map(f => f.date),
                      }}
                      modifiersStyles={{
                        festival: {
                          fontWeight: 'bold',
                          backgroundColor: '#f97316', // Orange theme
                          color: 'white',
                          borderRadius: '100%'
                        }
                      }}
                      className="border rounded-md shadow-sm p-3 bg-card"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Event Details Area */}
              <div className="lg:col-span-2 space-y-6">
                {selectedFestival ? (
                  <Card className="border-primary/20 shadow-md bg-orange-50/30">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-primary mb-1 uppercase tracking-wider">
                            {format(selectedFestival.date, "EEEE, MMMM do, yyyy")}
                          </div>
                          <CardTitle className="text-3xl">{selectedFestival.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-lg text-muted-foreground">{selectedFestival.description}</p>
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        {selectedFestival.time}
                      </div>
                      <div className="flex items-center text-sm font-medium">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        ISKCON Nellore Temple
                      </div>
                      <div className="pt-4">
                        <Button asChild size="lg" className="w-full sm:w-auto font-semibold">
                          <Link to="/festivals">Book Festival Seva / Slot</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed border-2 flex items-center justify-center h-48 bg-transparent shadow-none">
                    <div className="text-center text-muted-foreground">
                      <p>No major festival on {format(selectedDate, "MMMM do, yyyy")}.</p>
                      <p className="text-sm mt-2">Select a highlighted date on the calendar.</p>
                    </div>
                  </Card>
                )}

                <h3 className="text-2xl font-bold mt-12 mb-6">Regular Programs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {WEEKLY_EVENTS.map((event, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <Clock className="h-3 w-3 mr-2 text-primary" />
                            <span className="font-medium">{event.time}</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <MapPin className="h-3 w-3 mr-2 text-primary" />
                            <span className="font-medium">{event.location}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
