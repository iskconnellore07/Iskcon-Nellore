import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, X, BookHeart, Image, Calendar, AlertCircle, PlaySquare, FileText, ShieldAlert, Home, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

export default function DashboardLayout() {
  const { user, role, branchId, dashboardBranchId, setDashboardBranchId, permissions, isActive, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'super_admin' || role === 'superadmin') {
      const fetchBranches = async () => {
        try {
          const snapshot = await getDocs(query(collection(db, "branches"), orderBy("createdAt", "asc")));
          setBranches(
            snapshot.docs
              .filter(doc => doc.data().type !== 'external')
              .map(doc => ({ id: doc.id, name: doc.data().name }))
          );
        } catch (e) {
          console.error(e);
        }
      };
      fetchBranches();
    }
  }, [role]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const checkAccess = (module: string) => {
    if (role === "super_admin" || role === "superadmin") return true; // Super Admin sees all

    // If no permissions object exists, deny by default
    if (!permissions || !permissions[module]?.hasAccess) return false;
    
    const expiresAt = permissions[module]?.expiresAt;
    if (expiresAt) {
      return new Date(expiresAt) > new Date();
    }
    return true; // Lifetime
  };

  const navigation = [
    { name: "Overview", href: "/admin/overview", icon: LayoutDashboard, show: checkAccess('overview') },
    { name: "Branch Manager", href: "/admin/branches", icon: Home, show: (role === "super_admin" || role === "superadmin") && (!branchId || branchId === 'nellore') },
    { name: "Devotee Management", href: "/admin/devotees", icon: Users, show: checkAccess('devotees') },
    { name: "Manage Logins", href: "/admin/users", icon: UserPlus, show: role === "super_admin" || role === "superadmin" },
    { name: "Course Manager", href: "/admin/courses", icon: PlaySquare, show: checkAccess('courses') },
    { name: "Website Banners", href: "/admin/banners", icon: Image, show: checkAccess('banners') },
    { name: "Gallery Manager", href: "/admin/gallery", icon: Image, show: checkAccess('gallery') },
    { name: "Calendar & Festivals", href: "/admin/calendar", icon: Calendar, show: checkAccess('calendar') },
    { name: "Accommodation", href: "/admin/accommodation", icon: Home, show: checkAccess('accommodation') || role === 'admin' || role === 'super_admin' || role === 'superadmin' },
    { name: "Form Builder", href: "/admin/forms", icon: FileText, show: checkAccess('calendar') || role === 'admin' || role === 'super_admin' || role === 'superadmin' },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert, show: role === "super_admin" || role === "superadmin" },
  ].filter(item => item.show);

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-3xl font-bold text-red-600">Account Suspended</h2>
        <p className="text-gray-600 mt-2 text-center max-w-md">
          Your access to the Admin Portal has been temporarily paused. Please contact the Super Admin for assistance.
        </p>
        <Button className="mt-6" variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  // Security Check: Enforce route-level protection
  // If user navigates directly to a blocked URL (or default /admin/dashboard), redirect them.
  const currentPath = location.pathname;
  
  if (currentPath === "/admin" || currentPath === "/admin/dashboard") {
    if (!checkAccess('overview') && navigation.length > 0) {
      return <Navigate to={navigation[0].href} replace />;
    }
  }

  // General Access Protection for any other blocked route
  const currentNav = [
    { name: "Overview", href: "/admin/overview", show: checkAccess('overview') },
    { name: "Branch Manager", href: "/admin/branches", show: (role === "super_admin" || role === "superadmin") && (!branchId || branchId === 'nellore') },
    { name: "Devotee Management", href: "/admin/devotees", show: checkAccess('devotees') },
    { name: "Manage Logins", href: "/admin/users", show: role === "super_admin" || role === "superadmin" },
    { name: "Course Manager", href: "/admin/courses", show: checkAccess('courses') },
    { name: "Gallery Manager", href: "/admin/gallery", show: checkAccess('gallery') },
    { name: "Calendar & Festivals", href: "/admin/calendar", show: checkAccess('calendar') },
    { name: "Accommodation", href: "/admin/accommodation", show: true },
    { name: "Form Builder", href: "/admin/forms", show: true },
    { name: "Form Responses", href: "/admin/forms/", show: true },
    { name: "Audit Logs", href: "/admin/audit-logs", show: role === "super_admin" || role === "superadmin" },
  ].find(n => currentPath.startsWith(n.href));

  if (currentNav && !currentNav.show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
        <Button className="mt-4" onClick={() => navigate(navigation[0]?.href || "/admin/login")}>
          Return to Allowed Area
        </Button>
      </div>
    );
  }

  const isMasterSuperAdmin = (role === 'super_admin' || role === 'superadmin') && (!branchId || branchId === 'nellore');

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 bg-primary text-white">
            <div className="flex items-center space-x-3">
              <BookHeart className="w-6 h-6" />
              <span className="text-lg font-bold">Admin Portal</span>
            </div>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {role === 'super_admin' || role === 'superadmin' ? 'Super Admin' : role === 'media_team' ? 'Media Team' : role}
            </p>
            
            {isMasterSuperAdmin && branches.length > 0 && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Managing Branch:</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                  value={dashboardBranchId || 'nellore'}
                  onChange={(e) => setDashboardBranchId(e.target.value)}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            {!isMasterSuperAdmin && dashboardBranchId && (
              <div className="mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 uppercase">
                  <MapPin className="w-3 h-3 mr-1" /> {dashboardBranchId}
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}
                  `}
                >
                  <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? "text-primary" : "text-gray-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full flex justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleSignOut}>
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Dashboard</span>
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
