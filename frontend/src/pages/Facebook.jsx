import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Facebook as FacebookIcon, 
  RefreshCw, 
  Download, 
  MessageSquare,
  ThumbsUp,
  Share,
  Eye,
  Send,
  Users,
  TrendingUp
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const Facebook = () => {
  const [selectedPage, setSelectedPage] = useState(null)
  const [showPosts, setShowPosts] = useState(false)
  const [showSendMessage, setShowSendMessage] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState('')
  const [messageContent, setMessageContent] = useState('')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch Facebook pages
  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['facebook-pages'],
    queryFn: async () => {
      const response = await axios.get('/api/facebook/pages')
      return response.data
    }
  })

  // Fetch posts for selected page
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['facebook-posts', selectedPage?.id],
    queryFn: async () => {
      if (!selectedPage) return null
      const response = await axios.get(`/api/facebook/pages/${selectedPage.id}/posts`)
      return response.data
    },
    enabled: !!selectedPage
  })

  // Refresh pages mutation
  const refreshPagesMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get('/api/facebook/pages')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['facebook-pages'])
      toast({
        title: "Pages refreshed",
        description: "Your Facebook pages have been updated.",
      })
    },
    onError: (error) => {
      toast({
        title: "Refresh failed",
        description: error.response?.data?.error || "Failed to refresh pages",
        variant: "destructive",
      })
    }
  })

  // Import engagement mutation
  const importEngagementMutation = useMutation({
    mutationFn: async (pageId) => {
      const response = await axios.post(`/api/facebook/pages/${pageId}/import-engagement`)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Import started",
        description: "Engagement data import has been queued.",
      })
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.response?.data?.error || "Failed to start import",
        variant: "destructive",
      })
    }
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ pageId, recipient, message }) => {
      const response = await axios.post(`/api/facebook/pages/${pageId}/send-message`, {
        recipient,
        message
      })
      return response.data
    },
    onSuccess: () => {
      setShowSendMessage(false)
      setMessageRecipient('')
      setMessageContent('')
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
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

  const handleSendMessage = () => {
    if (!selectedPage || !messageRecipient || !messageContent) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    sendMessageMutation.mutate({
      pageId: selectedPage.id,
      recipient: messageRecipient,
      message: messageContent
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facebook Integration</h1>
          <p className="text-gray-600">Manage your Facebook Pages and engage with your audience</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => refreshPagesMutation.mutate()}
            variant="outline"
            disabled={refreshPagesMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshPagesMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh Pages
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Pages</CardTitle>
            <FacebookIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagesData?.pages?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pages</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pagesData?.pages?.filter(page => page.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {postsData?.posts?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {postsData?.posts?.reduce((sum, post) => sum + post.likesCount + post.commentsCount, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facebook Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Facebook Pages</CardTitle>
          <CardDescription>
            Your connected Facebook Pages and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pagesLoading ? (
            <div className="text-center py-8">Loading pages...</div>
          ) : pagesData?.pages?.length === 0 ? (
            <div className="text-center py-8">
              <FacebookIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Facebook Pages</h3>
              <p className="text-gray-500 mb-4">
                Connect your Facebook account to start managing your pages
              </p>
              <Button onClick={() => window.location.href = '/api/auth/facebook/login'}>
                Connect Facebook
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagesData.pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {page.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{page.name}</div>
                          <div className="text-sm text-gray-500">ID: {page.facebookPageId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={page.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {page.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(page.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPage(page)
                            setShowPosts(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Posts
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => importEngagementMutation.mutate(page.id)}
                          disabled={importEngagementMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Import
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPage(page)
                            setShowSendMessage(true)
                          }}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Posts Dialog */}
      <Dialog open={showPosts} onOpenChange={setShowPosts}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Posts from {selectedPage?.name}</DialogTitle>
            <DialogDescription>
              Recent posts and their engagement metrics
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {postsLoading ? (
              <div className="text-center py-8">Loading posts...</div>
            ) : postsData?.posts?.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No posts found for this page</p>
              </div>
            ) : (
              postsData?.posts?.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {post.message && (
                        <p className="text-sm">{post.message}</p>
                      )}
                      {post.story && (
                        <p className="text-sm text-gray-600 italic">{post.story}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {post.likesCount} likes
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {post.commentsCount} comments
                        </div>
                        <div className="flex items-center">
                          <Share className="h-4 w-4 mr-1" />
                          {post.sharesCount} shares
                        </div>
                        <div className="ml-auto">
                          {new Date(post.createdTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPosts(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showSendMessage} onOpenChange={setShowSendMessage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Messenger Message</DialogTitle>
            <DialogDescription>
              Send a message via Facebook Messenger from {selectedPage?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient Facebook User ID</Label>
              <input
                id="recipient"
                type="text"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Facebook User ID"
                value={messageRecipient}
                onChange={(e) => setMessageRecipient(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Only users who have messaged your page or given consent can receive messages
              </p>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendMessage(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !messageRecipient || !messageContent}
            >
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compliance Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <FacebookIcon className="h-5 w-5 mr-2" />
            Facebook Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 text-sm">
            All Facebook integrations comply with Meta's Platform Policies. Only public data and 
            data from users who have interacted with your pages is collected. Messaging is limited 
            to users who have messaged your page or explicitly consented to receive messages.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Facebook

