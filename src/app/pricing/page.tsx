'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, Zap, Crown, Star, X, Image, Video, Info } from 'lucide-react'
import { createStripeService } from '@/lib/stripeService'
import { supabase } from '@/lib/supabase'

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    credits: 5, // 5 free generations
    features: [
      '5 generations per month',
      'Basic models access',
      'Community gallery access',
      'Standard support'
    ],
    tier: 'free',
    popular: false,
    icon: Zap
  },
  {
    name: 'Weekly Pro',
    price: '$7.50',
    period: 'week',
    description: 'Great for casual creators',
    credits: 150,
    features: [
      '150 credits per week',
      'All image models',
      'Priority processing',
      'HD downloads',
      'Email support'
    ],
    tier: 'weeklyPro',
    popular: true,
    icon: Star
  },
  {
    name: 'Heavy',
    price: '$14.99',
    period: 'month',
    description: 'For power users and professionals',
    credits: 375,
    features: [
      '375 credits per month',
      'All models (image + video)',
      'Fastest processing',
      '4K downloads',
      'Priority support',
      'Commercial license'
    ],
    tier: 'heavy',
    popular: false,
    icon: Crown
  }
]

const creditPacks = [
  {
    name: 'Credit Pack 5',
    price: '$6.25',
    credits: 125,
    description: 'Perfect for trying out premium features',
    popular: false
  },
  {
    name: 'Credit Pack 10',
    price: '$12.50',
    credits: 250,
    description: 'Great value for regular users',
    popular: true
  },
  {
    name: 'Credit Pack 25',
    price: '$31.25',
    credits: 625,
    description: 'Best value for heavy users',
    popular: false
  }
]

// Model cost breakdown (1 credit = $0.04)
const modelCosts = {
  basic: { cost: 1, name: 'Basic Models', models: ['Nano Banana', 'Runway T2I', 'MiniMax 2.0', 'Kling 2.1'] },
  premium: { cost: 4, name: 'Premium Models', models: ['VEO3 Fast', 'Runway Video'] },
  ultra: { cost: 63, name: 'Ultra-Premium Models', models: ['Seedance Pro'] }
}

// Calculate what users can generate with their credits
const calculateGenerationBreakdown = (credits: number) => {
  return {
    basicImages: Math.floor(credits / modelCosts.basic.cost),
    premiumVideos: Math.floor(credits / modelCosts.premium.cost),
    ultraVideos: Math.floor(credits / modelCosts.ultra.cost),
    mixed: {
      basicImages: Math.floor(credits * 0.7 / modelCosts.basic.cost),
      premiumVideos: Math.floor(credits * 0.3 / modelCosts.premium.cost)
    }
  }
}

