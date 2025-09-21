'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Zap, 
  Calendar,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface UserStats {
  totalGenerations: number
  monthlyGenerations: number
  creditsUsed: number
  creditsRemaining: number
  tier: string
  subscriptionStatus: string
  joinDate: string
}

export default function DashboardPage() {
  const { user, session } = useAuth()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    try {
      // Get user profile and stats
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      // Get generation count
      const { count: totalGenerations } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Get monthly generations
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: monthlyGenerations } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString())

      // Get credit info
      const { data: creditData } = await supabase
        .from('user_credits')
        .select('available_credits, used_credits')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setUserStats({
        totalGenerations: totalGenerations || 0,
        monthlyGenerations: monthlyGenerations || 0,
        creditsUsed: creditData?.used_credits || 0,
        creditsRemaining: creditData?.available_credits || 0,
        tier: profile?.tier || 'free',
        subscriptionStatus: profile?.subscription_status || 'inactive',
        joinDate: profile?.created_at || new Date().toISOString()
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'oklch(21% 0.034 264.665)' }}>
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'oklch(21% 0.034 264.665)' }}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                Please sign in to access your dashboard.
              </p>
              <Button asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(21% 0.034 264.665)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {userStats?.tier === 'admin' ? 'Admin' : user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-300">
            Here&apos;s what&apos;s happening with your VaryAI account.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Generations
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {userStats?.totalGenerations || 0}
              </div>
              <p className="text-xs text-gray-300">
                All time creations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                This Month
              </CardTitle>
              <Calendar className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {userStats?.monthlyGenerations || 0}
              </div>
              <p className="text-xs text-gray-300">
                Monthly generations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Credits Remaining
              </CardTitle>
              <Zap className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {userStats?.creditsRemaining || 0}
              </div>
              <p className="text-xs text-gray-300">
                Available credits
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Current Plan
              </CardTitle>
              <CreditCard className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={userStats?.tier === 'free' ? 'secondary' : 'default'}
                  className="text-white"
                >
                  {userStats?.tier?.toUpperCase() || 'FREE'}
                </Badge>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                {userStats?.subscriptionStatus || 'inactive'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="generations" className="text-white data-[state=active]:bg-white/20">
              Generations
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-white data-[state=active]:bg-white/20">
              Billing
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-white/20">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-300">
                    Get started with VaryAI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href="/generate">
                      <Zap className="mr-2 h-4 w-4" />
                      Start Generating
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    <Link href="/community">
                      <Users className="mr-2 h-4 w-4" />
                      Browse Community
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Account Info</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-white" />
                    <span className="text-white">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-white" />
                    <span className="text-white">
                      Member since {new Date(userStats?.joinDate || '').toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-white" />
                    <span className="text-white">
                      {userStats?.creditsUsed || 0} credits used
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="generations" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Your Generations</CardTitle>
                <CardDescription className="text-gray-300">
                  View and manage your created content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-white mx-auto mb-4 opacity-50" />
                  <p className="text-white mb-4">
                    You&apos;ve created {userStats?.totalGenerations || 0} pieces of content
                  </p>
                  <Button asChild>
                    <Link href="/generate">Create More Content</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Billing & Subscription</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Current Plan</p>
                    <p className="text-gray-300 text-sm">
                      {userStats?.tier?.toUpperCase() || 'FREE'} Plan
                    </p>
                  </div>
                  <Badge 
                    variant={userStats?.tier === 'free' ? 'secondary' : 'default'}
                    className="text-white"
                  >
                    {userStats?.subscriptionStatus || 'inactive'}
                  </Badge>
                </div>
                
                <div className="pt-4 space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/pricing">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Upgrade Plan
                    </Link>
                  </Button>
                  {userStats?.tier !== 'free' && (
                    <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      <Link href="/billing">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Manage Billing
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Account Settings</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
