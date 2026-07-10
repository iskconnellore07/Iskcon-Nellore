import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileSpreadsheet, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function AuditLogs() {
  const { role } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Security: Only super_admin can view this page
  if (role !== "super_admin") {
    return <Navigate to="/admin/dashboard" />;
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "audit_logs"), orderBy("timestamp", "desc")));
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["Timestamp", "User Email", "Action", "Resource Type", "Details"];
    
    const rows = logs.map(log => {
      const time = log.timestamp ? new Date(log.timestamp.toMillis()).toLocaleString() : "Unknown";
      const user = `"${(log.user || "").replace(/"/g, '""')}"`;
      const action = `"${(log.action || "").replace(/"/g, '""')}"`;
      const resource = `"${(log.resourceType || "").replace(/"/g, '""')}"`;
      const details = `"${(log.details || "").replace(/"/g, '""')}"`;
      
      return [time, user, action, resource, details].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit Logs downloaded successfully!");
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to permanently delete ALL audit logs? Make sure you downloaded the CSV first to save Firebase costs!")) return;
    
    try {
      for (const log of logs) {
        await deleteDoc(doc(db, "audit_logs", log.id));
      }
      toast.success("All audit logs cleared.");
      fetchLogs();
    } catch (error) {
      toast.error("Failed to clear logs");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            System Audit Logs
          </h2>
          <p className="text-gray-500">Track all administrative actions across the platform. (Super Admin Only)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadCSV} disabled={logs.length === 0} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Download CSV
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleClearLogs} disabled={logs.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear All Logs
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 border-b">Timestamp</th>
                <th className="px-4 py-3 border-b">User Email</th>
                <th className="px-4 py-3 border-b">Action</th>
                <th className="px-4 py-3 border-b">Resource</th>
                <th className="px-4 py-3 border-b">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No activity logs found.</td></tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={log.id} className={i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                    <td className="px-4 py-3 border-b whitespace-nowrap text-gray-500 text-xs">
                      {log.timestamp ? new Date(log.timestamp.toMillis()).toLocaleString() : "Unknown"}
                    </td>
                    <td className="px-4 py-3 border-b font-medium text-gray-900">{log.user}</td>
                    <td className="px-4 py-3 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        log.action === "DELETED" ? "bg-red-100 text-red-700" :
                        log.action === "CREATED" || log.action === "UPLOADED" ? "bg-green-100 text-green-700" :
                        log.action === "LOGIN" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b font-mono text-xs text-gray-500">{log.resourceType}</td>
                    <td className="px-4 py-3 border-b">{log.details}</td>
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