export default function PricingPage() {
  const { user, session } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [currentTier, setCurrentTier] = useState<string>('free')
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCurrentTier()
    }
  }, [user])

  const fetchCurrentTier = async () => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('tier')
        .eq('id', user?.id)
        .single()
      
      if (profile) {
        setCurrentTier(profile.tier)
      }
    } catch (error) {
      console.error('Error fetching current tier:', error)
    }
  }

  const handleSubscribe = async (tier: string) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login?redirectTo=/pricing'
      return
    }

    setLoading(tier)

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Authentication required - please sign in again')
        return
      }

      // Map tier names to match Stripe service expectations
      // No mapping needed - use tier names directly as they match environment variables
      const mappedTier = tier
      
      // Call our new API endpoint
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tier: mappedTier,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        })
      })

      const data = await response.json()

      if (!data.success) {
        alert(data.message || 'Failed to start checkout. Please try again.')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleCreditPurchase = async (packName: string) => {
    if (!user) {
      window.location.href = '/auth/login?redirectTo=/pricing'
      return
    }

    setLoading(packName)

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Authentication required - please sign in again')
        return
      }

      // Map pack name to tier
      const packTierMap: { [key: string]: string } = {
        'Credit Pack 5': 'creditPack5',
        'Credit Pack 10': 'creditPack10', 
        'Credit Pack 25': 'creditPack25'
      }
      
      const tier = packTierMap[packName] || 'creditPack5'
      
      // Call our new API endpoint
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tier: tier,
          successUrl: `${window.location.origin}/dashboard?credits=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        })
      })

      const data = await response.json()

      if (!data.success) {
        alert(data.message || 'Failed to start checkout. Please try again.')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handlePlanClick = (plan: any) => {
    setSelectedPlan(plan)
    setShowModal(true)
  }

  const handleCreditPackClick = (pack: any) => {
    setSelectedPlan(pack)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPlan(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(21% 0.034 264.665)' }}>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock the full potential of AI-powered content creation with our flexible pricing plans.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Subscription Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => {
              const Icon = plan.icon
              const isCurrentPlan = currentTier === plan.tier
              
              return (
                <Card 
                  key={plan.tier}
                  className={`relative bg-white/10 border-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/15 transition-all duration-200 ${
                    plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => handlePlanClick(plan)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-500 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-500 text-white px-4 py-1">
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-white/10 w-fit">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-300">/{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-white">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSubscribe(plan.tier)}
                      disabled={loading === plan.tier || isCurrentPlan}
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-purple-600 hover:bg-purple-700' 
                          : 'bg-white/10 hover:bg-white/20 border border-white/20'
                      } text-white`}
                    >
                      {loading === plan.tier ? (
                        'Processing...'
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Credit Packs */}
        <div>
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Credit Packs
          </h2>
          <p className="text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            Need more generations? Purchase credit packs that never expire and work with any plan.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {creditPacks.map((pack) => (
              <Card 
                key={pack.name}
                className={`bg-white/10 border-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/15 transition-all duration-200 ${
                  pack.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                }`}
                onClick={() => handleCreditPackClick(pack)}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white px-4 py-1">
                      Best Value
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-white">{pack.name}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {pack.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-white">{pack.price}</span>
                    <div className="text-gray-300">
                      {pack.credits} credits
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Button
                    onClick={() => handleCreditPurchase(pack.name)}
                    disabled={loading === pack.name}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  >
                    {loading === pack.name ? 'Processing...' : 'Purchase Credits'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Do credits expire?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  No, purchased credits never expire. They work with any plan and can be used whenever you need them.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">What happens if I exceed my limit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  You can purchase additional credits or upgrade your plan. We&apos;ll notify you when you&apos;re approaching your limit.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Yes! The free plan gives you 5 generations to try out our platform. No credit card required.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Plan Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    {selectedPlan?.name} - Detailed Breakdown
                  </DialogTitle>
                  <DialogDescription className="text-gray-300 mt-2">
                    {selectedPlan?.description}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            {selectedPlan && (
              <div className="space-y-6">
                {/* Price and Credits */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {selectedPlan.price}
                        {selectedPlan.period && `/${selectedPlan.period}`}
                      </h3>
                      {selectedPlan.credits && (
                        <p className="text-gray-300">
                          {selectedPlan.credits} credits included
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {selectedPlan.credits ? (
                        <p className="text-sm text-gray-400">
                          ${(parseFloat(selectedPlan.price.replace('$', '')) / selectedPlan.credits).toFixed(4)} per credit
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">
                          {selectedPlan.name === 'Free' ? 'No cost' : 'Subscription plan'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generation Breakdown */}
                {selectedPlan.credits && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      What You Can Generate
                    </h4>
                    
                    {(() => {
                      const breakdown = calculateGenerationBreakdown(selectedPlan.credits)
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Basic Images Only */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h5 className="font-semibold text-white mb-2 flex items-center">
                              <Image className="h-4 w-4 mr-2" />
                              Basic Images Only
                            </h5>
                            <p className="text-2xl font-bold text-green-400">
                              {breakdown.basicImages}
                            </p>
                            <p className="text-sm text-gray-300">
                              {modelCosts.basic.models.join(', ')}
                            </p>
                          </div>

                          {/* Premium Videos Only */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h5 className="font-semibold text-white mb-2 flex items-center">
                              <Video className="h-4 w-4 mr-2" />
                              Premium Videos Only
                            </h5>
                            <p className="text-2xl font-bold text-blue-400">
                              {breakdown.premiumVideos}
                            </p>
                            <p className="text-sm text-gray-300">
                              {modelCosts.premium.models.join(', ')}
                            </p>
                          </div>

                          {/* Mixed Usage */}
                          <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
                            <h5 className="font-semibold text-white mb-2">
                              Mixed Usage (Recommended)
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-lg font-bold text-green-400">
                                  {breakdown.mixed.basicImages} Images
                                </p>
                                <p className="text-xs text-gray-400">70% of credits</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-blue-400">
                                  {breakdown.mixed.premiumVideos} Videos
                                </p>
                                <p className="text-xs text-gray-400">30% of credits</p>
                              </div>
                            </div>
                          </div>

                          {/* Ultra Premium (if applicable) */}
                          {breakdown.ultraVideos > 0 && (
                            <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
                              <h5 className="font-semibold text-white mb-2">
                                Ultra-Premium Videos
                              </h5>
                              <p className="text-2xl font-bold text-purple-400">
                                {breakdown.ultraVideos}
                              </p>
                              <p className="text-sm text-gray-300">
                                {modelCosts.ultra.models.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Features List */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">What&apos;s Included</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features?.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={() => {
                      if (selectedPlan.credits) {
                        handleCreditPurchase(selectedPlan.name)
                      } else {
                        handleSubscribe(selectedPlan.tier)
                      }
                      closeModal()
                    }}
                    disabled={loading === selectedPlan.tier || loading === selectedPlan.name}
                    className={`flex-1 ${
                      selectedPlan.popular 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20'
                    } text-white`}
                  >
                    {loading === selectedPlan.tier || loading === selectedPlan.name ? (
                      'Processing...'
                    ) : selectedPlan.credits ? (
                      'Purchase Credits'
                    ) : (
                      `Get ${selectedPlan.name}`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeModal}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
