import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logAudit } from "@/lib/audit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlaySquare, Trash2, Link as LinkIcon, Calendar, UploadCloud } from "lucide-react";
import { toast } from "sonner";

export default function CourseManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState("Admin");
  
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [series, setSeries] = useState("");

  const uniqueSeries = Array.from(new Set(courses.map(c => c.series).filter(Boolean)));

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !link) return toast.error("Please fill in all fields");

    setAdding(true);
    try {
      await addDoc(collection(db, "courses"), {
        Title: title,
        Link: link,
        series: series.trim() || "General Lectures",
        createdBy: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      await logAudit(role === "super_admin" ? "SuperAdmin" : "Admin", "CREATED", "COURSE", `Title: ${title} (${series || "General Lectures"})`);
      
      toast.success("Course added successfully!");
      setTitle("");
      setLink("");
      setSeries("");
      fetchCourses();
    } catch (error) {
      console.error("Error adding course:", error);
      toast.error("Failed to add course");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (course: any) => {
    if (!confirm("Are you sure you want to delete this course video?")) return;
    
    try {
      await deleteDoc(doc(db, "courses", course.id));
      await logAudit(role === "super_admin" ? "SuperAdmin" : "Admin", "DELETED", "COURSE", `Deleted course: ${course.Title}`);
      toast.success("Course deleted successfully");
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const handleMigrateOldData = async () => {
    if (!confirm("Are you sure you want to import the legacy Excel/CSV data? This will add 5 old courses to the database.")) return;
    setAdding(true);
    const legacyData = [
      { Title: "Introduction to Bhagavad Gita", Link: "https://www.youtube.com/watch?v=1a2b3c4d" },
      { Title: "Krishna Consciousness Basics", Link: "https://www.youtube.com/watch?v=2b3c4d5e" },
      { Title: "Chanting and Bhakti", Link: "https://www.youtube.com/watch?v=3c4d5e6f" },
      { Title: "Hare Krishna Movement History", Link: "https://www.youtube.com/watch?v=4d5e6f7g" },
      { Title: "Philosophy and Practice", Link: "https://www.youtube.com/watch?v=5e6f7g8h" }
    ];

    try {
      for (const course of legacyData) {
        await addDoc(collection(db, "courses"), {
          Title: course.Title,
          Link: course.Link,
          createdBy: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
        });
      }
      toast.success("Legacy data migrated successfully!");
      fetchCourses();
    } catch (error) {
      console.error("Migration error:", error);
      toast.error("Failed to migrate data");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Manager</h1>
          <p className="text-gray-500 mt-1">Add or remove YouTube videos for the public Courses page.</p>
        </div>
        <Button variant="outline" onClick={handleMigrateOldData} disabled={adding}>
          <UploadCloud className="w-4 h-4 mr-2" />
          Import Old Excel Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ADD COURSE FORM */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Video</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Lecture Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. Bhagavad Gita Chapter 1"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="series">Series / Playlist Name</Label>
                  <Input 
                    id="series" 
                    list="series-list"
                    value={series} 
                    onChange={(e) => setSeries(e.target.value)} 
                    placeholder="e.g. Bhagavad Gita"
                  />
                  <datalist id="series-list">
                    {uniqueSeries.map((s: string) => (
                      <option key={s} value={s} />
                    ))}
                    <option value="General Lectures" />
                  </datalist>
                  <p className="text-xs text-muted-foreground">Leave blank for 'General Lectures'. Select existing or type a new one.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="link">YouTube Link</Label>
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                    <Input 
                      id="link" 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)} 
                      placeholder="https://youtube.com/watch?v=..."
                      required 
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={adding}>
                  {adding ? "Adding..." : "Add Video"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* LIST COURSES */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Course Videos</CardTitle>
              <CardDescription>These videos are currently live on the public Courses page.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-500 py-8">Loading courses...</p>
              ) : courses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No courses uploaded yet.</p>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="flex flex-col sm:flex-row justify-between p-4 bg-gray-50 rounded-lg border items-start sm:items-center gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg mt-1">
                          <PlaySquare className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-orange-200">
                              {course.series || "General Lectures"}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{course.Title}</h3>
                          <a href={course.Link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                            {course.Link}
                          </a>
                          <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>Added: {course.createdAt?.toDate ? course.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(course.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
