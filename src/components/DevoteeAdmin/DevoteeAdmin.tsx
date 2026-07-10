// src/components/DevoteeAdmin/DevoteeAdmin.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  fetchDevotees,
  fetchDevotee,
  createDevotee,
  updateDevotee,
  deleteDevotee,
  fetchDonationHistory,
  fetchSmsLogs,
  getDevoteeStats,
  getSmsStats,
  exportDevokeesToCsv,
  importDevoteesFromCsv,
} from "@/services/devotee-service";
import type { Devotee, Donation, SmsLog } from "@/integrations/supabase/devotee-types";
import DevoteeForm from "./DevoteeForm";
import DevoteeTable from "./DevoteeTable";
import DonationHistory from "./DonationHistory";
import SmsLogs from "./SmsLogs";
import DashboardStats from "./DashboardStats";
import { Upload, Download, Plus } from "lucide-react";

export default function DevoteeAdmin() {
  const { toast } = useToast();
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [filteredDevotees, setFilteredDevotees] = useState<Devotee[]>([]);
  const [selectedDevotee, setSelectedDevotee] = useState<Devotee | null>(null);
  const [donationHistory, setDonationHistory] = useState<Donation[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [devoteStats, setDevoteeStats] = useState({ active: 0, inactive: 0, paused: 0 });
  const [msgStats, setMsgStats] = useState({ sent: 0, failed: 0, pending: 0 });

  // Load devotees and stats on mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter devotees based on search and status
  useEffect(() => {
    let filtered = devotees;

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.phone.includes(searchTerm) ||
          d.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    setFilteredDevotees(filtered);
  }, [devotees, searchTerm, statusFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [devoteeData, stats, msgStats] = await Promise.all([
        fetchDevotees(),
        getDevoteeStats(),
        getSmsStats(),
      ]);
      setDevotees(devoteeData);
      setDevoteeStats(stats);
      setMsgStats(msgStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load devotees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectDevotee(devotee: Devotee) {
    setSelectedDevotee(devotee);
    try {
      const [donations, logs] = await Promise.all([
        fetchDonationHistory(devotee.id),
        fetchSmsLogs(devotee.id),
      ]);
      setDonationHistory(donations);
      setSmsLogs(logs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load devotee details",
        variant: "destructive",
      });
    }
  }

  async function handleSaveDevotee(data: Omit<Devotee, "id" | "created_at" | "updated_at">) {
    try {
      if (selectedDevotee?.id) {
        await updateDevotee(selectedDevotee.id, data);
        toast({
          title: "Success",
          description: "Devotee updated successfully",
        });
      } else {
        await createDevotee(data);
        toast({
          title: "Success",
          description: "Devotee created successfully",
        });
      }
      await loadData();
      setShowForm(false);
      setSelectedDevotee(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save devotee",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteDevotee(id: string) {
    try {
      await deleteDevotee(id);
      toast({
        title: "Success",
        description: "Devotee deleted successfully",
      });
      await loadData();
      setSelectedDevotee(null);
      setDeleteConfirm(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete devotee",
        variant: "destructive",
      });
    }
  }

  async function handleImport(file: File) {
    try {
      const imported = await importDevoteesFromCsv(file);
      toast({
        title: "Success",
        description: `Imported ${imported.length} devotees`,
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import devotees",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🙏 Devotee Management</h1>
          <p className="text-gray-600">Manage devotee information and SMS reminders</p>
        </div>

        {/* Stats Cards */}
        <DashboardStats devoteStats={devoteStats} msgStats={msgStats} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="devotees" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="devotees">Devotees</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="sms-logs">SMS Logs</TabsTrigger>
          </TabsList>

          {/* Devotees Tab */}
          <TabsContent value="devotees" className="space-y-6">
            {/* Search and Actions Bar */}
            <Card>
              <CardHeader>
                <CardTitle>Devotee List</CardTitle>
                <CardDescription>Manage all devotees and their information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-3 flex-wrap">
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px]"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      setSelectedDevotee(null);
                      setShowForm(!showForm);
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Devotee
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".csv";
                      input.onchange = (e: any) => handleImport(e.target.files[0]);
                      input.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => exportDevokeesToCsv(devotees)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Form Section */}
                {showForm && (
                  <div className="border-t pt-4">
                    <DevoteeForm
                      devotee={selectedDevotee || undefined}
                      onSave={handleSaveDevotee}
                      onCancel={() => {
                        setShowForm(false);
                        setSelectedDevotee(null);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Devotees Table */}
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Loading devotees...</p>
                </CardContent>
              </Card>
            ) : (
              <DevoteeTable
                devotees={filteredDevotees}
                onSelect={handleSelectDevotee}
                onEdit={(devotee) => {
                  setSelectedDevotee(devotee);
                  setShowForm(true);
                }}
                onDelete={(id) => setDeleteConfirm(id)}
              />
            )}
          </TabsContent>

          {/* Donations Tab */}
          <TabsContent value="donations">
            <DonationHistory
              devotee={selectedDevotee}
              donations={donationHistory}
              onRefresh={() => selectedDevotee && handleSelectDevotee(selectedDevotee)}
            />
          </TabsContent>

          {/* SMS Logs Tab */}
          <TabsContent value="sms-logs">
            <SmsLogs logs={smsLogs} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Devotee?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All associated records will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteConfirm && handleDeleteDevotee(deleteConfirm)}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
