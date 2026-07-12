import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Goshala = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary/5 py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
              Sri Krishna Balram Goshala
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Goshalas are protective shelters in India for cows, focusing on treating cows in accordance with Hindu philosophy.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg mx-auto">
              <p className="italic text-gray-700 bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500 mb-8">
                Lord Sri Krishna says in Srimad Bhagavatam, "I can be worshiped within the Cows by offerings of grass and other suitable grains and paraphernalia for the pleasure and health of the Cows, and one may worship me with in the Vaishnavas by offering loving friendship to them and honouring them in all respects."
              </p>

              <p className="mb-6">
                By serving the Cows one receives tremendous spiritual benefit. Feeding grains to the Cows, offering puja, or simply a scratch under the neck will please these peaceful personalities and attracts the attention of the supreme personality of Godhead.
              </p>
              
              <p className="mb-8 font-medium">
                Sri Krishna Balram Goshala is associated with the ISKCON temple in Nellore.
              </p>

              <h2 className="text-2xl font-bold mb-4 text-primary">Our Mission</h2>
              <ul className="list-disc pl-6 mb-8 space-y-2">
                <li>To propagate and promote love for the cow and its virtues.</li>
                <li>To make cow-protection a people's movement.</li>
                <li>To work for the protection and conservation of the cow.</li>
                <li>To campaign against the cruelty to the cow and its progeny.</li>
              </ul>

              <p className="mb-12">
                Bhagavad Geeta describes how Lord Krishna cared for the cows and calves every morning, by taking them to graze on the Govardhana hill. We should also try to serve the cows with similar attitude - by providing means for their food, shelter and medication.
              </p>

              <div className="bg-gray-50 p-8 rounded-xl border">
                <h3 className="text-xl font-bold mb-4">Contact for Goshala Seva</h3>
                <p className="mb-2">For more information on how you can support the Goshala, please contact us:</p>
                <p className="font-semibold text-lg">Phone: +91 9985058550</p>
                <p className="font-semibold text-lg">Email: sukadevaswami@gmail.com</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Goshala;
