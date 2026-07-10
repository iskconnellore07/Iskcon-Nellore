import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Book, Globe } from "lucide-react";
import heroImage from "@/assets/hero-temple.jpg";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Devotion",
      description: "Cultivating love and devotion for Lord Krishna through bhakti yoga",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a spiritual community based on love, respect, and service",
    },
    {
      icon: Book,
      title: "Education",
      description: "Sharing Vedic wisdom and teachings from Bhagavad Gita and Srimad Bhagavatam",
    },
    {
      icon: Globe,
      title: "Service",
      description: "Serving humanity through food distribution, education, and spiritual guidance",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section
          className="relative h-80 flex items-center justify-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-background/70" />
          <div className="relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About ISKCON Nellore</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Spreading Krishna consciousness since establishment
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="mb-12">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  ISKCON Nellore is part of the International Society for Krishna Consciousness,
                  founded by His Divine Grace A.C. Bhaktivedanta Swami Prabhupada in 1966. 
                  Our mission is to propagate Krishna consciousness throughout society and to educate 
                  all people in the techniques of spiritual life.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We strive to bring people closer to Lord Krishna through various spiritual practices 
                  including devotional service, deity worship, distribution of sanctified food (prasadam), 
                  and the study and propagation of the Bhagavad Gita and other Vedic scriptures.
                </p>
              </CardContent>
            </Card>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <Card key={index} className="hover:shadow-elevated transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                            <Icon className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                            <p className="text-sm text-muted-foreground">{value.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Card>
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">History</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  ISKCON Nellore has been serving the spiritual needs of the community for many years. 
                  The temple was established to provide a sacred space for worship, learning, and community 
                  gathering in the heart of Nellore.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, we continue to grow and serve thousands of devotees and visitors who come to 
                  experience the divine atmosphere, participate in festivals, attend classes, and receive 
                  spiritual guidance. Our temple stands as a beacon of hope and spiritual enlightenment 
                  in the region.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
