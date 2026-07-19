import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE_URL } from "@/config";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setStatus("Please fill in all required fields.");
      return;
    }
    
    setIsSubmitting(true);
    setStatus("Sending message...");
    
    try {
      const response = await fetch(`${API_BASE_URL}/submit-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      
      if (response.ok) {
        setStatus("Message sent successfully!");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        setStatus("Failed to send message. Please try again later.");
      }
    } catch (error) {
      setStatus("Network error. Please make sure the server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get in touch with us for any queries or to plan your visit
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Send us a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div>
                        <label htmlFor="name" className="text-sm font-medium mb-2 block">
                          Name *
                        </label>
                        <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-sm font-medium mb-2 block">
                          Email *
                        </label>
                        <Input id="email" type="email" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="phone" className="text-sm font-medium mb-2 block">
                          Phone (Optional)
                        </label>
                        <Input id="phone" type="tel" placeholder="+91 12345 67890" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="message" className="text-sm font-medium mb-2 block">
                          Message *
                        </label>
                        <Textarea
                          id="message"
                          placeholder="How can we help you?"
                          rows={5}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                      </div>
                      {status && (
                        <div className={`text-sm ${status.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                          {status}
                        </div>
                      )}
                      <Button variant="hero" className="w-full" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Address</h3>
                        <p className="text-sm text-muted-foreground">
                          ISKCON Temple<br />
                          Nellore, Andhra Pradesh<br />
                          India - 524004
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Phone</h3>
                        <p className="text-sm text-muted-foreground">
                          +91 12345 67890<br />
                          +91 98765 43210
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Email</h3>
                        <p className="text-sm text-muted-foreground">
                          info@iskconnellore.org<br />
                          contact@iskconnellore.org
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Temple Timings</h3>
                        <p className="text-sm text-muted-foreground">
                          Daily: 4:30 AM - 9:00 PM<br />
                          Sundays: 4:30 AM - 9:30 PM
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3767.1!2d73.0!3d19.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDE4JzAwLjAiTiA3M8KwMDAnMDAuMCJF!5e0!3m2!1sen!2sin!4v1234567890"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
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

export default Contact;
