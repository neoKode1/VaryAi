'use client';

import { useState } from 'react';

export default function TestCleanPage() {
  const [prompt, setPrompt] = useState('ancient warrior');
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setStatus(null);

    try {
      console.log('🚀 Testing clean nano-banana API...');
      
      const response = await fetch('/api/nano-banana-clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_urls: imageUrl ? [imageUrl] : ['https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png'],
          num_images: 1,
          output_format: 'jpeg',
          sync_mode: false
        }),
      });

      const data = await response.json();
      console.log('📡 Response:', data);
      
      if (data.success) {
        setResult(data);
        // Start polling for status
        pollStatus(data.request_id);
      } else {
        setResult({ error: data.error });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = async (requestId: string) => {
    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/nano-banana-clean?request_id=${requestId}`);
        const statusData = await response.json();
        
        console.log(`📊 Status check ${attempts + 1}:`, statusData);
        setStatus(statusData);
        
        if (statusData.success && statusData.status === 'COMPLETED') {
          // Get the actual results
          try {
            const resultResponse = await fetch(`https://queue.fal.run/fal-ai/nano-banana/edit/requests/${requestId}`);
            const resultData = await resultResponse.json();
            console.log('🎉 Final result:', resultData);
            setResult({ ...result, final_result: resultData });
          } catch (error) {
            console.error('❌ Error getting final result:', error);
          }
          return;
        }
        
        if (statusData.success && statusData.status === 'FAILED') {
          console.log('❌ Generation failed');
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          console.log('⏰ Polling timeout');
        }
      } catch (error) {
        console.error('❌ Error polling status:', error);
      }
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Clean Nano-Banana Test</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Prompt:</label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
              placeholder="Enter prompt..."
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Image URL (optional):</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
              placeholder="Enter image URL or leave empty for default"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium"
          >
            {loading ? 'Submitting...' : 'Submit to FAL AI'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {status && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
