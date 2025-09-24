// Intelligent prompt optimization system for handling long vs short prompts

export interface PromptAnalysis {
  isLongPrompt: boolean;
  characterCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedAction: 'quick-shot' | 'full-generation' | 'optimize';
  optimizedPrompt?: string;
  originalPrompt: string;
}

export interface ModelLimits {
  maxLength: number;
  model: string;
  supportsLongPrompts: boolean;
}

// Model character limits
export const MODEL_LIMITS: Record<string, ModelLimits> = {
  'nano-banana': { maxLength: 200, model: 'nano-banana', supportsLongPrompts: false },
  'runway-t2i': { maxLength: 200, model: 'runway-t2i', supportsLongPrompts: false },
  'minimax-2.0': { maxLength: 200, model: 'minimax-2.0', supportsLongPrompts: false },
  'kling-2.1-master': { maxLength: 200, model: 'kling-2.1-master', supportsLongPrompts: false },
  'veo3-fast': { maxLength: 200, model: 'veo3-fast', supportsLongPrompts: false },
  'runway-video': { maxLength: 200, model: 'runway-video', supportsLongPrompts: false },
  'seedance-pro': { maxLength: 500, model: 'seedance-pro', supportsLongPrompts: true },
  'flux-1.1-pro': { maxLength: 1000, model: 'flux-1.1-pro', supportsLongPrompts: true },
  'dall-e-3': { maxLength: 1000, model: 'dall-e-3', supportsLongPrompts: true },
  'midjourney-v6': { maxLength: 1000, model: 'midjourney-v6', supportsLongPrompts: true }
};

// Analyze prompt complexity and length
export function analyzePrompt(prompt: string): PromptAnalysis {
  const characterCount = prompt.length;
  const wordCount = prompt.split(/\s+/).length;
  
  // Determine if it's a long prompt
  const isLongPrompt = characterCount > 50;
  
  // Determine complexity based on various factors
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  
  if (characterCount > 200 || wordCount > 30) {
    complexity = 'complex';
  } else if (characterCount > 100 || wordCount > 15) {
    complexity = 'moderate';
  }
  
  // Check for complex elements
  const complexIndicators = [
    'anthropomorphic', 'hybrid', 'warrior-mage', 'arcane', 'interdimensional',
    'cinematic', 'professional photography', 'depth of field', 'high contrast',
    'UHD', '8K', 'glitch style', 'blacklight neon', 'scintillating',
    'mystical', 'magical', 'dynamic lighting', 'unusual viewing angle'
  ];
  
  const hasComplexElements = complexIndicators.some(indicator => 
    prompt.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (hasComplexElements || characterCount > 300) {
    complexity = 'complex';
  }
  
  // Suggest action based on analysis
  let suggestedAction: 'quick-shot' | 'full-generation' | 'optimize' = 'quick-shot';
  
  if (complexity === 'complex' && characterCount > 200) {
    suggestedAction = 'full-generation';
  } else if (complexity === 'moderate' && characterCount > 100) {
    suggestedAction = 'optimize';
  }
  
  return {
    isLongPrompt,
    characterCount,
    complexity,
    suggestedAction,
    originalPrompt: prompt
  };
}

// Optimize prompt for models with character limits
export function optimizePromptForModel(prompt: string, model: string): string {
  const limits = MODEL_LIMITS[model];
  if (!limits || prompt.length <= limits.maxLength) {
    return prompt;
  }
  
  // If model supports long prompts, return as-is
  if (limits.supportsLongPrompts) {
    return prompt;
  }
  
  // For models with strict limits, create an optimized version
  return createOptimizedPrompt(prompt, limits.maxLength);
}

// Create an optimized version of a long prompt
function createOptimizedPrompt(prompt: string, maxLength: number): string {
  // Split prompt into sentences
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Priority keywords to preserve
  const priorityKeywords = [
    'anthropomorphic', 'dragon', 'ostrich', 'warrior', 'mage', 'hybrid',
    'glitch', 'neon', 'cinematic', 'UHD', '8K', 'professional',
    'mystical', 'magical', 'dynamic lighting', 'depth of field'
  ];
  
  // Find sentences with priority keywords
  const prioritySentences = sentences.filter(sentence => 
    priorityKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  
  // Start with priority sentences
  let optimizedPrompt = prioritySentences.join('. ').trim();
  
  // If still too long, truncate intelligently
  if (optimizedPrompt.length > maxLength) {
    // Keep the first part and add key descriptors
    const words = optimizedPrompt.split(' ');
    let truncated = '';
    
    for (const word of words) {
      if ((truncated + ' ' + word).length > maxLength - 20) {
        break;
      }
      truncated += (truncated ? ' ' : '') + word;
    }
    
    // Add key style descriptors if space allows
    const styleDescriptors = ['glitch style', 'neon', 'cinematic', 'UHD', '8K'];
    for (const descriptor of styleDescriptors) {
      if ((truncated + ', ' + descriptor).length <= maxLength) {
        truncated += ', ' + descriptor;
      }
    }
    
    optimizedPrompt = truncated;
  }
  
  // If still too long, do a hard truncate with ellipsis
  if (optimizedPrompt.length > maxLength) {
    optimizedPrompt = optimizedPrompt.substring(0, maxLength - 3) + '...';
  }
  
  return optimizedPrompt;
}

// Get the best model for a given prompt
export function getBestModelForPrompt(prompt: string, availableModels: string[]): string {
  const analysis = analyzePrompt(prompt);
  
  // For complex, long prompts, prefer models that support them
  if (analysis.complexity === 'complex' && analysis.characterCount > 200) {
    const longPromptModels = availableModels.filter(model => 
      MODEL_LIMITS[model]?.supportsLongPrompts
    );
    
    if (longPromptModels.length > 0) {
      // Prefer higher quality models for complex prompts
      const preferredOrder = ['flux-1.1-pro', 'dall-e-3', 'midjourney-v6', 'seedance-pro'];
      for (const preferred of preferredOrder) {
        if (longPromptModels.includes(preferred)) {
          return preferred;
        }
      }
      return longPromptModels[0];
    }
  }
  
  // For simple prompts, use the first available model
  return availableModels[0] || 'nano-banana';
}

// Generate user-friendly guidance based on prompt analysis
export function generatePromptGuidance(analysis: PromptAnalysis): string {
  if (analysis.complexity === 'simple') {
    return "Perfect for Quick Shots! Your prompt is ideal for fast generation.";
  }
  
  if (analysis.complexity === 'moderate') {
    return "Your prompt has good detail. It will be optimized for the best results.";
  }
  
  if (analysis.complexity === 'complex') {
    return "Complex prompt detected! This will use our advanced models for the best quality. Generation may take longer.";
  }
  
  return "Processing your prompt...";
}

// Check if a prompt needs optimization for a specific model
export function needsOptimization(prompt: string, model: string): boolean {
  const limits = MODEL_LIMITS[model];
  return limits ? prompt.length > limits.maxLength : false;
}
