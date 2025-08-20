import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  MessageSquare, 
  Facebook, 
  MessageCircle, 
  TrendingUp, 
  Shield,
  Activity,
  Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/dashboard')
      return response.data
    }
  })

  const stats = dashboardData?.stats || {}

  const StatCard = ({ title, value, description, icon: Icon, trend, color = "blue" }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isLoading ? '...' : value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            <span className="text-xs text-green-600">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your social media marketing activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.leads?.total || 0}
          description="All leads in your database"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Consented Leads"
          value={stats.leads?.consented || 0}
          description={`${stats.leads?.consent_rate || 0}% consent rate`}
          icon={Shield}
          color="green"
        />
        <StatCard
          title="Messages Sent"
          value={stats.messages?.sent || 0}
          description={`${stats.messages?.success_rate || 0}% success rate`}
          icon={MessageSquare}
          color="purple"
        />
        <StatCard
          title="Active Campaigns"
          value={stats.campaigns?.active || 0}
          description={`${stats.campaigns?.total || 0} total campaigns`}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Facebook className="h-5 w-5 mr-2 text-blue-600" />
              Facebook Pages
            </CardTitle>
            <CardDescription>
              {stats.facebook_pages?.active || 0} of {stats.facebook_pages?.total || 0} pages active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/facebook">Manage Pages</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
              WhatsApp Business
            </CardTitle>
            <CardDescription>
              {stats.whatsapp_numbers?.active || 0} of {stats.whatsapp_numbers?.total || 0} numbers active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/whatsapp">Manage Numbers</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Lead Management
            </CardTitle>
            <CardDescription>
              Import and manage your leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/leads">View Leads</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recent_activity?.slice(0, 5).map((activity, index) => (
                <div key={activity.id || index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.action.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.user?.name || 'System'} • {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Platform health and integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Message Queue</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Facebook API</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WhatsApp API</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Connected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Shield className="h-5 w-5 mr-2" />
            Consent-First Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 text-sm">
            This platform is designed with privacy and consent at its core. All data collection 
            and messaging activities require explicit user consent and comply with GDPR, CCPA, 
            and other privacy regulations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

