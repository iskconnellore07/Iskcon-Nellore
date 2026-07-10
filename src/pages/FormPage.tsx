import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function FormPage() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    if (!formId) return;
    try {
      const formDoc = await getDoc(doc(db, "custom_forms", formId));
      if (formDoc.exists()) {
        setForm({ id: formDoc.id, ...formDoc.data() });
      } else {
        toast.error("Form not found.");
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !form.isActive) return;

    if (form.closesAt && new Date(form.closesAt) < new Date()) {
      toast.error("This form is no longer accepting responses.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "form_responses"), {
        formId,
        answers,
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error) {
      toast.error("Error submitting form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto p-4 flex items-center justify-center">
          Loading form...
        </main>
        <Footer />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto p-4 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center text-red-500 font-medium">
              Form not found or deleted.
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const isClosed = !form.isActive || (form.closesAt && new Date(form.closesAt) < new Date());

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 flex items-start justify-center">
        <Card className="max-w-2xl w-full mt-4 md:mt-8 shadow-lg border-t-8 border-t-primary">
          <CardHeader className="bg-white rounded-t-lg border-b pb-6">
            <CardTitle className="text-3xl text-primary">{form.title}</CardTitle>
            {form.description && <p className="text-gray-600 mt-2 whitespace-pre-wrap">{form.description}</p>}
          </CardHeader>
          
          <CardContent className="p-6 md:p-8 bg-gray-50 rounded-b-lg">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                <h3 className="text-2xl font-bold text-gray-900">Thank You!</h3>
                <p className="text-gray-600">Your response has been recorded successfully.</p>
                <Button onClick={() => navigate("/")} className="mt-8">Return to Home</Button>
              </div>
            ) : isClosed ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-bold text-red-600 mb-2">Form Closed</h3>
                <p className="text-gray-600">This form is no longer accepting responses.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {form.fields.map((field: any, index: number) => (
                  <div key={field.id} className="bg-white p-5 rounded-lg border shadow-sm space-y-3">
                    <Label className="text-base">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea 
                        required={field.required} 
                        onChange={(e) => handleChange(field.id, e.target.value)} 
                        placeholder="Your answer"
                        className="bg-gray-50"
                      />
                    ) : (
                      <Input 
                        type={field.type} 
                        required={field.required} 
                        onChange={(e) => handleChange(field.id, e.target.value)} 
                        placeholder="Your answer"
                        className="bg-gray-50"
                      />
                    )}
                  </div>
                ))}
                
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={submitting} className="w-full md:w-auto px-8">
                    {submitting ? "Submitting..." : "Submit Response"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
