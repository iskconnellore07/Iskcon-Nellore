// src/components/DevoteeAdmin/DevoteeTable.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Trash2, Eye } from "lucide-react";
import type { Devotee } from "@/integrations/supabase/devotee-types";

interface DevoteeTableProps {
  devotees: Devotee[];
  onSelect: (devotee: Devotee) => void;
  onEdit: (devotee: Devotee) => void;
  onDelete: (id: string) => void;
}

export default function DevoteeTable({ devotees, onSelect, onEdit, onDelete }: DevoteeTableProps) {
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getDonationTypeColor = (type?: string) => {
    switch (type) {
      case "monthly":
        return "text-blue-600";
      case "yearly":
        return "text-purple-600";
      case "one-time":
        return "text-orange-600";
      default:
        return "";
    }
  };

  if (devotees.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">No devotees found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Donation</TableHead>
                <TableHead>Birthday</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devotees.map((devotee) => (
                <TableRow key={devotee.id} className="hover:bg-orange-50">
                  <TableCell className="font-medium">{devotee.name}</TableCell>
                  <TableCell>{devotee.phone}</TableCell>
                  <TableCell>
                    {devotee.donation_amount ? (
                      <div className={getDonationTypeColor(devotee.donation_type)}>
                        ₹{devotee.donation_amount.toLocaleString()} ({devotee.donation_type})
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {devotee.birthday ? new Date(devotee.birthday).toLocaleDateString("en-IN") : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(devotee.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelect(devotee)}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(devotee)}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(devotee.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
