import { DEFAULT_PRICING_CONFIG } from '@/types/pricing';

export interface CreditCalculationResult {
  creditsRequired: number;
  actualCost: number;
  profit: number;
  margin: number;
  canAfford: boolean;
}

export interface UsageLimits {
  dailyBasicLimit: number;
  dailyPremiumLimit: number;
  dailyUltraLimit: number;
  monthlyBasicLimit: number;
  monthlyPremiumLimit: number;
  monthlyUltraLimit: number;
}

export class WeightedCreditService {
  private config = DEFAULT_PRICING_CONFIG;

  /**
   * Calculate credits required for a model generation
   */
  calculateCreditsRequired(model: string): number {
    const modelConfig = this.config.models[model];
    if (!modelConfig) {
      throw new Error(`Model ${model} not found in configuration`);
    }
    return modelConfig.creditWeight;
  }

  /**
   * Calculate the actual cost and profit for a generation
   */
  calculateGenerationCost(
    model: string, 
    creditPackPrice: number, 
    creditPackCredits: number
  ): CreditCalculationResult {
    const creditsRequired = this.calculateCreditsRequired(model);
    const modelConfig = this.config.models[model];
    
    // Calculate actual cost based on credit usage
    const creditValue = creditPackPrice / creditPackCredits;
    const actualCost = creditsRequired * creditValue;
    
    // Calculate profit and margin
    const profit = creditPackPrice - actualCost;
    const margin = (profit / creditPackPrice) * 100;
    
    return {
      creditsRequired,
      actualCost,
      profit,
      margin,
      canAfford: profit > 0
    };
  }

  /**
   * Get usage limits for different model tiers
   */
  getUsageLimits(credits: number): UsageLimits {
    return {
      // Basic models (1 credit each)
      dailyBasicLimit: Math.floor(credits * 0.8), // 80% of credits for basic models
      monthlyBasicLimit: Math.floor(credits * 0.8 * 30),
      
      // Premium models (4 credits each)
      dailyPremiumLimit: Math.floor(credits * 0.15 / 4), // 15% of credits for premium models
      monthlyPremiumLimit: Math.floor(credits * 0.15 * 30 / 4),
      
      // Ultra-premium models (63 credits each)
      dailyUltraLimit: Math.floor(credits * 0.05 / 63), // 5% of credits for ultra models
      monthlyUltraLimit: Math.floor(credits * 0.05 * 30 / 63),
    };
  }

  /**
   * Calculate profit margins for all credit packs
   */
  calculateAllMargins(): Record<string, CreditCalculationResult[]> {
    const results: Record<string, CreditCalculationResult[]> = {};
    
    Object.entries(this.config.creditPacks).forEach(([packName, packConfig]) => {
      results[packName] = [];
      
      Object.entries(this.config.models).forEach(([modelName, modelConfig]) => {
        const calculation = this.calculateGenerationCost(
          modelName,
          packConfig.price,
          packConfig.credits
        );
        results[packName].push({
          ...calculation,
          creditsRequired: modelConfig.creditWeight,
        });
      });
    });
    
    return results;
  }

  /**
   * Get recommended usage distribution for optimal margins
   */
  getOptimalUsageDistribution(credits: number): {
    basic: number;
    premium: number;
    ultra: number;
    expectedMargin: number;
  } {
    const limits = this.getUsageLimits(credits);
    
    // Calculate expected costs based on optimal distribution
    const basicCost = limits.dailyBasicLimit * 0.0398;
    const premiumCost = limits.dailyPremiumLimit * 0.15;
    const ultraCost = limits.dailyUltraLimit * 2.50;
    
    const totalDailyCost = basicCost + premiumCost + ultraCost;
    const totalDailyCredits = limits.dailyBasicLimit + (limits.dailyPremiumLimit * 4) + (limits.dailyUltraLimit * 63);
    
    // Calculate expected margin
    const creditValue = 5.00 / 125; // Using pack-5 as baseline
    const expectedMargin = ((totalDailyCredits * creditValue) - totalDailyCost) / (totalDailyCredits * creditValue) * 100;
    
    return {
      basic: limits.dailyBasicLimit,
      premium: limits.dailyPremiumLimit,
      ultra: limits.dailyUltraLimit,
      expectedMargin: Math.max(0, expectedMargin)
    };
  }

  /**
   * Check if a user can afford a generation with their current credits
   */
  canUserAffordGeneration(
    userId: string,
    model: string,
    userCredits: number
  ): { canAfford: boolean; creditsRequired: number; remainingCredits: number } {
    const creditsRequired = this.calculateCreditsRequired(model);
    const remainingCredits = userCredits - creditsRequired;
    
    return {
      canAfford: remainingCredits >= 0,
      creditsRequired,
      remainingCredits
    };
  }
}

// Export singleton instance
export const weightedCreditService = new WeightedCreditService();
