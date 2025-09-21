'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Star, Crown, CreditCard, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
    name: 'Weekly Pro',
    price: '$7.50',
    period: 'week',
    description: 'Great for casual creators',
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
];

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
];

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSubscribe = async (tier: string) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login?redirectTo=/generate'
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

      // Call our API endpoint
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tier: tier,
          successUrl: `${window.location.origin}/generate?success=true`,
          cancelUrl: `${window.location.origin}/generate?canceled=true`
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
  };

  const handleCreditPurchase = async (packName: string) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login?redirectTo=/generate'
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

      // Call our API endpoint
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tier: tier,
          successUrl: `${window.location.origin}/generate?success=true`,
          cancelUrl: `${window.location.origin}/generate?canceled=true`
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
            <p className="text-white/70">Unlock the full potential of AI generation</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Subscription Plans */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-6">Subscription Plans</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = false; // You can implement this logic
              
              return (
                <div
                  key={plan.tier}
                  className={`relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 hover:bg-white/10 ${
                    plan.popular 
                      ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' 
                      : 'border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">{plan.name}</h4>
                    <p className="text-white/70 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-white/70">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-white text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loading === plan.tier || isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      plan.popular 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === plan.tier ? (
                      'Processing...'
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Credit Packs */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-6">Credit Packs</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.name}
                className={`relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 hover:bg-white/10 ${
                  pack.popular 
                    ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' 
                    : 'border-white/20'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Best Value
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg mb-4">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">{pack.name}</h4>
                  <p className="text-white/70 text-sm mb-4">{pack.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-white">{pack.price}</span>
                    <span className="text-white/70 ml-2">({pack.credits} credits)</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCreditPurchase(pack.name)}
                  disabled={loading === pack.name}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    pack.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === pack.name ? 'Processing...' : `Buy ${pack.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
