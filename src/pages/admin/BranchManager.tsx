import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Edit, Save, X, Plus, ExternalLink, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export interface BranchRecord {
  id: string; // slug, e.g. 'nellore', 'gudur'
  name: string; // e.g. 'ISKCON Gudur'
  type: 'internal' | 'external';
  link?: string;
  address?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  map360Link?: string;
  mapEmbedUrl?: string;
  timings?: string;
  isActive: boolean;
  createdAt: string;
}

export default function BranchManager() {
  const { role, branchId: userBranchId } = useAuth();
  const isMasterSuperAdmin = (role === 'super_admin' || role === 'superadmin') && (userBranchId === 'nellore' || !userBranchId);

  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Partial<BranchRecord>>({ type: 'internal', isActive: true });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "branches"), orderBy("createdAt", "asc")));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BranchRecord[];
      // If empty, initialize Nellore
      if (data.length === 0 && isMasterSuperAdmin) {
        const nellore: BranchRecord = {
          id: 'nellore', name: 'ISKCON Nellore', type: 'internal', isActive: true, createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "branches", 'nellore'), nellore);
        setBranches([nellore]);
      } else {
        setBranches(data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranch = async () => {
    if (!editingBranch.id || !editingBranch.name) {
      toast.error("Branch URL Name and Name are required.");
      return;
    }
    
    // Only master super admin can create/edit branch routing.
    // But Branch Super admin can edit their own branch settings (handled separately or here)
    if (!isMasterSuperAdmin && editingBranch.id !== userBranchId) {
      toast.error("You do not have permission to modify this branch.");
      return;
    }

    try {
      const isNew = !branches.find(b => b.id === editingBranch.id);
      if (isNew && !isMasterSuperAdmin) {
        toast.error("Only Master Super Admin can create new branches.");
        return;
      }

      const branchData = {
        ...editingBranch,
        createdAt: editingBranch.createdAt || new Date().toISOString()
      };

      await setDoc(doc(db, "branches", editingBranch.id), branchData, { merge: true });
      toast.success("Branch saved successfully!");
      setIsDialogOpen(false);
      fetchBranches();
    } catch (error) {
      console.error("Error saving branch:", error);
      toast.error("Failed to save branch.");
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'nellore') {
      toast.error("Cannot delete the master branch.");
      return;
    }
    if (!isMasterSuperAdmin) {
      toast.error("Only Master Super Admin can delete branches.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this branch?")) {
      try {
        await deleteDoc(doc(db, "branches", id));
        toast.success("Branch deleted.");
        fetchBranches();
      } catch (error) {
        console.error("Error deleting branch", error);
        toast.error("Failed to delete branch.");
      }
    }
  };

  const openNewDialog = () => {
    if (!isMasterSuperAdmin) {
      toast.error("Only Master Super Admin can create new branches.");
      return;
    }
    setEditingBranch({ type: 'internal', isActive: true });
    setIsDialogOpen(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branch Manager</h2>
          <p className="text-muted-foreground">Manage multi-tenant branches and settings.</p>
        </div>
        {isMasterSuperAdmin && (
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Branch
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map(branch => {
          // If not master admin, only show their own branch
          if (!isMasterSuperAdmin && branch.id !== userBranchId) return null;

          return (
            <Card key={branch.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  <span>{branch.name}</span>
                  {!branch.isActive && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactive</span>}
                </CardTitle>
                <CardDescription>URL Name: {branch.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{branch.type} {branch.type === 'external' && <ExternalLink className="inline h-3 w-3" />}</span>
                </div>
                {branch.type === 'external' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Link:</span>
                    <span className="truncate max-w-[150px]">{branch.link}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{branch.phone || 'Not set'}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => { setEditingBranch(branch); setIsDialogOpen(true); }}>
                  <Edit className="h-4 w-4 mr-2" /> {isMasterSuperAdmin ? "Edit / Settings" : "Edit Settings"}
                </Button>
                {isMasterSuperAdmin && branch.id !== 'nellore' && (
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(branch.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBranch.id && branches.find(b => b.id === editingBranch.id) ? "Edit Branch" : "Add New Branch"}</DialogTitle>
            <DialogDescription>Configure branch routing and contact settings.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch URL Name (e.g. gudur)</Label>
                <Input 
                  value={editingBranch.id || ""} 
                  onChange={(e) => setEditingBranch({...editingBranch, id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} 
                  placeholder="e.g. gudur"
                  disabled={!isMasterSuperAdmin || (!!editingBranch.id && !!branches.find(b => b.id === editingBranch.id))}
                />
                <p className="text-xs text-muted-foreground">Used for URL: /gudur</p>
              </div>
              <div className="space-y-2">
                <Label>Branch Name</Label>
                <Input 
                  value={editingBranch.name || ""} 
                  onChange={(e) => setEditingBranch({...editingBranch, name: e.target.value})} 
                  placeholder="e.g. ISKCON Gudur"
                  disabled={!isMasterSuperAdmin}
                />
              </div>
            </div>

            {isMasterSuperAdmin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Routing Type</Label>
                  <Select 
                    value={editingBranch.type} 
                    onValueChange={(val: any) => setEditingBranch({...editingBranch, type: val})}
                    disabled={editingBranch.id === 'nellore'}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Page (CMS)</SelectItem>
                      <SelectItem value="external">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingBranch.id === 'nellore' && <p className="text-xs text-muted-foreground">Master branch must be internal.</p>}
                </div>
                {editingBranch.type === 'external' && (
                  <div className="space-y-2">
                    <Label>External URL</Label>
                    <Input 
                      value={editingBranch.link || ""} 
                      onChange={(e) => setEditingBranch({...editingBranch, link: e.target.value})} 
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
            )}

            {editingBranch.type !== 'external' && (
              <>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center mt-4 border-b pb-2"><Settings className="mr-2 h-4 w-4"/> Public Settings (Footer & Contact)</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value={editingBranch.phone || ""} onChange={(e) => setEditingBranch({...editingBranch, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input value={editingBranch.email || ""} onChange={(e) => setEditingBranch({...editingBranch, email: e.target.value})} placeholder="info@iskconnellore.org" />
                  </div>
                  <div className="space-y-2">
                    <Label>Facebook Link</Label>
                    <Input value={editingBranch.facebook || ""} onChange={(e) => setEditingBranch({...editingBranch, facebook: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram Link</Label>
                    <Input value={editingBranch.instagram || ""} onChange={(e) => setEditingBranch({...editingBranch, instagram: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube Link</Label>
                    <Input value={editingBranch.youtube || ""} onChange={(e) => setEditingBranch({...editingBranch, youtube: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Google Maps 360 Embed Link</Label>
                    <Input value={editingBranch.map360Link || ""} onChange={(e) => setEditingBranch({...editingBranch, map360Link: e.target.value})} placeholder="https://www.google.com/maps/embed?pb=..." />
                    <p className="text-xs text-muted-foreground mt-1">If provided, this will display the 360° Virtual Tour on your branch's homepage.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Google Maps 2D Embed URL (Contact Page)</Label>
                    <Input value={editingBranch.mapEmbedUrl || ""} onChange={(e) => setEditingBranch({...editingBranch, mapEmbedUrl: e.target.value})} placeholder="https://www.google.com/maps/embed?pb=..." />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Temple Timings</Label>
                    <Input value={editingBranch.timings || ""} onChange={(e) => setEditingBranch({...editingBranch, timings: e.target.value})} placeholder="Daily: 4:30 AM - 9:00 PM, Sundays: 4:30 AM - 9:30 PM" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Physical Address</Label>
                    <Input value={editingBranch.address || ""} onChange={(e) => setEditingBranch({...editingBranch, address: e.target.value})} />
                  </div>
                </div>
              </>
            )}

            {isMasterSuperAdmin && (
              <div className="flex items-center space-x-2 mt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={editingBranch.isActive} 
                  onChange={(e) => setEditingBranch({...editingBranch, isActive: e.target.checked})} 
                />
                <Label htmlFor="isActive">Active (Visible in Navigation)</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBranch}>Save Branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
