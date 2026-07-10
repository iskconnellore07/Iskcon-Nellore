import { MapPin } from "lucide-react";

const VirtualTour = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Virtual Temple Tour</h2>
          <p className="text-gray-600 flex items-center justify-center">
            <MapPin className="w-4 h-4 mr-1 text-orange-500" />
            Take an immersive 360° walk through ISKCON Nellore
          </p>
        </div>
        
        <div className="w-full rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-gray-100 max-w-4xl mx-auto ring-1 ring-gray-200">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!4v1783657553404!6m8!1m7!1sCAoSHENJQUJJaENBU2o4NnN6LXJiODVDOFhPTUNsZlY.!2m2!1d14.42428407671149!2d79.97647789849009!3f323.2195147703384!4f-2.4778865911378745!5f0.7820865974627469" 
            width="100%" 
            height="400" 
            style={{ border: 0, pointerEvents: "auto" }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full bg-gray-200"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default VirtualTour;
