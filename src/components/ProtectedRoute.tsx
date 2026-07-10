import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the attempted URL
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, check against the user's role
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    // If they are logged in but don't have the right role, redirect to their default dashboard or home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
