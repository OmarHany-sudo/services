import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Eye,
  Calendar,
  MessageSquare,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const Campaigns = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch campaigns
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns', { statusFilter, typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)
      
      const response = await axios.get(`/api/campaigns?${params}`)
      return response.data
    }
  })

  // Campaign actions mutations
  const startCampaignMutation = useMutation({
    mutationFn: async (campaignId) => {
      const response = await axios.post(`/api/campaigns/${campaignId}/start`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns'])
      toast({
        title: "Campaign started",
        description: "Your campaign has been started successfully.",
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to start campaign",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      })
    }
  })

  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId) => {
      const response = await axios.post(`/api/campaigns/${campaignId}/pause`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns'])
      toast({
        title: "Campaign paused",
        description: "Your campaign has been paused.",
      })
    }
  })

  const cancelCampaignMutation = useMutation({
    mutationFn: async (campaignId) => {
      const response = await axios.post(`/api/campaigns/${campaignId}/cancel`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns'])
      toast({
        title: "Campaign cancelled",
        description: "Your campaign has been cancelled.",
      })
    }
  })

  // Preview campaign mutation
  const previewMutation = useMutation({
    mutationFn: async (campaignId) => {
      const response = await axios.post(`/api/campaigns/${campaignId}/preview`)
      return response.data
    }
  })

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      RUNNING: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }

  const getTypeBadge = (type) => {
    const colors = {
      WHATSAPP_TEMPLATE: 'bg-green-100 text-green-800',
      MESSENGER_BROADCAST: 'bg-blue-100 text-blue-800',
      FOLLOW_UP: 'bg-purple-100 text-purple-800'
    }
    
    return (
      <Badge variant="outline" className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const handlePreview = async (campaign) => {
    setSelectedCampaign(campaign)
    try {
      const previewData = await previewMutation.mutateAsync(campaign.id)
      setSelectedCampaign({ ...campaign, preview: previewData })
      setShowPreview(true)
    } catch (error) {
      toast({
        title: "Preview failed",
        description: error.response?.data?.error || "Failed to generate preview",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">Create and manage your messaging campaigns</p>
        </div>
        <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new messaging campaign for your leads
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" className="col-span-3" placeholder="Campaign name" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP_TEMPLATE">WhatsApp Template</SelectItem>
                    <SelectItem value="MESSENGER_BROADCAST">Messenger Broadcast</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">
                  Message
                </Label>
                <Textarea 
                  id="message" 
                  className="col-span-3" 
                  placeholder="Your message template..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
                Cancel
              </Button>
              <Button>Create Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignsData?.pagination?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaignsData?.campaigns?.filter(c => c.status === 'RUNNING').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {campaignsData?.campaigns?.filter(c => c.status === 'SCHEDULED').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {campaignsData?.campaigns?.filter(c => c.status === 'COMPLETED').length || 0}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="WHATSAPP_TEMPLATE">WhatsApp Template</SelectItem>
                <SelectItem value="MESSENGER_BROADCAST">Messenger Broadcast</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('')
                setTypeFilter('')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({campaignsData?.pagination?.total || 0})</CardTitle>
          <CardDescription>
            Manage your messaging campaigns and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading campaigns...
                  </TableCell>
                </TableRow>
              ) : campaignsData?.campaigns?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                campaignsData?.campaigns?.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-gray-500">
                          {campaign.description || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(campaign.type)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Total: {campaign.messageStats?.total || 0}</div>
                        <div className="text-gray-500">
                          Sent: {campaign.messageStats?.sent || 0} | 
                          Failed: {campaign.messageStats?.failed || 0}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {campaign.messageStats?.total > 0 ? (
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{
                                  width: `${(campaign.messageStats.sent / campaign.messageStats.total) * 100}%`
                                }}
                              ></div>
                            </div>
                            <span>
                              {Math.round((campaign.messageStats.sent / campaign.messageStats.total) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(campaign)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startCampaignMutation.mutate(campaign.id)}
                            disabled={startCampaignMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : campaign.status === 'RUNNING' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => pauseCampaignMutation.mutate(campaign.id)}
                            disabled={pauseCampaignMutation.isPending}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {campaign.status !== 'COMPLETED' && campaign.status !== 'CANCELLED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelCampaignMutation.mutate(campaign.id)}
                            disabled={cancelCampaignMutation.isPending}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Preview</DialogTitle>
            <DialogDescription>
              Review your campaign before sending
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedCampaign.name}</h3>
                <p className="text-sm text-gray-500">{selectedCampaign.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Type</Label>
                  <div className="mt-1">
                    {getTypeBadge(selectedCampaign.type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedCampaign.status)}
                  </div>
                </div>
              </div>

              {selectedCampaign.preview && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Total Leads</Label>
                      <div className="text-2xl font-bold">{selectedCampaign.preview.total_leads}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Eligible Leads</Label>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedCampaign.preview.eligible_leads}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Message Template</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                      {selectedCampaign.preview.message_template}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Estimated Cost</Label>
                    <div className="text-lg font-medium">${selectedCampaign.preview.estimated_cost}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            {selectedCampaign?.status === 'DRAFT' && (
              <Button onClick={() => {
                startCampaignMutation.mutate(selectedCampaign.id)
                setShowPreview(false)
              }}>
                Start Campaign
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Campaigns

