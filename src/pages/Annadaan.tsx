import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { HandHeart, Quote, Phone, Mail } from "lucide-react";

export default function Annadaan() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        {/* Hero Section */}
        <section className="bg-primary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-primary text-primary-foreground rounded-full mb-6">
              <HandHeart className="h-10 w-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ANNAMRITA - ISKCON Food Relief Foundation</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Food for Life (FFL) is the world’s largest vegetarian food distribution program serving millions of meals daily.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl space-y-8">
            <Card className="border-none shadow-sm">
              <CardContent className="p-8 space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  With roots in the Vaishnava culture of charity and the distribution of pure food to all, the project is a modern day revival of the ancient culture of hospitality and a belief in the equality of all beings. Food For Life has been lauded by The New York Times and government relief agencies worldwide for its efforts worldwide.
                </p>

                <p>
                  <strong className="text-foreground">Srila Prabhupada</strong>, ISKCON’s Founder-Acharya, is the inspiration behind Food for Life. He stated in 1972 that <em className="text-foreground font-medium">“No one within ten miles of an ISKCON temple should go hungry.”</em> Since that time ISKCON devotees have expanded a global network of free food restaurants, mobile services and relief programs establishing daily delivery routes in many large cities around the world.
                </p>

                <p>
                  Currently, Food for Life’s largest programs are in India. More than 1.2 million school children are served a multi-course hot, healthy, and tasty lunch six days a week in cities throughout the sub-continent, through a partnership with the Indian government for the ‘Mid-day Meal’ scheme. Education administrators have stated that the ISKCON Food for Life program, known locally as Annamrita, actually facilitates many poor children to attend school. Otherwise, they explain, without the program the children would be forced to work as child laborers to earn enough to eat for the day.
                </p>

                <p>
                  Food for Life volunteers also respond to natural disasters, bringing food and hope into the lives of people affected by events such as the wars in Bosnia and Chechnya, the Indian Ocean Tsunami, the typhoon Haiyan, and Hurricane Katrina.
                </p>

                {/* Quote Block */}
                <blockquote className="border-l-4 border-primary pl-6 py-4 my-8 bg-primary/5 rounded-r-lg italic text-foreground">
                  <Quote className="h-8 w-8 text-primary/40 mb-2" />
                  “(ISKCON) movement, Just imagine…within a short span of time…today I am told ISKCON movement runs more than 600 centres all over the world, everyday in India it provides food to over one million children…healthy food…and the message…of love, compassion, which is inherent in Indian civilization.”
                  <footer className="mt-4 font-semibold text-primary not-italic">
                    — Pranab Mukherjee, President of India
                  </footer>
                </blockquote>

                {/* Nellore Local Impact */}
                <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg text-center mt-8">
                  <h3 className="text-2xl font-bold text-orange-800 mb-2">Local Impact</h3>
                  <p className="text-xl text-orange-900 font-medium">
                    ISKCON Nellore serves <span className="font-bold text-3xl mx-2">25,000</span> children daily in the afternoon through ISKCON Food Relief Foundation.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-semibold mb-6">Want to Contribute or Learn More?</h3>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">Call Us</p>
                      <p className="font-semibold text-lg">+91 9985058550</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-full text-primary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">Email Us</p>
                      <p className="font-semibold text-lg">sukadevaswami@gmail.com</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
