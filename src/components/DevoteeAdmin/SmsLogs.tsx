// src/components/DevoteeAdmin/SmsLogs.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { SmsLog } from "@/integrations/supabase/devotee-types";

interface SmsLogsProps {
  logs: SmsLog[];
}

export default function SmsLogs({ logs }: SmsLogsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case "donation_reminder":
        return <Badge variant="outline" className="bg-blue-50">Donation Reminder</Badge>;
      case "birthday":
        return <Badge variant="outline" className="bg-pink-50">Birthday</Badge>;
      case "anniversary":
        return <Badge variant="outline" className="bg-purple-50">Anniversary</Badge>;
      case "manual":
        return <Badge variant="outline" className="bg-gray-50">Manual</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMS Logs</CardTitle>
          <CardDescription>No SMS messages sent yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">SMS history will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Logs</CardTitle>
        <CardDescription>{logs.length} message(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-orange-50">
                  <TableCell className="text-sm">
                    {log.sent_at
                      ? new Date(log.sent_at).toLocaleString("en-IN")
                      : new Date(log.created_at).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>{getMessageTypeBadge(log.message_type)}</TableCell>
                  <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {log.message}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-sm">
                    {log.sms_provider ? (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        {log.sms_provider.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Error Details */}
        {logs.some((log) => log.error_message) && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold text-red-600 mb-3">Failed Messages Details:</h4>
            <div className="space-y-2">
              {logs
                .filter((log) => log.error_message)
                .map((log) => (
                  <div key={log.id} className="bg-red-50 p-3 rounded text-sm">
                    <p className="font-mono">{log.phone}</p>
                    <p className="text-red-600">{log.error_message}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
