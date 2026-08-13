import { Link, useLocation } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useBranchPrefix } from "@/hooks/useBranchPrefix";

interface BranchSettings {
  name: string;
  phone?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  address?: string;
}

const Footer = () => {
  const location = useLocation();
  const branchPrefix = useBranchPrefix();
  const [settings, setSettings] = useState<BranchSettings>({
    name: "ISKCON Nellore",
    phone: "+91 12345 67890",
    email: "info@iskconnellore.org",
    address: "ISKCON Temple, Nellore, Andhra Pradesh, India",
    facebook: "",
    instagram: "",
    youtube: ""
  });

  useEffect(() => {
    const fetchBranchSettings = async () => {
      const branchSlug = branchPrefix.replace('/', '') || 'nellore';

      try {
        const docRef = doc(db, "branches", branchSlug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({
            name: data.name || prev.name,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            address: data.address || prev.address,
            facebook: data.facebook || prev.facebook,
            instagram: data.instagram || prev.instagram,
            youtube: data.youtube || prev.youtube
          }));
        }
      } catch (error) {
        console.error("Error fetching branch settings for footer:", error);
      }
    };
    fetchBranchSettings();
  }, [branchPrefix]);

  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">{settings.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Spreading Krishna consciousness through devotional service, education, and community outreach.
            </p>
            <div className="flex space-x-4">
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.youtube && (
                <a href={settings.youtube} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to={branchPrefix || "/"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to={`${branchPrefix}/darshan`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Daily Darshan
                </Link>
              </li>
              <li>
                <Link to={`${branchPrefix}/events`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Events & Programs
                </Link>
              </li>
              <li>
                <Link to={`${branchPrefix}/about`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to={`${branchPrefix}/darshan`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Daily Aarti</Link>
              </li>
              <li>
                <Link to={`${branchPrefix}/courses`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Bhagavad Gita Classes</Link>
              </li>
              <li>
                <Link to={`${branchPrefix}/events`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sunday Feast</Link>
              </li>
              <li>
                <Link to={`${branchPrefix}/support-us`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Volunteer Programs</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(settings.address || 'ISKCON Temple, Nellore')}`} target="_blank" rel="noreferrer" className="flex items-start space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>{settings.address}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${settings.phone}`} className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{settings.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>{settings.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {settings.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
