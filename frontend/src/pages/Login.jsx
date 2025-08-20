import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Facebook, Shield, Users, MessageSquare } from 'lucide-react'

const Login = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleFacebookLogin = () => {
    // Redirect to backend Facebook OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/facebook/login`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Controls Tools</h2>
          <p className="mt-2 text-sm text-gray-600">
            Consent-first social media lead generation platform
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in with your Facebook account to manage your social media campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleFacebookLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Facebook className="mr-2 h-5 w-5" />
              Continue with Facebook
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Shield className="h-5 w-5 text-blue-500" />
            <span>Consent-first data collection</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Users className="h-5 w-5 text-blue-500" />
            <span>Advanced lead management</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <span>Multi-platform messaging</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Enterprise-grade security and compliance</p>
          <p className="mt-1">GDPR compliant • SOC 2 certified</p>
        </div>
      </div>
    </div>
  )
}

export default Login

