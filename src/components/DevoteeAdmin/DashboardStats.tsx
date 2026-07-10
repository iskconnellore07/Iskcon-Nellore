// src/components/DevoteeAdmin/DashboardStats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";

interface DashboardStatsProps {
  devoteStats: { active: number; inactive: number; paused: number };
  msgStats: { sent: number; failed: number; pending: number };
}

export default function DashboardStats({ devoteStats, msgStats }: DashboardStatsProps) {
  const totalDevotees = devoteStats.active + devoteStats.inactive + devoteStats.paused;
  const totalMessages = msgStats.sent + msgStats.failed + msgStats.pending;
  const successRate = totalMessages > 0 ? ((msgStats.sent / totalMessages) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Devotees */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Devotees</p>
              <p className="text-3xl font-bold text-blue-900">{totalDevotees}</p>
              <p className="text-xs text-blue-600 mt-1">
                {devoteStats.active} active
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-300 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Active Devotees */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Devotees</p>
              <p className="text-3xl font-bold text-green-900">{devoteStats.active}</p>
              <p className="text-xs text-green-600 mt-1">
                {totalDevotees > 0 ? ((devoteStats.active / totalDevotees) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-300 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* SMS Success Rate */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">SMS Success Rate</p>
              <p className="text-3xl font-bold text-orange-900">{successRate}%</p>
              <p className="text-xs text-orange-600 mt-1">
                {msgStats.sent} of {totalMessages}
              </p>
            </div>
            <MessageSquare className="w-12 h-12 text-orange-300 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Failed Messages */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Failed Messages</p>
              <p className="text-3xl font-bold text-red-900">{msgStats.failed}</p>
              <p className="text-xs text-red-600 mt-1">
                {msgStats.pending} pending
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-300 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
