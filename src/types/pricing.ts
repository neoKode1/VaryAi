// Three-Tier Pricing System Types

export type UserTier = 'free' | 'light' | 'heavy';

export interface TierLimits {
  free: {
    monthlyGenerations: number;
    dailyGenerations: number;
    allowedModels: string[];
    overageRate: number;
    premiumModelLimit?: number; // 10 free generations of premium models per month
  };
  light: {
    monthlyGenerations: number;
    dailyGenerations: number;
    allowedModels: string[];
    overageRate: number;
    price: number;
  };
  heavy: {
    monthlyGenerations: number;
    dailyGenerations: number;
    allowedModels: string[];
    overageRate: number;
    price: number;
  };
}

export interface UserUsage {
  userId: string;
  tier: UserTier;
  monthlyGenerations: number;
  dailyGenerations: number;
  lastResetDate: string;
  overageCharges: number;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationRequest {
  userId: string;
  model: string;
  timestamp: string;
  cost: number;
  tier: UserTier;
  isOverage: boolean;
}

export interface TierCheckResult {
  canGenerate: boolean;
  reason?: string;
  tier: UserTier;
  remainingGenerations: number;
  isOverage: boolean;
  overageRate: number;
}

export interface PricingConfig {
  tiers: TierLimits;
  models: {
    [key: string]: {
      cost: number;
      creditWeight: number; // How many credits this model costs
      allowedTiers: UserTier[];
    };
  };
  creditPacks: {
    [key: string]: {
      price: number;
      credits: number;
      description: string;
    };
  };
}

// Default pricing configuration with weighted credit system
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  tiers: {
    free: {
      monthlyGenerations: 0, // 0 means unlimited for Nano Banana
      dailyGenerations: 0, // 0 means unlimited for Nano Banana
      allowedModels: ['nano-banana', 'runway-t2i', 'minimax-2.0', 'kling-2.1-master', 'veo3-fast', 'runway-video', 'seedance-pro'],
      overageRate: 0.05, // $0.05 per generation over limit
      premiumModelLimit: 5, // 5 free generations of premium models per month (conservative approach)
    },
    light: {
      monthlyGenerations: 50,
      dailyGenerations: 20,
      allowedModels: ['nano-banana', 'runway-t2i', 'minimax-2.0', 'kling-2.1-master', 'veo3-fast', 'runway-video'],
      overageRate: 0.05, // $0.05 per generation over limit
      price: 14.99,
    },
    heavy: {
      monthlyGenerations: 100,
      dailyGenerations: 50,
      allowedModels: ['nano-banana', 'runway-t2i', 'minimax-2.0', 'kling-2.1-master', 'veo3-fast', 'runway-video', 'seedance-pro'],
      overageRate: 0.04, // $0.04 per generation over limit
      price: 19.99,
    },
  },
  models: {
    // Basic models - 1 credit each (keep current pricing)
    'nano-banana': {
      cost: 0.0398,
      creditWeight: 1,
      allowedTiers: ['free', 'light', 'heavy'],
    },
    'runway-t2i': {
      cost: 0.0398,
      creditWeight: 1,
      allowedTiers: ['free', 'light', 'heavy'],
    },
    'minimax-2.0': {
      cost: 0.0398,
      creditWeight: 1,
      allowedTiers: ['free', 'light', 'heavy'],
    },
    'kling-2.1-master': {
      cost: 0.0398,
      creditWeight: 1,
      allowedTiers: ['free', 'light', 'heavy'],
    },
    // Premium models - 4 credits each (4x more expensive)
    'veo3-fast': {
      cost: 0.15,
      creditWeight: 4,
      allowedTiers: ['light', 'heavy'],
    },
    'runway-video': {
      cost: 0.15,
      creditWeight: 4,
      allowedTiers: ['light', 'heavy'],
    },
    // Ultra-premium models - 63 credits each (63x more expensive)
    'seedance-pro': {
      cost: 2.50,
      creditWeight: 63,
      allowedTiers: ['heavy'],
    },
  },
  creditPacks: {
    // Updated prices with 25% increase to achieve 15% margins
    'pack-5': {
      price: 6.25,
      credits: 125,
      description: '125 credits - 125 basic generations OR 31 premium OR 2 ultra-premium',
    },
    'pack-10': {
      price: 12.50,
      credits: 250,
      description: '250 credits - 250 basic generations OR 62 premium OR 4 ultra-premium',
    },
    'pack-25': {
      price: 31.25,
      credits: 625,
      description: '625 credits - 625 basic generations OR 156 premium OR 10 ultra-premium',
    },
    // Weekly Pro subscription
    'weekly-pro': {
      price: 7.50,
      credits: 150,
      description: '150 credits/week - 150 basic generations OR 37 premium OR 2 ultra-premium',
    },
    // Monthly Pro subscription
    'monthly-pro': {
      price: 18.75,
      credits: 375,
      description: '375 credits/month - 375 basic generations OR 93 premium OR 6 ultra-premium',
    },
  },
};
