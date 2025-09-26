'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, Image, Upload, Play } from 'lucide-react';

interface GlifVideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
  userId?: string;
}

export const GlifVideoGenerator: React.FC<GlifVideoGeneratorProps> = ({
  onVideoGenerated,
  userId
}) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    if (!prompt && !imageUrl && !videoUrl) {
      setError('Please provide at least one input (prompt, image, or video)');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGenerationStatus('Starting Infinite Kling 2.5 generation...');

    try {
      const response = await fetch('/api/glif/infinite-kling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageUrl: imageUrl.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      setResult(data);
      setGenerationStatus('Generation completed successfully!');

      if (data.output && onVideoGenerated) {
        onVideoGenerated(data.output);
      }

    } catch (err) {
      console.error('❌ Generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGenerationStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setPrompt('');
    setImageUrl('');
    setVideoUrl('');
    setResult(null);
    setError('');
    setGenerationStatus('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Infinite Kling 2.5 Video Generator
          <Badge variant="secondary">Glif API</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate infinitely long one-take videos using Kling 2.5. Provide a prompt, image, or video to get started.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Prompt (Optional)
          </label>
          <Textarea
            id="prompt"
            placeholder="Describe the video you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </div>

        {/* Image URL Input */}
        <div className="space-y-2">
          <label htmlFor="imageUrl" className="text-sm font-medium flex items-center gap-2">
            <Image className="h-4 w-4" />
            Image URL (Optional)
          </label>
          <Input
            id="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {/* Video URL Input */}
        <div className="space-y-2">
          <label htmlFor="videoUrl" className="text-sm font-medium flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video URL (Optional)
          </label>
          <Input
            id="videoUrl"
            type="url"
            placeholder="https://example.com/video.mp4"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Generation Status */}
        {generationStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-600">{generationStatus}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-800 mb-2">Generation Result:</h4>
            {result.output && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">Video URL: {result.output}</p>
                <video 
                  src={result.output} 
                  controls 
                  className="w-full max-w-md rounded-md"
                  poster="/placeholder-video.jpg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            {result.price && (
              <p className="text-sm text-green-600">Cost: {result.price} credits</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt && !imageUrl && !videoUrl)}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
          
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={isGenerating}
          >
            Clear
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Provide at least one input (prompt, image, or video)</p>
          <p>• Generation may take several minutes</p>
          <p>• Videos are stored in your gallery automatically</p>
        </div>
      </CardContent>
    </Card>
  );
};
