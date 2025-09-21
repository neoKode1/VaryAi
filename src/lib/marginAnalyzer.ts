import { weightedCreditService } from './weightedCreditService';
import { DEFAULT_PRICING_CONFIG } from '@/types/pricing';

export interface MarginAnalysis {
  creditPack: string;
  price: number;
  credits: number;
  usageScenarios: {
    scenario: string;
    creditsUsed: number;
    actualCost: number;
    profit: number;
    margin: number;
  }[];
  averageMargin: number;
  worstCaseMargin: number;
  bestCaseMargin: number;
}

export class MarginAnalyzer {
  /**
   * Analyze margins for all credit packs with different usage scenarios
   */
  static analyzeAllMargins(): MarginAnalysis[] {
    const results: MarginAnalysis[] = [];
    
    Object.entries(DEFAULT_PRICING_CONFIG.creditPacks).forEach(([packName, packConfig]) => {
      const analysis = this.analyzeCreditPack(packName, packConfig.price, packConfig.credits);
      results.push(analysis);
    });
    
    return results;
  }

  /**
   * Analyze margins for a specific credit pack
   */
  static analyzeCreditPack(packName: string, price: number, credits: number): MarginAnalysis {
    const scenarios = [
      {
        name: '100% Basic Models (Nano Banana)',
        model: 'nano-banana',
        usage: credits
      },
      {
        name: '80% Basic, 20% Premium',
        model: 'veo3-fast',
        usage: Math.floor(credits * 0.2 / 4) // 20% of credits for premium models
      },
      {
        name: '60% Basic, 30% Premium, 10% Ultra',
        model: 'seedance-pro',
        usage: Math.floor(credits * 0.1 / 63) // 10% of credits for ultra models
      },
      {
        name: '50% Basic, 40% Premium, 10% Ultra',
        model: 'seedance-pro',
        usage: Math.floor(credits * 0.1 / 63)
      },
      {
        name: 'Worst Case: 100% Ultra Premium',
        model: 'seedance-pro',
        usage: Math.floor(credits / 63)
      }
    ];

    const usageScenarios = scenarios.map(scenario => {
      const creditsUsed = scenario.usage * weightedCreditService.calculateCreditsRequired(scenario.model);
      const actualCost = creditsUsed * (price / credits); // Cost per credit
      const profit = price - actualCost;
      const margin = (profit / price) * 100;

      return {
        scenario: scenario.name,
        creditsUsed,
        actualCost,
        profit,
        margin: Math.max(0, margin)
      };
    });

    const margins = usageScenarios.map(s => s.margin);
    const averageMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
    const worstCaseMargin = Math.min(...margins);
    const bestCaseMargin = Math.max(...margins);

    return {
      creditPack: packName,
      price,
      credits,
      usageScenarios,
      averageMargin,
      worstCaseMargin,
      bestCaseMargin
    };
  }

  /**
   * Get summary of all margins
   */
  static getMarginSummary(): {
    overallAverage: number;
    overallWorst: number;
    overallBest: number;
    targetMet: boolean;
    recommendations: string[];
  } {
    const analyses = this.analyzeAllMargins();
    
    const allMargins = analyses.flatMap(a => a.usageScenarios.map(s => s.margin));
    const overallAverage = allMargins.reduce((a, b) => a + b, 0) / allMargins.length;
    const overallWorst = Math.min(...allMargins);
    const overallBest = Math.max(...allMargins);
    
    const targetMet = overallWorst >= 15;
    
    const recommendations: string[] = [];
    
    if (!targetMet) {
      recommendations.push('Consider increasing prices by 5-10% to meet 15% margin target');
      recommendations.push('Implement usage limits to prevent worst-case scenarios');
      recommendations.push('Add premium add-on services with 100% margins');
    }
    
    if (overallBest > 50) {
      recommendations.push('Consider promotional pricing for expensive models to increase adoption');
    }
    
    return {
      overallAverage,
      overallWorst,
      overallBest,
      targetMet,
      recommendations
    };
  }

  /**
   * Generate detailed margin report
   */
  static generateMarginReport(): string {
    const analyses = this.analyzeAllMargins();
    const summary = this.getMarginSummary();
    
    let report = '# 📊 Weighted Credit System Margin Analysis\n\n';
    
    report += `## 🎯 Overall Summary\n`;
    report += `- **Average Margin**: ${summary.overallAverage.toFixed(1)}%\n`;
    report += `- **Worst Case Margin**: ${summary.overallWorst.toFixed(1)}%\n`;
    report += `- **Best Case Margin**: ${summary.overallBest.toFixed(1)}%\n`;
    report += `- **15% Target Met**: ${summary.targetMet ? '✅ YES' : '❌ NO'}\n\n`;
    
    if (summary.recommendations.length > 0) {
      report += `## 💡 Recommendations\n`;
      summary.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
      report += '\n';
    }
    
    report += `## 📋 Detailed Analysis by Credit Pack\n\n`;
    
    analyses.forEach(analysis => {
      report += `### ${analysis.creditPack.toUpperCase()}\n`;
      report += `- **Price**: $${analysis.price}\n`;
      report += `- **Credits**: ${analysis.credits}\n`;
      report += `- **Average Margin**: ${analysis.averageMargin.toFixed(1)}%\n`;
      report += `- **Worst Case**: ${analysis.worstCaseMargin.toFixed(1)}%\n`;
      report += `- **Best Case**: ${analysis.bestCaseMargin.toFixed(1)}%\n\n`;
      
      report += `**Usage Scenarios:**\n`;
      analysis.usageScenarios.forEach(scenario => {
        report += `- ${scenario.scenario}: ${scenario.margin.toFixed(1)}% margin\n`;
      });
      report += '\n';
    });
    
    return report;
  }
}

// Export for easy access
export const marginAnalyzer = MarginAnalyzer;
