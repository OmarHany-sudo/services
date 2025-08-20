import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { 
  Shield, 
  Users, 
  Activity, 
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  FileText,
  Search,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Navigate } from 'react-router-dom'

const Admin = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditResourceFilter, setAuditResourceFilter] = useState('')

  // Redirect if not admin
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/dashboard')
      return response.data
    }
  })

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', { search: userSearch, role: userRoleFilter }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (userSearch) params.append('search', userSearch)
      if (userRoleFilter) params.append('role', userRoleFilter)
      
      const response = await axios.get(`/api/admin/users?${params}`)
      return response.data
    },
    enabled: activeTab === 'users'
  })

  // Fetch audit logs
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit', { search: auditSearch, resource: auditResourceFilter }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (auditSearch) params.append('action', auditSearch)
      if (auditResourceFilter) params.append('resource', auditResourceFilter)
      
      const response = await axios.get(`/api/admin/audit-logs?${params}`)
      return response.data
    },
    enabled: activeTab === 'audit'
  })

  // Fetch system health
  const { data: healthData } = useQuery({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/system-health')
      return response.data
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const response = await axios.put(`/api/admin/users/${userId}/role`, { role })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast({
        title: "User role updated",
        description: "The user's role has been updated successfully.",
      })
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.response?.data?.error || "Failed to update user role",
        variant: "destructive",
      })
    }
  })

  const getHealthStatus = (status) => {
    if (status === 'healthy' || status === 'operational') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>
    } else if (status === 'warning') {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Error</Badge>
    }
  }

  const getRoleBadge = (role) => {
    return (
      <Badge className={role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
        {role}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Platform administration and monitoring</p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries()}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.stats?.users?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.stats?.users?.active_last_30_days || 0} active this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.stats?.leads?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.stats?.leads?.consent_rate || 0}% consent rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.stats?.messages?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.stats?.messages?.success_rate || 0}% success rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.stats?.campaigns?.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.stats?.campaigns?.total || 0} total campaigns
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Current status of platform components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database</span>
                  {getHealthStatus(healthData?.database)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Redis Cache</span>
                  {getHealthStatus(healthData?.redis)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Message Queues</span>
                  {getHealthStatus('healthy')}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">API Integrations</span>
                  {getHealthStatus('healthy')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recent_activity?.slice(0, 10).map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.user?.name || 'System'} • {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.resource}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All roles</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : usersData?.users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    usersData?.users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(role) => updateUserRoleMutation.mutate({ userId: user.id, role })}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Track all system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search actions..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={auditResourceFilter} onValueChange={setAuditResourceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All resources</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading audit logs...
                      </TableCell>
                    </TableRow>
                  ) : auditData?.logs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditData?.logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.action.replace(/_/g, ' ')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {log.user?.name?.charAt(0)?.toUpperCase() || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {log.user?.name || 'System'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.resource}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{log.ipAddress || 'N/A'}</code>
                        </TableCell>
                        <TableCell>
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Health Details */}
            <Card>
              <CardHeader>
                <CardTitle>System Health Details</CardTitle>
                <CardDescription>Detailed status of all system components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Database Connection</span>
                    {getHealthStatus(healthData?.database)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Redis Cache</span>
                    {getHealthStatus(healthData?.redis)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Facebook API</span>
                    {getHealthStatus(healthData?.api_integrations?.facebook)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">WhatsApp API</span>
                    {getHealthStatus(healthData?.api_integrations?.whatsapp)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Twilio API</span>
                    {getHealthStatus(healthData?.api_integrations?.twilio)}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Last checked: {healthData?.last_checked ? new Date(healthData.last_checked).toLocaleString() : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Queue Status */}
            <Card>
              <CardHeader>
                <CardTitle>Message Queues</CardTitle>
                <CardDescription>Status of background job queues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Message Queue</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {healthData?.queues?.message_queue?.active || 0} active
                      </div>
                      <div className="text-xs text-gray-500">
                        {healthData?.queues?.message_queue?.waiting || 0} waiting
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Import Queue</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {healthData?.queues?.import_queue?.active || 0} active
                      </div>
                      <div className="text-xs text-gray-500">
                        {healthData?.queues?.import_queue?.waiting || 0} waiting
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Campaign Queue</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {healthData?.queues?.campaign_queue?.active || 0} active
                      </div>
                      <div className="text-xs text-gray-500">
                        {healthData?.queues?.campaign_queue?.waiting || 0} waiting
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Admin

