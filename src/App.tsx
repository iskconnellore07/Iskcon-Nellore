import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import BranchLanding from "./pages/BranchLanding";
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
import ReceiptDownload from "./pages/ReceiptDownload";
import Goshala from "./pages/Goshala";
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
import OfflineDonations from "./pages/admin/OfflineDonations";
import FormManager from "./pages/admin/FormManager";
import FormResponses from "./pages/admin/FormResponses";
import FormPage from "./pages/FormPage";
import AuditLogs from "./pages/admin/AuditLogs";
import Accommodation from "./pages/Accommodation";
import AccommodationManager from "./pages/admin/AccommodationManager";
import BranchManager from "./pages/admin/BranchManager";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const GlobalScrollReset = () => {
  const location = useLocation();
  useEffect(() => {
    document.body.style.pointerEvents = "auto";
    document.body.style.overflow = "auto";
  }, [location.pathname]);
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlobalScrollReset />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index branch="Nellore" />} />
          <Route path="/:branch" element={<BranchLanding />} />
          <Route path="/about" element={<About />} />
          <Route path="/darshan" element={<Darshan />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support-us" element={<SupportUs />} />
          <Route path="/festivals" element={<Festivals />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/annadaan" element={<Annadaan />} />
          <Route path="/goshala" element={<Goshala />} />
          <Route path="/receipt/:orderId" element={<ReceiptDownload />} />
          <Route path="/accommodation" element={<Accommodation />} />

          {/* Branch-scoped public routes */}
          <Route path="/:branch/about" element={<About />} />
          <Route path="/:branch/darshan" element={<Darshan />} />
          <Route path="/:branch/events" element={<Events />} />
          <Route path="/:branch/contact" element={<Contact />} />
          <Route path="/:branch/support-us" element={<SupportUs />} />
          <Route path="/:branch/festivals" element={<Festivals />} />
          <Route path="/:branch/courses" element={<Courses />} />
          <Route path="/:branch/gallery" element={<Gallery />} />
          <Route path="/:branch/annadaan" element={<Annadaan />} />
          <Route path="/:branch/goshala" element={<Goshala />} />
          <Route path="/:branch/accommodation" element={<Accommodation />} />
          
          <Route path="/form/:slug" element={<FormPage />} />

          {/* Protected Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<DashboardOverview />} />
            <Route path="users" element={<ManageLogins />} />
            <Route path="devotees" element={<DevoteeAdminPage />} />
            <Route path="courses" element={<CourseManager />} />
            <Route path="gallery" element={<GalleryManager />} />
            <Route path="calendar" element={<FestivalManager />} />
            <Route path="banners" element={<BannerManager />} />
            <Route path="offline-donations" element={<OfflineDonations />} />
            <Route path="forms" element={<FormManager />} />
            <Route path="forms/:formId/responses" element={<FormResponses />} />
            <Route path="accommodation" element={<AccommodationManager />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="branches" element={<BranchManager />} />
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
