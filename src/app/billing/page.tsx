'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  Calendar, 
  Download, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { createStripeService } from '@/lib/stripeService'
import { supabase } from '@/lib/supabase'
import { ActivityLogger } from '@/lib/activityLogger'

interface BillingInfo {
  currentTier: string
  subscriptionStatus: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  subscriptionId?: string
  customerId?: string
}

export default function BillingPage() {
  const { user, session } = useAuth()
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      fetchBillingInfo()
    }
  }, [user])

  const fetchBillingInfo = async () => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profile) {
        setBillingInfo({
          currentTier: profile.tier || 'free',
          subscriptionStatus: profile.subscription_status || 'inactive',
          currentPeriodEnd: profile.current_period_end,
          cancelAtPeriodEnd: profile.cancel_at_period_end || false,
          subscriptionId: profile.subscription_id,
          customerId: profile.stripe_customer_id
        })
      }
    } catch (error) {
      console.error('Error fetching billing info:', error)
      setMessage({ type: 'error', text: 'Failed to load billing information' })
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!user) return

    setActionLoading('portal')
    try {
      const stripeService = createStripeService()
      const { url } = await stripeService.createCustomerPortalSession({
        userId: user.id,
        returnUrl: window.location.href
      })

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      setMessage({ type: 'error', text: 'Failed to open billing portal' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user || !billingInfo?.subscriptionId) return

    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.'
    )

    if (!confirmed) return

    setActionLoading('cancel')
    try {
      const stripeService = createStripeService()
      await stripeService.cancelSubscription(user.id, true) // Cancel at period end

      setMessage({ type: 'success', text: 'Subscription will be cancelled at the end of your current period' })
      
      // Log the activity
      await ActivityLogger.logActivity(
        user.id,
        'subscription_cancelled',
        { subscription_id: billingInfo.subscriptionId }
      )

      // Refresh billing info
      await fetchBillingInfo()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      setMessage({ type: 'error', text: 'Failed to cancel subscription' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!user || !billingInfo?.subscriptionId) return

    setActionLoading('reactivate')
    try {
      // This would typically involve calling Stripe API to reactivate
      // For now, we'll just show a message
      setMessage({ type: 'success', text: 'Please contact support to reactivate your subscription' })
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      setMessage({ type: 'error', text: 'Failed to reactivate subscription' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!user) return

    setActionLoading('invoice')
    try {
      // This would typically involve calling Stripe API to get invoices
      // For now, we'll redirect to the customer portal
      await handleManageBilling()
    } catch (error) {
      console.error('Error downloading invoice:', error)
      setMessage({ type: 'error', text: 'Failed to download invoice' })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading billing information...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                Please sign in to access your billing information.
              </p>
              <Button asChild>
                <a href="/auth/login">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isActive = billingInfo?.subscriptionStatus === 'active'
  const isCancelled = billingInfo?.cancelAtPeriodEnd
  const isPastDue = billingInfo?.subscriptionStatus === 'past_due'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-gray-300">
            Manage your subscription, billing, and payment methods.
          </p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Plan */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Current Plan
                <Badge 
                  variant={isActive ? 'default' : 'secondary'}
                  className={isActive ? 'bg-green-500' : 'bg-gray-500'}
                >
                  {billingInfo?.subscriptionStatus?.toUpperCase() || 'INACTIVE'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Plan</span>
                  <span className="text-white">{billingInfo?.currentTier?.toUpperCase() || 'FREE'}</span>
                </div>
                
                {billingInfo?.currentPeriodEnd && (
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Next Billing Date</span>
                    <span className="text-white">
                      {new Date(billingInfo.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {billingInfo?.subscriptionId && (
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Subscription ID</span>
                    <span className="text-white font-mono text-sm">
                      {billingInfo.subscriptionId.substring(0, 20)}...
                    </span>
                  </div>
                )}
              </div>

              {isCancelled && (
                <Alert className="border-yellow-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-700">
                    Your subscription will be cancelled at the end of your current billing period.
                  </AlertDescription>
                </Alert>
              )}

              {isPastDue && (
                <Alert className="border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    Your subscription is past due. Please update your payment method.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 space-y-2">
                <Button 
                  onClick={handleManageBilling}
                  disabled={actionLoading === 'portal'}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {actionLoading === 'portal' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening Portal...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Manage Billing
                    </>
                  )}
                </Button>

                {billingInfo?.currentTier !== 'free' && (
                  <>
                    {isCancelled ? (
                      <Button 
                        onClick={handleReactivateSubscription}
                        disabled={actionLoading === 'reactivate'}
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                      >
                        {actionLoading === 'reactivate' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Reactivating...
                          </>
                        ) : (
                          'Reactivate Subscription'
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleCancelSubscription}
                        disabled={actionLoading === 'cancel'}
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        {actionLoading === 'cancel' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Subscription'
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing History & Actions */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Billing History</CardTitle>
              <CardDescription className="text-gray-300">
                View and download your billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-white font-medium">Payment Method</p>
                      <p className="text-gray-300 text-sm">Manage your payment methods</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleManageBilling}
                    disabled={actionLoading === 'portal'}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-white font-medium">Download Invoices</p>
                      <p className="text-gray-300 text-sm">Get your billing history</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleDownloadInvoice}
                    disabled={actionLoading === 'invoice'}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    {actionLoading === 'invoice' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-white font-medium">Billing Calendar</p>
                      <p className="text-gray-300 text-sm">View your billing schedule</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleManageBilling}
                    disabled={actionLoading === 'portal'}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <a href="/pricing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Change Plan
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Information */}
        <Card className="mt-8 bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Usage & Limits</CardTitle>
            <CardDescription className="text-gray-300">
              Your current usage and plan limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">Monthly</div>
                <div className="text-gray-300 text-sm">
                  {billingInfo?.currentTier === 'free' ? '5' : 
                   billingInfo?.currentTier === 'light' ? '50' : 
                   billingInfo?.currentTier === 'heavy' ? '200' : 'Unlimited'} generations
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">Daily</div>
                <div className="text-gray-300 text-sm">
                  {billingInfo?.currentTier === 'free' ? '2' : 
                   billingInfo?.currentTier === 'light' ? '10' : 
                   billingInfo?.currentTier === 'heavy' ? '20' : 'Unlimited'} generations
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">Features</div>
                <div className="text-gray-300 text-sm">
                  {billingInfo?.currentTier === 'free' ? 'Basic models' : 
                   billingInfo?.currentTier === 'light' ? 'All image models' : 
                   billingInfo?.currentTier === 'heavy' ? 'All models + video' : 'Everything'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
