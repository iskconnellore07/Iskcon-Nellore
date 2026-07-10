// src/components/DevoteeAdmin/DevoteeForm.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Devotee } from "@/integrations/supabase/devotee-types";

interface DevoteeFormProps {
  devotee?: Devotee;
  onSave: (data: Omit<Devotee, "id" | "created_at" | "updated_at">) => Promise<void>;
  onCancel: () => void;
}

export default function DevoteeForm({ devotee, onSave, onCancel }: DevoteeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    birthday: "",
    anniversary: "",
    donation_day_of_month: "",
    donation_amount: "",
    donation_type: "monthly" as const,
    status: "active" as const,
    notes: "",
  });

  useEffect(() => {
    if (devotee) {
      setFormData({
        name: devotee.name,
        phone: devotee.phone,
        email: devotee.email || "",
        birthday: devotee.birthday || "",
        anniversary: devotee.anniversary || "",
        donation_day_of_month: devotee.donation_day_of_month?.toString() || "",
        donation_amount: devotee.donation_amount?.toString() || "",
        donation_type: devotee.donation_type || "monthly",
        status: devotee.status || "active",
        notes: devotee.notes || "",
      });
    }
  }, [devotee]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const data: Omit<Devotee, "id" | "created_at" | "updated_at"> = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        birthday: formData.birthday || undefined,
        anniversary: formData.anniversary || undefined,
        donation_day_of_month: formData.donation_day_of_month
          ? parseInt(formData.donation_day_of_month)
          : undefined,
        donation_amount: formData.donation_amount
          ? parseFloat(formData.donation_amount)
          : undefined,
        donation_type: formData.donation_type,
        status: formData.status,
        notes: formData.notes || undefined,
      };

      await onSave(data);
      setFormData({
        name: "",
        phone: "",
        email: "",
        birthday: "",
        anniversary: "",
        donation_day_of_month: "",
        donation_amount: "",
        donation_type: "monthly",
        status: "active",
        notes: "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Devotee name"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91XXXXXXXXXX"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div>
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="anniversary">Anniversary</Label>
              <Input
                id="anniversary"
                type="date"
                value={formData.anniversary}
                onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })}
              />
            </div>

            {/* Donation Info */}
            <div>
              <Label htmlFor="donation_day">Donation Day of Month</Label>
              <Input
                id="donation_day"
                type="number"
                min="1"
                max="31"
                value={formData.donation_day_of_month}
                onChange={(e) => setFormData({ ...formData, donation_day_of_month: e.target.value })}
                placeholder="25"
              />
            </div>

            <div>
              <Label htmlFor="donation_amount">Donation Amount (₹)</Label>
              <Input
                id="donation_amount"
                type="number"
                step="0.01"
                value={formData.donation_amount}
                onChange={(e) => setFormData({ ...formData, donation_amount: e.target.value })}
                placeholder="500"
              />
            </div>

            <div>
              <Label htmlFor="donation_type">Donation Type</Label>
              <Select value={formData.donation_type} onValueChange={(value: any) => setFormData({ ...formData, donation_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.phone}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Saving..." : devotee ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
