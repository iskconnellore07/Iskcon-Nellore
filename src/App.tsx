import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Darshan from "./pages/Darshan";
import Events from "./pages/Events";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SupportUs from "./pages/SupportUs";
import Festivals from "./pages/Festivals";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";
import Gallery from "./pages/Gallery";
import Annadaan from "./pages/Annadaan";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import VolunteerPage from "./pages/Volunteer";
import AdminLogin from "./pages/admin/Login";
import DashboardOverview from "./pages/admin/DashboardOverview";
import ManageLogins from "./pages/admin/ManageLogins";
import DevoteeAdminPage from "./pages/DevoteeAdmin";
import CourseManager from "./pages/admin/CourseManager";
import GalleryManager from "./pages/admin/GalleryManager";
import FestivalManager from "./pages/admin/FestivalManager";
import DashboardLayout from "./pages/admin/DashboardLayout";
import BannerManager from "./pages/admin/BannerManager";
import FormManager from "./pages/admin/FormManager";
import FormResponses from "./pages/admin/FormResponses";
import FormPage from "./pages/FormPage";
import AuditLogs from "./pages/admin/AuditLogs";
import Accommodation from "./pages/Accommodation";
import AccommodationManager from "./pages/admin/AccommodationManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/darshan" element={<Darshan />} />
          <Route path="/events" element={<Events />} />
          <Route path="/festivals" element={<Festivals />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/annadaan" element={<Annadaan />} />
          <Route path="/support-us" element={<SupportUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/accommodation" element={<Accommodation />} />
          <Route path="/forms/:formId" element={<FormPage />} />
          
          {/* ADMIN ROUTES */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="devotees" element={<DevoteeAdminPage />} />
            <Route path="logins" element={<ManageLogins />} />
            <Route path="courses" element={<CourseManager />} />
            <Route path="gallery" element={<GalleryManager />} />
            <Route path="banners" element={<BannerManager />} />
            <Route path="festivals" element={<FestivalManager />} />
            <Route path="forms" element={<FormManager />} />
            <Route path="form-responses/:formId" element={<FormResponses />} />
            <Route path="accommodation" element={<AccommodationManager />} />
            <Route path="audit" element={<AuditLogs />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
