import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Heart, HandHeart, Users } from "lucide-react";
import heroImage from "@/assets/hero-temple.jpg";

const SupportUs = () => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd as any);
    console.log("Volunteer registration:", data);
    alert("Thank you for registering — we will contact you soon.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section
          className="relative h-72 md:h-80 flex items-center justify-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-background/70" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Support Us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join us in devotional service and help spread Krishna consciousness.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-2xl md:text-3xl">Volunteer Registration</CardTitle>
                  <CardDescription>
                    Fill in your details and preferred seva. Our team will contact you soon.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="grid gap-5">
                    <div>
                      <Label htmlFor="vol-name">Name of volunteer</Label>
                      <Input id="vol-name" name="name" required placeholder="Full name" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="vol-email">Email Id</Label>
                        <Input id="vol-email" name="email" type="email" required placeholder="you@example.com" />
                      </div>

                      <div>
                        <Label htmlFor="vol-phone">Phone Number</Label>
                        <Input id="vol-phone" name="phone" type="tel" required placeholder="+91-XXXXXXXXXX" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="seva-category">Seva category</Label>
                        <Select>
                          <SelectTrigger id="seva-category" name="seva">
                            <SelectValue placeholder="Select seva category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="book">Book distribution</SelectItem>
                            <SelectItem value="harinam">Harinam sankirthan</SelectItem>
                            <SelectItem value="festival">Volunteer for festival services</SelectItem>
                            <SelectItem value="garland">Garland making</SelectItem>
                            <SelectItem value="kitchen">Kitchen service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="availability">Availability</Label>
                        <Select>
                          <SelectTrigger id="availability" name="availability">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekdays">Weekdays</SelectItem>
                            <SelectItem value="weekends">Weekends</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button type="submit" variant="hero" className="w-full md:w-auto">
                        Register for Seva
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                        <Heart className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Serve with Devotion</h3>
                        <p className="text-sm text-muted-foreground">Offer your time in Krishna's service with love and sincerity.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                        <HandHeart className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Meaningful Seva</h3>
                        <p className="text-sm text-muted-foreground">Choose from temple, festival, sankirtan, and kitchen activities.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Community Spirit</h3>
                        <p className="text-sm text-muted-foreground">Be part of a caring devotee community committed to service.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SupportUs;
