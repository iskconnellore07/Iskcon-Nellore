// src/components/DevoteeAdmin/DonationHistory.tsx
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { addDonation } from "@/services/devotee-service";
import { Plus } from "lucide-react";
import type { Devotee, Donation } from "@/integrations/supabase/devotee-types";

interface DonationHistoryProps {
  devotee: Devotee | null;
  donations: Donation[];
  onRefresh: () => void;
}

export default function DonationHistory({ devotee, donations, onRefresh }: DonationHistoryProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    donation_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    reference_id: "",
    notes: "",
  });

  async function handleAddDonation(e: React.FormEvent) {
    e.preventDefault();
    if (!devotee) return;

    setLoading(true);
    try {
      await addDonation({
        devotee_id: devotee.id,
        amount: parseFloat(formData.amount),
        donation_date: formData.donation_date,
        payment_method: formData.payment_method as any,
        reference_id: formData.reference_id || undefined,
        notes: formData.notes || undefined,
      });

      toast({
        title: "Success",
        description: "Donation recorded successfully",
      });

      setFormData({
        amount: "",
        donation_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        reference_id: "",
        notes: "",
      });
      setShowForm(false);
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record donation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

  if (!devotee) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Select a devotee to view donation history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Devotee Info Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <CardTitle>{devotee.name}</CardTitle>
          <CardDescription>{devotee.phone}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Donations</p>
              <p className="text-2xl font-bold text-orange-600">₹{totalDonated.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Count</p>
              <p className="text-2xl font-bold">{donations.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-2xl font-bold">
                ₹{donations.length > 0 ? (totalDonated / donations.length).toFixed(0) : "0"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Donation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Record Donation</CardTitle>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Donation
            </Button>
          ) : (
            <form onSubmit={handleAddDonation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="donation_date">Date *</Label>
                  <Input
                    id="donation_date"
                    type="date"
                    value={formData.donation_date}
                    onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="google_pay">Google Pay</SelectItem>
                      <SelectItem value="phonepe">PhonePe</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reference_id">Reference ID</Label>
                  <Input
                    id="reference_id"
                    value={formData.reference_id}
                    onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
                    placeholder="Transaction ID (optional)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.amount}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? "Recording..." : "Record Donation"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
          <CardDescription>{donations.length} donation(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No donations recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference ID</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>
                        {new Date(donation.donation_date).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        ₹{donation.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {donation.payment_method || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {donation.reference_id || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {donation.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
