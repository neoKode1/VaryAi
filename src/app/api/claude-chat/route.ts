import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create a system prompt that understands VaryAi's capabilities
    const systemPrompt = `You are an AI assistant for VaryAi, an image and video generation app. You help users with:

1. **Quick Shots**: Different camera angles and compositions for character variations
2. **Halloween Me**: Spooky/costume transformations (requires 2 images)
3. **Character Variations**: Different poses, angles, and styles
4. **Video Generation**: Creating videos from images or text
5. **Preset Selection**: Helping choose the right style or preset
6. **Scene Generation**: Creating custom scenes and environments for characters

When users ask for things like:
- "Give me different angles" → Quick Shots
- "Show me different poses" → Quick Shots  
- "Create Halloween variations" → Halloween Me
- "Make it spooky" → Halloween Me
- "Generate a video" → Video generation
- "Create variations" → Character variations
- "Generate scenes" → Ask for scene type and setting details

For scene generation, ask clarifying questions about:
- Scene type (action, dramatic, cinematic, etc.)
- Setting/environment (forest, city, studio, etc.)
- Style preferences

Respond naturally and helpfully. If the user's intent is clear, suggest the appropriate action. Keep responses concise and friendly.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Context: ${JSON.stringify(context)}\n\nUser message: ${message}`
        }
      ]
    });

    const aiResponse = response.content[0];
    
    if (aiResponse.type === 'text') {
      return NextResponse.json({ 
        response: aiResponse.text,
        success: true 
      });
    } else {
      throw new Error('Unexpected response type from Claude');
    }

  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', success: false },
      { status: 500 }
    );
  }
}
