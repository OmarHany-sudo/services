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
  MessageCircle, 
  Plus, 
  Send, 
  RefreshCw,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const WhatsApp = () => {
  const [showAddNumber, setShowAddNumber] = useState(false)
  const [showSendMessage, setShowSendMessage] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [messageRecipient, setMessageRecipient] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch WhatsApp numbers
  const { data: numbersData, isLoading: numbersLoading } = useQuery({
    queryKey: ['whatsapp-numbers'],
    queryFn: async () => {
      const response = await axios.get('/api/whatsapp/numbers')
      return response.data
    }
  })

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const response = await axios.get('/api/whatsapp/templates')
      return response.data
    }
  })

  // Add number mutation
  const addNumberMutation = useMutation({
    mutationFn: async (numberData) => {
      const response = await axios.post('/api/whatsapp/numbers', numberData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsapp-numbers'])
      setShowAddNumber(false)
      toast({
        title: "Number added",
        description: "WhatsApp number has been added successfully.",
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to add number",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      })
    }
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ numberId, recipient, message, templateId }) => {
      const response = await axios.post(`/api/whatsapp/numbers/${numberId}/send-message`, {
        recipient,
        message,
        templateId
      })
      return response.data
    },
    onSuccess: () => {
      setShowSendMessage(false)
      setMessageRecipient('')
      setMessageContent('')
      setSelectedTemplate('')
      toast({
        title: "Message sent",
        description: "Your WhatsApp message has been sent successfully.",
      })
    },
    onError: (error) => {
      toast({
        title: "Message failed",
        description: error.response?.data?.error || "Failed to send message",
        variant: "destructive",
      })
    }
  })

  // Verify number mutation
  const verifyNumberMutation = useMutation({
    mutationFn: async (numberId) => {
      const response = await axios.post(`/api/whatsapp/numbers/${numberId}/verify`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsapp-numbers'])
      toast({
        title: "Verification started",
        description: "Number verification process has been initiated.",
      })
    },
    onError: (error) => {
      toast({
        title: "Verification failed",
        description: error.response?.data?.error || "Failed to start verification",
        variant: "destructive",
      })
    }
  })

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      VERIFIED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      INACTIVE: 'bg-gray-100 text-gray-800'
    }
    
    const icons = {
      PENDING: Clock,
      VERIFIED: CheckCircle,
      FAILED: XCircle,
      ACTIVE: CheckCircle,
      INACTIVE: XCircle
    }
    
    const Icon = icons[status] || Clock
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const handleSendMessage = () => {
    if (!selectedNumber || !messageRecipient) {
      toast({
        title: "Missing information",
        description: "Please select a number and recipient.",
        variant: "destructive",
      })
      return
    }

    if (!selectedTemplate && !messageContent) {
      toast({
        title: "Missing message",
        description: "Please select a template or enter a message.",
        variant: "destructive",
      })
      return
    }

    sendMessageMutation.mutate({
      numberId: selectedNumber.id,
      recipient: messageRecipient,
      message: messageContent,
      templateId: selectedTemplate
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business</h1>
          <p className="text-gray-600">Manage your WhatsApp Business numbers and messaging</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowTemplates(true)}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Dialog open={showAddNumber} onOpenChange={setShowAddNumber}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add WhatsApp Number</DialogTitle>
                <DialogDescription>
                  Add a new WhatsApp Business number to your account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    placeholder="Business Name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://your-domain.com/webhook"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddNumber(false)}>
                  Cancel
                </Button>
                <Button onClick={() => addNumberMutation.mutate({})}>
                  Add Number
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Numbers</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numbersData?.numbers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Numbers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {numbersData?.numbers?.filter(num => num.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {templatesData?.templates?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {numbersData?.numbers?.reduce((sum, num) => sum + (num.messagesSent || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Numbers */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Numbers</CardTitle>
          <CardDescription>
            Your registered WhatsApp Business numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {numbersLoading ? (
            <div className="text-center py-8">Loading numbers...</div>
          ) : numbersData?.numbers?.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No WhatsApp Numbers</h3>
              <p className="text-gray-500 mb-4">
                Add your first WhatsApp Business number to start messaging
              </p>
              <Button onClick={() => setShowAddNumber(true)}>
                Add Number
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages Sent</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbersData.numbers.map((number) => (
                  <TableRow key={number.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="font-mono">{number.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{number.displayName}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(number.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Total: {number.messagesSent || 0}</div>
                        <div className="text-gray-500">
                          This month: {number.messagesThisMonth || 0}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(number.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {number.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => verifyNumberMutation.mutate(number.id)}
                            disabled={verifyNumberMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        {number.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedNumber(number)
                              setShowSendMessage(true)
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={showSendMessage} onOpenChange={setShowSendMessage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
            <DialogDescription>
              Send a message from {selectedNumber?.displayName} ({selectedNumber?.phoneNumber})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient Phone Number</Label>
              <Input
                id="recipient"
                type="tel"
                placeholder="+1234567890"
                value={messageRecipient}
                onChange={(e) => setMessageRecipient(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>
            
            <div>
              <Label htmlFor="template">Message Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a template or write custom message" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Custom Message</SelectItem>
                  {templatesData?.templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedTemplate && (
              <div>
                <Label htmlFor="message">Custom Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendMessage(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Templates</DialogTitle>
            <DialogDescription>
              Pre-approved WhatsApp message templates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {templatesLoading ? (
              <div className="text-center py-8">Loading templates...</div>
            ) : templatesData?.templates?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No templates found</p>
              </div>
            ) : (
              templatesData?.templates?.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge className={
                          template.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {template.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{template.category}</p>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {template.content}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compliance Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-900">
            <MessageCircle className="h-5 w-5 mr-2" />
            WhatsApp Business Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-800 text-sm">
            All WhatsApp messaging complies with WhatsApp Business API policies. Messages can only 
            be sent to users who have opted in to receive communications. Template messages require 
            pre-approval from WhatsApp. Session messages are limited to 24 hours after user interaction.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default WhatsApp

