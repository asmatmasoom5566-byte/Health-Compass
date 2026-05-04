import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Users, Shield, Activity, Search, UserCheck, UserX, Clock, Key, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface User {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  role: string;
  profession: string;
  country: string | null;
  clinicHospital: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

interface InviteCode {
  id: number;
  code: string;
  email: string | null;
  phone: string | null;
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, hasRole, logout } = useAuth();
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, codesRes, auditRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/invite-codes'),
        fetch('/api/admin/audit-trail'),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      }
      if (codesRes.ok) {
        const data = await codesRes.json();
        setInviteCodes(data.inviteCodes);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditTrail(data.auditTrail);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccess('User status updated successfully');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setSuccess('User role updated successfully');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  const handleCreateInviteCode = async (email?: string) => {
    try {
      const response = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, maxUses: 1 }),
      });

      if (response.ok) {
        setSuccess('Invite code created successfully');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to create invite code');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'suspended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-500',
      editor: 'bg-blue-500',
      reviewer: 'bg-green-500',
      standard_member: 'bg-gray-500',
      read_only_member: 'bg-gray-400',
    };
    return colors[role] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage users, invite codes, and monitor activity</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => logout()} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="invites">
              <Key className="mr-2 h-4 w-4" />
              Invite Codes ({inviteCodes.length})
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="mr-2 h-4 w-4" />
              Audit Trail ({auditTrail.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Search, filter, and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{u.fullName}</h3>
                          <Badge className={getStatusColor(u.status)}>{u.status}</Badge>
                          <Badge className={getRoleBadge(u.role)}>{u.role.replace('_', ' ')}</Badge>
                          {u.emailVerified && <Badge variant="outline">Email ✓</Badge>}
                          {u.phoneVerified && <Badge variant="outline">Phone ✓</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {u.email || u.phone} • {u.profession} • {u.country || 'No country'} • Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {u.status === 'pending' && (
                          <Button size="sm" onClick={() => handleStatusChange(u.id, 'approved')}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {u.status === 'pending' && (
                          <Button size="sm" variant="destructive" onClick={() => handleStatusChange(u.id, 'rejected')}>
                            <UserX className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        )}
                        {u.status === 'approved' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(u.id, 'suspended')}>
                            Suspend
                          </Button>
                        )}
                        {u.status === 'suspended' && (
                          <Button size="sm" onClick={() => handleStatusChange(u.id, 'approved')}>
                            Reactivate
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">Change Role</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change User Role</DialogTitle>
                              <DialogDescription>Select a new role for {u.fullName}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Select onValueChange={(role) => handleRoleChange(u.id, role)} defaultValue={u.role}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="reviewer">Reviewer</SelectItem>
                                  <SelectItem value="standard_member">Standard Member</SelectItem>
                                  <SelectItem value="read_only_member">Read-Only Member</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites">
            <Card>
              <CardHeader>
                <CardTitle>Invite Codes</CardTitle>
                <CardDescription>Create and manage invitation codes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleCreateInviteCode()} className="mb-4">
                  <Key className="mr-2 h-4 w-4" />
                  Generate New Invite Code
                </Button>

                <div className="space-y-2">
                  {inviteCodes.map((code) => (
                    <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <code className="bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded font-mono text-sm">
                            {code.code}
                          </code>
                          <Badge variant={code.isActive ? 'default' : 'secondary'}>
                            {code.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {code.email || code.phone || 'No restriction'} • Used {code.usedCount}/{code.maxUses} times
                          {code.expiresAt && ` • Expires ${new Date(code.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>User status change history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditTrail.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">
                          User #{entry.userId} status changed: {entry.previousStatus} → {entry.newStatus}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()} • By Admin #{entry.changedBy}
                          {entry.reason && ` • Reason: ${entry.reason}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
