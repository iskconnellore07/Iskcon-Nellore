import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, UserPlus, Save, Trash2, Edit, LayoutDashboard, Users, PlaySquare, Image, Calendar, FileText, X, AlertCircle, Home, UserCog, User, Clock } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, orderBy, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, UserPermissions } from "@/contexts/AuthContext";

const firebaseConfig = {
  apiKey: "AIzaSyAiRwVZi3NWMALFOGuW9VFunYfRWY0qQIo",
  authDomain: "iskcon-nellore.firebaseapp.com",
  projectId: "iskcon-nellore",
  storageBucket: "iskcon-nellore.firebasestorage.app",
  messagingSenderId: "866388993763",
  appId: "1:866388993763:web:635954965e4f2e2127c7d6",
};

interface UserRecord {
  id: string;
  email: string;
  role: string;
  permissions?: UserPermissions;
  isActive?: boolean;
  createdAt?: string;
}

const MODULES = [
  { id: "overview", name: "Overview (Donations)", icon: LayoutDashboard },
  { id: "devotees", name: "Devotee Management", icon: Users },
  { id: "courses", name: "Course Manager", icon: PlaySquare },
  { id: "gallery", name: "Gallery Manager", icon: Image },
  { id: "calendar", name: "Calendar & Festivals", icon: Calendar },
  { id: "accommodation", name: "Accommodation Manager", icon: Home },
  { id: "forms", name: "Event Forms Builder", icon: FileText },
  { id: "banners", name: "Website Banners", icon: Image },
];

export default function ManageLogins() {
  const { role: currentUserRole } = useAuth();
  
  // Create User State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [creating, setCreating] = useState(false);
  
  // List Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Edit Permissions State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [tempPermissions, setTempPermissions] = useState<UserPermissions>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserRecord[];
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load user list");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);

      // Give full access by default, they can edit it immediately after
      const defaultPermissions: UserPermissions = {};
      MODULES.forEach(m => {
        defaultPermissions[m.id] = { hasAccess: true, expiresAt: null };
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        role,
        permissions: defaultPermissions,
        createdAt: new Date().toISOString()
      });

      await signOut(secondaryAuth);

      toast.success(`User ${email} created successfully!`);
      setEmail("");
      setPassword("");
      setRole("admin");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  const openEditor = (user: UserRecord) => {
    setEditingUser(user);
    // Initialize permissions if they don't exist
    const initialPerms = { ...(user.permissions || {}) };
    MODULES.forEach(m => {
      if (!initialPerms[m.id]) {
        initialPerms[m.id] = { hasAccess: false, expiresAt: null };
      }
    });
    setTempPermissions(initialPerms);
  };

  const toggleModule = (moduleId: string, value: boolean) => {
    setTempPermissions(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], hasAccess: value }
    }));
  };

  const setExpiration = (moduleId: string, date: string) => {
    setTempPermissions(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], expiresAt: date || null }
    }));
  };

  const savePermissions = async () => {
    if (!editingUser) return;
    
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        permissions: tempPermissions
      });
      toast.success("Permissions updated successfully!");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error saving perms:", error);
      toast.error("Failed to save permissions.");
    }
  };

  const toggleSuspend = async (userId: string, currentStatus: boolean | undefined) => {
    const isCurrentlyActive = currentStatus !== false;
    const action = isCurrentlyActive ? "suspend" : "restore";
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        isActive: !isCurrentlyActive
      });
      toast.success(`User access ${isCurrentlyActive ? 'suspended' : 'restored'}.`);
      fetchUsers();
    } catch (error) {
      console.error("Error toggling suspension:", error);
      toast.error(`Failed to ${action} user.`);
    }
  };

  if (currentUserRole !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only the Super Admin can manage logins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Logins</h1>
          <p className="text-gray-500 mt-1">Create accounts and universally manage access controls for every module.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* CREATE USER CARD */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <CardTitle>Create Login</CardTitle>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateUser}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Base Role</Label>
                  <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="admin">Admin</option>
                    <option value="sevakas">Sevaka</option>
                    <option value="devotees">Devotee</option>
                    <option value="media_team">Media Team</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? "Creating..." : "Create Account"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* LIST & EDIT USERS */}
        <div>
          {editingUser ? (
            <Card className="border-primary/50 shadow-md">
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserCog className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle>Editing Access for {editingUser.email}</CardTitle>
                      <CardDescription className="uppercase tracking-wider font-semibold text-primary mt-1">{editingUser.role}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {MODULES.map((module) => {
                    const perm = tempPermissions[module.id] || { hasAccess: false, expiresAt: null };
                    
                    return (
                      <div key={module.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${perm.hasAccess ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            <module.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{module.name}</p>
                            <p className="text-xs text-gray-500">
                              {perm.hasAccess 
                                ? perm.expiresAt ? `Expires: ${new Date(perm.expiresAt).toLocaleDateString()}` : 'Lifetime Access'
                                : 'Access Denied'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                          {perm.hasAccess && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <Input 
                                type="date" 
                                className="h-8 text-xs" 
                                value={perm.expiresAt ? perm.expiresAt.split('T')[0] : ''} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setExpiration(module.id, val ? new Date(val).toISOString() : '');
                                }} 
                              />
                            </div>
                          )}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={perm.hasAccess} 
                              onChange={(e) => toggleModule(module.id, e.target.checked)} 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t p-4 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button onClick={savePermissions}>Save All Permissions</Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Active Logins</CardTitle>
                <CardDescription>Click 'Manage' to grant or revoke access to specific modules.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p className="text-center text-gray-500 py-8">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No users found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className={`border-b hover:bg-gray-50 ${u.isActive === false ? 'bg-red-50/50' : 'bg-white'}`}>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {u.email} 
                              {u.isActive === false && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">SUSPENDED</span>}
                            </td>
                            <td className="px-4 py-3 uppercase text-xs font-semibold">{u.role}</td>
                            <td className="px-4 py-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-2 flex-nowrap">
                                {u.role !== 'super_admin' && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => openEditor(u)}>Manage</Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className={u.isActive === false ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"} 
                                      onClick={() => toggleSuspend(u.id, u.isActive)}
                                    >
                                      {u.isActive === false ? "Restore" : "Suspend"}
                                    </Button>
                                  </>
                                )}
                                {u.role === 'super_admin' && <span className="text-gray-400 italic">Uneditable</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
