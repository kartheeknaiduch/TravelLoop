import { useState } from "react";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { getGetAdminStatsQueryKey, useGetAdminStats } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Map, Globe, Activity, TrendingUp, Search, Shield, Mail, MapPin } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export default function AdminDashboard() {
  const { user } = useAuthRedirect();
  const { data: stats, isLoading } = useGetAdminStats({
    query: { enabled: !!user?.isAdmin, queryKey: getGetAdminStatsQueryKey() }
  });
  const [userSearch, setUserSearch] = useState("");

  if (user && !user.isAdmin) {
    return (
      <div className="p-10 text-center space-y-4">
        <Shield className="w-16 h-16 text-destructive/40 mx-auto" />
        <h2 className="text-2xl font-serif font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground">This page is restricted to administrators only.</p>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const COLORS = ['#f97316', '#0f172a', '#10b981', '#3b82f6'];

  const cityData = stats.topCities.map(c => ({ name: c.name, popularity: c.popularity }));
  
  const platformData = [
    { name: 'Users', value: stats.totalUsers },
    { name: 'Trips', value: stats.totalTrips },
    { name: 'Cities', value: stats.totalCities },
    { name: 'Activities', value: stats.totalActivities }
  ];

  const filteredUsers = stats.recentUsers.filter(u => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return u.firstName.toLowerCase().includes(search) 
      || u.lastName.toLowerCase().includes(search)
      || u.email.toLowerCase().includes(search);
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 bg-muted/10 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-secondary">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor your platform's health and growth.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-medium text-sm flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          +{stats.tripsThisMonth} trips this month
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Trips</p>
              <p className="text-3xl font-bold">{stats.totalTrips}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cities</p>
              <p className="text-3xl font-bold">{stats.totalCities}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Activities</p>
              <p className="text-3xl font-bold">{stats.totalActivities}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Most Popular Cities</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="popularity" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center relative">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-3">
              {platformData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <span className="text-sm font-medium">{entry.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{entry.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>User Management</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search users..." 
              className="pl-9 h-9"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-xs shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <span className="font-medium">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> {u.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" /> {u.city || '—'}{u.city && u.country ? ', ' : ''}{u.country || ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.isAdmin ? "default" : "secondary"} className="text-xs">
                        {u.isAdmin ? "Admin" : "User"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users matching "{userSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
