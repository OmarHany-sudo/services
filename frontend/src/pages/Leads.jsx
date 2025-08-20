import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Shield, 
  ShieldCheck,
  Tag,
  Calendar,
  Mail,
  Phone
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const Leads = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [consentOnly, setConsentOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedLeads, setSelectedLeads] = useState([])
  const [showAddLead, setShowAddLead] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch leads
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', { search, statusFilter, sourceFilter, consentOnly, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25'
      })
      
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      if (sourceFilter) params.append('source', sourceFilter)
      if (consentOnly) params.append('consent_only', 'true')
      
      const response = await axios.get(`/api/leads?${params}`)
      return response.data
    }
  })

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await axios.get('/api/leads/tags')
      return response.data
    }
  })

  // Export leads mutation
  const exportMutation = useMutation({
    mutationFn: async (filters) => {
      const response = await axios.post('/api/leads/export', filters, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Your leads have been exported to CSV.",
      })
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.response?.data?.error || "Failed to export leads",
        variant: "destructive",
      })
    }
  })

  const handleExport = () => {
    const filters = {
      search,
      status: statusFilter,
      source: sourceFilter,
      consent_only: consentOnly
    }
    exportMutation.mutate(filters)
  }

  const getStatusBadge = (status) => {
    const variants = {
      NEW: 'default',
      CONTACTED: 'secondary',
      QUALIFIED: 'outline',
      CONVERTED: 'default',
      UNSUBSCRIBED: 'destructive'
    }
    
    const colors = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-purple-100 text-purple-800',
      CONVERTED: 'bg-green-100 text-green-800',
      UNSUBSCRIBED: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }

  const getSourceBadge = (source) => {
    const colors = {
      FACEBOOK_COMMENT: 'bg-blue-100 text-blue-800',
      FACEBOOK_LIKE: 'bg-blue-100 text-blue-800',
      FACEBOOK_MESSAGE: 'bg-blue-100 text-blue-800',
      FACEBOOK_LEAD_AD: 'bg-blue-100 text-blue-800',
      WEB_FORM: 'bg-green-100 text-green-800',
      WHATSAPP: 'bg-green-100 text-green-800',
      MANUAL: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge variant="outline" className={colors[source] || 'bg-gray-100 text-gray-800'}>
        {source.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600">Manage your lead database and segments</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleExport}
            variant="outline"
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Manually add a new lead to your database
                </DialogDescription>
              </DialogHeader>
              {/* Add lead form would go here */}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddLead(false)}>
                  Cancel
                </Button>
                <Button>Add Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsData?.pagination?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consented</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leadsData?.leads?.filter(lead => lead.consentGiven).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leadsData?.leads?.filter(lead => {
                const createdAt = new Date(lead.createdAt)
                const now = new Date()
                return createdAt.getMonth() === now.getMonth() && 
                       createdAt.getFullYear() === now.getFullYear()
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {leadsData?.leads?.filter(lead => lead.status === 'CONVERTED').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sources</SelectItem>
                <SelectItem value="FACEBOOK_COMMENT">Facebook Comment</SelectItem>
                <SelectItem value="FACEBOOK_LIKE">Facebook Like</SelectItem>
                <SelectItem value="FACEBOOK_MESSAGE">Facebook Message</SelectItem>
                <SelectItem value="FACEBOOK_LEAD_AD">Facebook Lead Ad</SelectItem>
                <SelectItem value="WEB_FORM">Web Form</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent-only"
                checked={consentOnly}
                onCheckedChange={setConsentOnly}
              />
              <Label htmlFor="consent-only" className="text-sm">
                Consented only
              </Label>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setSourceFilter('')
                setConsentOnly(false)
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({leadsData?.pagination?.total || 0})</CardTitle>
          <CardDescription>
            Showing {leadsData?.leads?.length || 0} of {leadsData?.pagination?.total || 0} leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : leadsData?.leads?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leadsData?.leads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(lead.firstName?.[0] || lead.lastName?.[0] || lead.email?.[0] || 'U').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            {lead.email && (
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phoneNumber && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {lead.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(lead.source)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lead.status)}
                    </TableCell>
                    <TableCell>
                      {lead.consentGiven ? (
                        <Badge className="bg-green-100 text-green-800">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          <Shield className="h-3 w-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lead.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {lead.tags?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lead.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {leadsData?.pagination && leadsData.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {leadsData.pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === leadsData.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default Leads

