import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Settings, Eye, Download, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logAudit } from "@/lib/audit";

interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "tel" | "email" | "textarea" | "date";
  required: boolean;
}

interface CustomForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  isActive: boolean;
  closesAt: string | null;
  createdAt: any;
}

export default function FormManager() {
  const { role } = useAuth();
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [fields, setFields] = useState<FormField[]>([
    { id: "f1", label: "Full Name", type: "text", required: true },
    { id: "f2", label: "Phone Number", type: "tel", required: true }
  ]);

  const hasWriteAccess = role === "admin" || role === "super_admin";

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "custom_forms"), orderBy("createdAt", "desc")));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CustomForm[];
      setForms(data);
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast.error("Failed to load forms.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    setFields([...fields, { id: `f${Date.now()}`, label: "", type: "text", required: false }]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleFieldChange = (id: string, key: keyof FormField, value: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error("Title is required");
    if (!description) return toast.error("Description is required");
    if (fields.length === 0) return toast.error("Add at least one field");

    try {
      await addDoc(collection(db, "custom_forms"), {
        title,
        description,
        fields,
        isActive: true,
        closesAt: closesAt ? new Date(closesAt).toISOString() : null,
        createdAt: serverTimestamp(),
      });
      await logAudit(role === "super_admin" ? "SuperAdmin" : "Admin", "CREATED", "FORM", `Title: ${title}`);
      toast.success("Form created successfully!");
      setTitle("");
      setDescription("");
      setClosesAt("");
      setFields([{ id: "f1", label: "Full Name", type: "text", required: true }, { id: "f2", label: "Phone Number", type: "tel", required: true }]);
      fetchForms();
    } catch (error) {
      toast.error("Failed to create form");
    }
  };

  const toggleFormStatus = async (form: CustomForm) => {
    try {
      await updateDoc(doc(db, "custom_forms", form.id), { isActive: !form.isActive });
      await logAudit(role === "super_admin" ? "SuperAdmin" : "Admin", "UPDATED", "FORM", `Toggled status to ${!form.isActive} for: ${form.title}`);
      toast.success(`Form is now ${!form.isActive ? 'Active' : 'Closed'}`);
      fetchForms();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Delete this form? This will NOT delete existing responses, but the form will be gone.")) return;
    try {
      await deleteDoc(doc(db, "custom_forms", formId));
      await logAudit(role === "super_admin" ? "SuperAdmin" : "Admin", "DELETED", "FORM", `Deleted form ID: ${formId}`);
      toast.success("Form deleted");
      fetchForms();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Form Builder</h2>
      </div>

      {hasWriteAccess && (
        <Card>
          <CardHeader>
            <CardTitle>Create a New Registration Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateForm} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Form Title <span className="text-red-500">*</span></Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sunday Feast Registration" required />
                </div>
                <div className="space-y-2">
                  <Label>Auto-Close Date & Time (Optional)</Label>
                  <Input type="datetime-local" value={closesAt} onChange={e => setClosesAt(e.target.value)} />
                  <p className="text-xs text-gray-500">Form will automatically stop accepting responses after this time.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description / Instructions <span className="text-red-500">*</span></Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Please fill out this form to register..." required />
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Form Fields</h3>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white p-3 border rounded shadow-sm">
                    <span className="font-mono text-xs text-gray-400 w-4">{index + 1}.</span>
                    <Input 
                      placeholder="Field Label (e.g. Email Address)" 
                      value={field.label} 
                      onChange={e => handleFieldChange(field.id, "label", e.target.value)} 
                      className="flex-1 min-w-[200px]"
                      required
                    />
                    <Select value={field.type} onValueChange={(v: any) => handleFieldChange(field.id, "type", v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Short Text</SelectItem>
                        <SelectItem value="textarea">Long Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="tel">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center space-x-2 text-sm whitespace-nowrap cursor-pointer">
                      <input type="checkbox" checked={field.required} onChange={e => handleFieldChange(field.id, "required", e.target.checked)} className="rounded" />
                      <span>Required</span>
                    </label>
                    <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => handleRemoveField(field.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddField} className="w-full border-dashed">
                  <Plus className="w-4 h-4 mr-2" /> Add Field
                </Button>
              </div>

              <Button type="submit">Create Form</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>Loading...</p> : forms.map(form => (
          <Card key={form.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{form.title}</CardTitle>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {form.isActive ? "ACTIVE" : "CLOSED"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">{form.description}</p>
              <div className="text-xs text-gray-500">
                <p>{form.fields.length} fields</p>
                {form.closesAt && <p>Closes: {new Date(form.closesAt).toLocaleString()}</p>}
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`/forms/${form.id}`} target="_blank" rel="noreferrer">
                    <Eye className="w-4 h-4 mr-2" /> View Public Form
                  </a>
                </Button>
                <Button variant="secondary" className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100" asChild>
                  <a href={`/admin/form-responses/${form.id}`}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> View Responses & CSV
                  </a>
                </Button>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" className="flex-1" onClick={() => toggleFormStatus(form)}>
                    {form.isActive ? "Close Form" : "Open Form"}
                  </Button>
                  <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(form.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
