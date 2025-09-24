'use client'

import React, { useState, useEffect } from 'react'
import { analyzePrompt, optimizePromptForModel, generatePromptGuidance, getBestModelForPrompt, PromptAnalysis } from '@/lib/promptOptimizer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Zap, Wand2, Info } from 'lucide-react'

interface SmartPromptHandlerProps {
  prompt: string
  selectedModel: string
  availableModels: string[]
  onOptimizedPrompt: (optimizedPrompt: string, suggestedModel: string) => void
  onProceedWithOriginal: () => void
  onCancel: () => void
}

export const SmartPromptHandler: React.FC<SmartPromptHandlerProps> = ({
  prompt,
  selectedModel,
  availableModels,
  onOptimizedPrompt,
  onProceedWithOriginal,
  onCancel
}) => {
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null)
  const [optimizedPrompt, setOptimizedPrompt] = useState<string>('')
  const [suggestedModel, setSuggestedModel] = useState<string>('')
  const [showOptimized, setShowOptimized] = useState(false)

  useEffect(() => {
    const promptAnalysis = analyzePrompt(prompt)
    setAnalysis(promptAnalysis)
    
    // Get the best model for this prompt
    const bestModel = getBestModelForPrompt(prompt, availableModels)
    setSuggestedModel(bestModel)
    
    // Create optimized version if needed
    if (promptAnalysis.suggestedAction === 'optimize' || promptAnalysis.suggestedAction === 'full-generation') {
      const optimized = optimizePromptForModel(prompt, selectedModel)
      setOptimizedPrompt(optimized)
    }
  }, [prompt, selectedModel, availableModels])

  if (!analysis) return null

  const handleUseOptimized = () => {
    onOptimizedPrompt(optimizedPrompt, suggestedModel)
  }

  const handleUseOriginal = () => {
    onProceedWithOriginal()
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-500'
      case 'moderate': return 'bg-yellow-500'
      case 'complex': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'simple': return <CheckCircle className="h-4 w-4" />
      case 'moderate': return <Zap className="h-4 w-4" />
      case 'complex': return <Wand2 className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full bg-gray-900 border-gray-700 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                Smart Prompt Analysis
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                {generatePromptGuidance(analysis)}
              </CardDescription>
            </div>
            <Badge className={`${getComplexityColor(analysis.complexity)} text-white`}>
              {getComplexityIcon(analysis.complexity)}
              <span className="ml-1 capitalize">{analysis.complexity}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Prompt Analysis */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">Prompt Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Characters:</span>
                <span className="text-white ml-2">{analysis.characterCount}</span>
              </div>
              <div>
                <span className="text-gray-400">Words:</span>
                <span className="text-white ml-2">{prompt.split(/\s+/).length}</span>
              </div>
              <div>
                <span className="text-gray-400">Complexity:</span>
                <span className="text-white ml-2 capitalize">{analysis.complexity}</span>
              </div>
              <div>
                <span className="text-gray-400">Suggested Action:</span>
                <span className="text-white ml-2 capitalize">{analysis.suggestedAction.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Original Prompt Preview */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">Your Original Prompt</h4>
            <div className="bg-gray-900 rounded p-3 text-sm text-gray-300 max-h-32 overflow-y-auto">
              {prompt}
            </div>
          </div>

          {/* Optimization Options */}
          {analysis.suggestedAction !== 'quick-shot' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOptimized(!showOptimized)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  {showOptimized ? 'Hide' : 'Show'} Optimized Version
                </Button>
                {suggestedModel !== selectedModel && (
                  <Badge className="bg-blue-500 text-white">
                    Suggested Model: {suggestedModel}
                  </Badge>
                )}
              </div>

              {showOptimized && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">Optimized Prompt</h4>
                  <div className="bg-gray-900 rounded p-3 text-sm text-gray-300 max-h-32 overflow-y-auto">
                    {optimizedPrompt}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Optimized for {selectedModel} (max {selectedModel === 'nano-banana' ? '200' : '500'} characters)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Recommendations
            </h4>
            <ul className="text-sm text-blue-200 space-y-1">
              {analysis.complexity === 'complex' && (
                <li>• Complex prompts work best with advanced models like Flux Pro or DALL-E 3</li>
              )}
              {analysis.characterCount > 200 && (
                <li>• Your prompt exceeds the 200-character limit for basic models</li>
              )}
              {analysis.suggestedAction === 'optimize' && (
                <li>• The optimized version preserves key elements while fitting model limits</li>
              )}
              {analysis.suggestedAction === 'full-generation' && (
                <li>• Consider using a premium model for the best results with complex prompts</li>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {analysis.suggestedAction !== 'quick-shot' && (
              <Button
                onClick={handleUseOptimized}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Use Optimized Version
                {suggestedModel !== selectedModel && ` (${suggestedModel})`}
              </Button>
            )}
            
            <Button
              onClick={handleUseOriginal}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Use Original Prompt
            </Button>
            
            <Button
              onClick={onCancel}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
