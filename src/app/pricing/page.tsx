'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Crown, Star } from 'lucide-react'
import { createStripeService } from '@/lib/stripeService'
import { supabase } from '@/lib/supabase'

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
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
    name: 'Light',
    price: '$9',
    period: 'month',
    description: 'Great for casual creators',
    features: [
      '50 generations per month',
      'All image models',
      'Priority processing',
      'HD downloads',
      'Email support'
    ],
    tier: 'light',
    popular: true,
    icon: Star
  },
  {
    name: 'Heavy',
    price: '$29',
    period: 'month',
    description: 'For power users and professionals',
    features: [
      '200 generations per month',
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
    price: '$5',
    credits: 50,
    description: 'Perfect for trying out premium features',
    popular: false
  },
  {
    name: 'Credit Pack 10',
    price: '$9',
    credits: 100,
    description: 'Great value for regular users',
    popular: true
  },
  {
    name: 'Credit Pack 25',
    price: '$19',
    credits: 250,
    description: 'Best value for heavy users',
    popular: false
  }
]

export default function PricingPage() {
  const { user, session } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [currentTier, setCurrentTier] = useState<string>('free')

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
      const stripeService = createStripeService()
      const { url } = await stripeService.createCheckoutSession({
        userId: user.id,
        tier,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`
      })

      if (url) {
        window.location.href = url
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
      const stripeService = createStripeService()
      const { url } = await stripeService.createCheckoutSession({
        userId: user.id,
        tier: 'credit_pack',
        successUrl: `${window.location.origin}/dashboard?credits=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`
      })

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
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
                  className={`relative bg-white/10 border-white/20 backdrop-blur-sm ${
                    plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
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
                className={`bg-white/10 border-white/20 backdrop-blur-sm ${
                  pack.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                }`}
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
                  You can purchase additional credits or upgrade your plan. We'll notify you when you're approaching your limit.
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
      </div>
    </div>
  )
}
