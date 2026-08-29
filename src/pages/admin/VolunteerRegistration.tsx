import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileSpreadsheet, Trash2, Heart, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const SEVA_LABELS: Record<string, string> = {
  book: "Book distribution",
  harinam: "Harinam sankirthan",
  festival: "Volunteer for festival services",
  garland: "Garland making",
  kitchen: "Kitchen service",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  weekdays: "Weekdays",
  weekends: "Weekends",
  flexible: "Flexible",
};

export default function VolunteerRegistration() {
  const { role, dashboardBranchId, branchId, permissions } = useAuth();
  const activeBranch = dashboardBranchId || branchId || "nellore";
  
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isSuper = role === "super_admin" || role === "superadmin";
  const hasPermission = isSuper || permissions?.volunteer_registration?.hasAccess;

  useEffect(() => {
    if (hasPermission) {
      fetchVolunteers();
    }
  }, [activeBranch]);

  if (!hasPermission) {
    return <Navigate to="/admin/overview" replace />;
  }

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "volunteer_registrations"), orderBy("createdAt", "desc")));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by active branch
      const filtered = list.filter((item: any) => item.branchId === activeBranch || (!item.branchId && activeBranch === 'nellore'));
      setVolunteers(filtered);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      toast.error("Failed to load volunteer registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this volunteer registration?")) return;

    try {
      await deleteDoc(doc(db, "volunteer_registrations", id));
      toast.success("Registration deleted successfully");
      fetchVolunteers();
    } catch (error) {
      console.error("Error deleting volunteer registration:", error);
      toast.error("Failed to delete registration");
    }
  };

  const handleDownloadCSV = () => {
    if (volunteers.length === 0) return;

    const headers = ["Registered At", "Name", "Email", "Phone", "Seva Preference", "Availability"];

    const rows = volunteers.map(vol => {
      const time = vol.createdAt ? new Date(vol.createdAt.toMillis()).toLocaleString() : "Unknown";
      const name = `"${(vol.name || "").replace(/"/g, '""')}"`;
      const email = `"${(vol.email || "").replace(/"/g, '""')}"`;
      const phone = `"${(vol.phone || "").replace(/"/g, '""')}"`;
      const seva = `"${(SEVA_LABELS[vol.seva] || vol.seva || "N/A").replace(/"/g, '""')}"`;
      const availability = `"${(AVAILABILITY_LABELS[vol.availability] || vol.availability || "N/A").replace(/"/g, '""')}"`;

      return [time, name, email, phone, seva, availability].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `volunteer_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Volunteer list downloaded successfully!");
  };

  const filteredVolunteers = volunteers.filter(vol => {
    const term = searchTerm.toLowerCase();
    return (
      vol.name?.toLowerCase().includes(term) ||
      vol.email?.toLowerCase().includes(term) ||
      vol.phone?.toLowerCase().includes(term) ||
      (SEVA_LABELS[vol.seva] || vol.seva || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary" />
            Volunteer Registration
          </h2>
          <p className="text-gray-500">Manage volunteer registrations and preferences.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadCSV} disabled={volunteers.length === 0} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Download CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border shadow-sm max-w-sm">
        <Search className="text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 p-0 h-auto"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 border-b">Registered Date</th>
                <th className="px-4 py-3 border-b">Name</th>
                <th className="px-4 py-3 border-b">Email</th>
                <th className="px-4 py-3 border-b">Phone</th>
                <th className="px-4 py-3 border-b">Seva Preference</th>
                <th className="px-4 py-3 border-b">Availability</th>
                <th className="px-4 py-3 border-b text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? "No matching volunteer registrations found." : "No volunteer registrations found."}
                  </td>
                </tr>
              ) : (
                filteredVolunteers.map((vol, i) => (
                  <tr key={vol.id} className={i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                    <td className="px-4 py-3 border-b text-gray-500 text-xs">
                      {vol.createdAt ? new Date(vol.createdAt.toMillis()).toLocaleString() : "Unknown"}
                    </td>
                    <td className="px-4 py-3 border-b font-medium text-gray-900">{vol.name}</td>
                    <td className="px-4 py-3 border-b">{vol.email}</td>
                    <td className="px-4 py-3 border-b">{vol.phone}</td>
                    <td className="px-4 py-3 border-b">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                        {SEVA_LABELS[vol.seva] || vol.seva || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b">
                      <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs font-semibold">
                        {AVAILABILITY_LABELS[vol.availability] || vol.availability || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b text-right">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(vol.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
