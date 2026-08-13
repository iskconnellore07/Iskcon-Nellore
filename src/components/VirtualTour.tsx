import { MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const VirtualTour = () => {
  const location = useLocation();
  const [mapLink, setMapLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const path = location.pathname.split('/')[1];
        const currentBranchId = path && path !== 'darshan' && path !== 'events' && path !== 'about' && path !== 'contact' && path !== 'admin' && path !== 'donate' ? path : 'nellore';
        
        const docRef = doc(db, "branches", currentBranchId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Fallback to Nellore's 360 map if Nellore branch, otherwise only show if configured
          if (data.map360Link) {
            setMapLink(data.map360Link);
          } else if (currentBranchId === 'nellore') {
            setMapLink("https://www.google.com/maps/embed?pb=!4v1783657553404!6m8!1m7!1sCAoSHENJQUJJaENBU2o4NnN6LXJiODVDOFhPTUNsZlY.!2m2!1d14.42428407671149!2d79.97647789849009!3f323.2195147703384!4f-2.4778865911378745!5f0.7820865974627469");
          } else {
            setMapLink(null);
          }
        }
      } catch (error) {
        console.error("Error fetching map link:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [location.pathname]);

  if (isLoading || !mapLink) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Virtual Temple Tour</h2>
          <p className="text-gray-600 flex items-center justify-center">
            <MapPin className="w-4 h-4 mr-1 text-orange-500" />
            Take an immersive 360° walk through our Temple
          </p>
        </div>
        
        <div className="w-full rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-gray-100 max-w-4xl mx-auto ring-1 ring-gray-200">
          <iframe 
            src={mapLink} 
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
