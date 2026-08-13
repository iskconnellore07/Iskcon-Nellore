import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface PermissionData {
  hasAccess: boolean;
  expiresAt: string | null;
}

export type UserPermissions = Record<string, PermissionData>;

interface AuthContextType {
  user: User | null;
  role: string | null;
  branchId: string | null; // The user's fixed assigned branch
  dashboardBranchId: string | null; // The currently selected branch in the dashboard
  setDashboardBranchId: (id: string) => void;
  permissions: UserPermissions | null;
  isActive: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [dashboardBranchId, setDashboardBranchId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      let userUnsub: () => void = () => {};

      if (currentUser) {
        try {
          userUnsub = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data();
              setRole(data.role || null);
              setBranchId(data.branchId || null);
              if (!dashboardBranchId) setDashboardBranchId(data.branchId || 'nellore');
              setPermissions(data.permissions || null);
              setIsActive(data.isActive !== false);
            } else {
              setRole(null);
              setBranchId(null);
              setPermissions(null);
              setIsActive(true);
            }
            setIsLoading(false);
          });
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
          setBranchId(null);
          setPermissions(null);
          setIsLoading(false);
        }
      } else {
        setRole(null);
        setBranchId(null);
        setPermissions(null);
        setIsLoading(false);
      }
      
      return () => {
        userUnsub();
      };
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, branchId, dashboardBranchId, setDashboardBranchId, permissions, isActive, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
