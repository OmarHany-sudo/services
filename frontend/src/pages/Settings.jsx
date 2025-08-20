import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  User, 
  Bell, 
  Shield, 
  Key,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Copy,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const Settings = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [showCreateApiKey, setShowCreateApiKey] = useState(false)
  const [showNewApiKey, setShowNewApiKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    timezone: 'UTC',
    language: 'en'
  })
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    campaignUpdates: true,
    leadNotifications: true,
    systemAlerts: true
  })

  // Fetch user settings
  const { data: settingsData } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const response = await axios.get('/api/users/settings')
      return response.data
    },
    onSuccess: (data) => {
      if (data.profile) {
        setProfileData(prev => ({ ...prev, ...data.profile }))
      }
      if (data.notifications) {
        setNotificationSettings(prev => ({ ...prev, ...data.notifications }))
      }
    }
  })

  // Fetch API keys
  const { data: apiKeysData } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await axios.get('/api/users/api-keys')
      return response.data
    },
    enabled: showApiKeys
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put('/api/users/profile', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-settings'])
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive",
      })
    }
  })

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put('/api/users/notifications', data)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved.",
      })
    }
  })

  // Create API key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/api/users/api-keys', data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['api-keys'])
      setNewApiKey(data.api_key)
      setShowCreateApiKey(false)
      setShowNewApiKey(true)
      toast({
        title: "API key created",
        description: "Your new API key has been generated.",
      })
    }
  })

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (keyId) => {
      const response = await axios.delete(`/api/users/api-keys/${keyId}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['api-keys'])
      toast({
        title: "API key deleted",
        description: "The API key has been deleted successfully.",
      })
    }
  })

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/users/export-data', {}, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `user_data_export_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast({
        title: "Data exported",
        description: "Your data has been exported successfully.",
      })
    }
  })

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileData)
  }

  const handleNotificationChange = (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value }
    setNotificationSettings(newSettings)
    updateNotificationsMutation.mutate(newSettings)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "API key copied to clipboard.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={profileData.timezone} 
                onValueChange={(value) => setProfileData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select 
                value={profileData.language} 
                onValueChange={(value) => setProfileData(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleProfileSave}
              disabled={updateProfileMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="campaign-updates">Campaign Updates</Label>
                <p className="text-sm text-gray-500">Get notified about campaign status changes</p>
              </div>
              <Switch
                id="campaign-updates"
                checked={notificationSettings.campaignUpdates}
                onCheckedChange={(checked) => handleNotificationChange('campaignUpdates', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lead-notifications">New Lead Notifications</Label>
                <p className="text-sm text-gray-500">Get notified when new leads are captured</p>
              </div>
              <Switch
                id="lead-notifications"
                checked={notificationSettings.leadNotifications}
                onCheckedChange={(checked) => handleNotificationChange('leadNotifications', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-alerts">System Alerts</Label>
                <p className="text-sm text-gray-500">Important system and security notifications</p>
              </div>
              <Switch
                id="system-alerts"
                checked={notificationSettings.systemAlerts}
                onCheckedChange={(checked) => handleNotificationChange('systemAlerts', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Keys
          </CardTitle>
          <CardDescription>
            Manage API keys for programmatic access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Use API keys to integrate with external applications
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowApiKeys(!showApiKeys)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showApiKeys ? 'Hide' : 'Show'} Keys
              </Button>
              <Dialog open={showCreateApiKey} onOpenChange={setShowCreateApiKey}>
                <DialogTrigger asChild>
                  <Button>
                    <Key className="h-4 w-4 mr-2" />
                    Create API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Generate a new API key for programmatic access
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="My API Key"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="key-description">Description (Optional)</Label>
                      <Textarea
                        id="key-description"
                        placeholder="What will this key be used for?"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateApiKey(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => createApiKeyMutation.mutate({})}>
                      Create Key
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {showApiKeys && (
            <div className="space-y-3">
              {apiKeysData?.api_keys?.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No API keys created yet
                </p>
              ) : (
                apiKeysData?.api_keys?.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{key.name}</div>
                      <div className="text-sm text-gray-500">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={key.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Applications using this key will lose access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteApiKeyMutation.mutate(key.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-gray-500">
                Download a copy of all your data in JSON format
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => exportDataMutation.mutate()}
              disabled={exportDataMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportDataMutation.isPending ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* New API Key Dialog */}
      <Dialog open={showNewApiKey} onOpenChange={setShowNewApiKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your new API key has been generated. Copy it now as it won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono break-all">{newApiKey}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(newApiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-red-600">
              ⚠️ Store this key securely. It won't be displayed again.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewApiKey(false)}>
              I've Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Settings

