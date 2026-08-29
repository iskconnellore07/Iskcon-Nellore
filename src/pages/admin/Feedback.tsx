import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileSpreadsheet, Trash2, MessageSquare, Search, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Feedback() {
  const { role, dashboardBranchId, branchId, permissions } = useAuth();
  const activeBranch = dashboardBranchId || branchId || "nellore";

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  const isSuper = role === "super_admin" || role === "superadmin";
  const hasPermission = isSuper || permissions?.feedback?.hasAccess;

  useEffect(() => {
    if (hasPermission) {
      fetchMessages();
    }
  }, [activeBranch]);

  if (!hasPermission) {
    return <Navigate to="/admin/overview" replace />;
  }

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "contact_messages"), orderBy("createdAt", "desc")));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter by active branch
      const filtered = list.filter((item: any) => item.branchId === activeBranch || (!item.branchId && activeBranch === 'nellore'));
      setMessages(filtered);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback messages");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback message?")) return;

    try {
      await deleteDoc(doc(db, "contact_messages", id));
      toast.success("Feedback message deleted successfully");
      fetchMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error("Error deleting feedback message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleDownloadCSV = () => {
    if (messages.length === 0) return;

    const headers = ["Submitted At", "Name", "Email", "Phone", "Message"];

    const rows = messages.map(msg => {
      const time = msg.createdAt ? new Date(msg.createdAt.toMillis()).toLocaleString() : "Unknown";
      const name = `"${(msg.name || "").replace(/"/g, '""')}"`;
      const email = `"${(msg.email || "").replace(/"/g, '""')}"`;
      const phone = `"${(msg.phone || "").replace(/"/g, '""')}"`;
      const messageText = `"${(msg.message || "").replace(/"/g, '""')}"`;

      return [time, name, email, phone, messageText].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `feedback_messages_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Feedback list downloaded successfully!");
  };

  const filteredMessages = messages.filter(msg => {
    const term = searchTerm.toLowerCase();
    return (
      msg.name?.toLowerCase().includes(term) ||
      msg.email?.toLowerCase().includes(term) ||
      msg.phone?.toLowerCase().includes(term) ||
      msg.message?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            Feedback Section
          </h2>
          <p className="text-gray-500">View and manage messages sent from the Contact Us form.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadCSV} disabled={messages.length === 0} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Download CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border shadow-sm max-w-sm">
        <Search className="text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search by name, email, phone, or message..."
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
                <th className="px-4 py-3 border-b">Submitted Date</th>
                <th className="px-4 py-3 border-b">Name</th>
                <th className="px-4 py-3 border-b">Email</th>
                <th className="px-4 py-3 border-b">Phone</th>
                <th className="px-4 py-3 border-b w-1/3">Message Preview</th>
                <th className="px-4 py-3 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading messages...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? "No matching messages found." : "No messages found."}
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg, i) => (
                  <tr key={msg.id} className={i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                    <td className="px-4 py-3 border-b text-gray-500 text-xs whitespace-nowrap">
                      {msg.createdAt ? new Date(msg.createdAt.toMillis()).toLocaleString() : "Unknown"}
                    </td>
                    <td className="px-4 py-3 border-b font-medium text-gray-900 whitespace-nowrap">{msg.name}</td>
                    <td className="px-4 py-3 border-b whitespace-nowrap">{msg.email}</td>
                    <td className="px-4 py-3 border-b whitespace-nowrap">{msg.phone || "-"}</td>
                    <td className="px-4 py-3 border-b truncate max-w-[200px] text-gray-600">
                      {msg.message}
                    </td>
                    <td className="px-4 py-3 border-b text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700" onClick={() => setSelectedMessage(msg)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(msg.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Message View Modal Dialog */}
      <Dialog open={selectedMessage !== null} onOpenChange={(open) => { if (!open) setSelectedMessage(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Feedback Details
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedMessage?.createdAt ? new Date(selectedMessage.createdAt.toMillis()).toLocaleString() : "Unknown"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="grid grid-cols-3 border-b pb-2">
              <span className="font-semibold text-gray-500">Name</span>
              <span className="col-span-2 text-gray-900 font-medium">{selectedMessage?.name}</span>
            </div>
            <div className="grid grid-cols-3 border-b pb-2">
              <span className="font-semibold text-gray-500">Email</span>
              <span className="col-span-2 text-gray-900">{selectedMessage?.email}</span>
            </div>
            <div className="grid grid-cols-3 border-b pb-2">
              <span className="font-semibold text-gray-500">Phone</span>
              <span className="col-span-2 text-gray-900">{selectedMessage?.phone || "-"}</span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-gray-500 block">Message</span>
              <div className="p-3 bg-gray-50 border rounded-lg whitespace-pre-wrap text-gray-800 leading-relaxed">
                {selectedMessage?.message}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>
              Close
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(selectedMessage.id)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
