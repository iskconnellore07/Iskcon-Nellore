import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, where, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Download, Trash2, FileSpreadsheet } from "lucide-react";

export default function FormResponses() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [formId]);

  const fetchData = async () => {
    if (!formId) return;
    try {
      setLoading(true);
      const formDoc = await getDoc(doc(db, "custom_forms", formId));
      if (formDoc.exists()) setForm({ id: formDoc.id, ...formDoc.data() });

      const resSnapshot = await getDocs(query(collection(db, "form_responses"), where("formId", "==", formId)));
      const resData = resSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by submittedAt descending manually since where+orderBy requires composite index
      resData.sort((a, b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis());
      setResponses(resData);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!form || responses.length === 0) return;
    
    // Build headers from form fields
    const headers = ["Submitted At", ...form.fields.map((f: any) => f.label)];
    
    // Build rows
    const rows = responses.map(res => {
      const row = [new Date(res.submittedAt?.toMillis() || Date.now()).toLocaleString()];
      form.fields.forEach((f: any) => {
        // Escape quotes and commas
        let val = res.answers[f.id] || "";
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        row.push(`"${val}"`);
      });
      return row.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Downloaded Successfully!");
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to permanently delete ALL responses for this form? This cannot be undone. Make sure you downloaded the CSV first!")) return;
    
    try {
      for (const res of responses) {
        await deleteDoc(doc(db, "form_responses", res.id));
      }
      toast.success("All responses deleted to save space.");
      fetchData();
    } catch (error) {
      toast.error("Error deleting responses");
    }
  };

  if (loading) return <div className="p-8">Loading responses...</div>;
  if (!form) return <div className="p-8">Form not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="mb-2">
          <Link to="/admin/forms"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Forms</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{form.title} - Responses</h2>
          <p className="text-gray-500">Total Submissions: {responses.length}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadCSV} disabled={responses.length === 0} className="bg-green-600 hover:bg-green-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Download Excel/CSV
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200" onClick={handleDeleteAll} disabled={responses.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear All Data
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 border-b whitespace-nowrap">Submitted</th>
                {form.fields.map((f: any) => (
                  <th key={f.id} className="px-4 py-3 border-b whitespace-nowrap">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.length === 0 ? (
                <tr><td colSpan={form.fields.length + 1} className="px-4 py-8 text-center text-gray-500">No responses yet.</td></tr>
              ) : (
                responses.map((res, i) => (
                  <tr key={res.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 border-b whitespace-nowrap text-gray-500">
                      {new Date(res.submittedAt?.toMillis() || Date.now()).toLocaleString()}
                    </td>
                    {form.fields.map((f: any) => (
                      <td key={f.id} className="px-4 py-3 border-b">
                        {res.answers[f.id] || "-"}
                      </td>
                    ))}
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
