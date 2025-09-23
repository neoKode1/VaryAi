'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Bot, User, Loader2, X, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  action?: {
    type: 'quick_shots' | 'halloween_me' | 'generate' | 'preset';
    data?: any;
  };
}

interface ConversationalChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onExecuteAction: (action: string, data?: any) => void;
  onSendPrompt: (prompt: string) => void;
  uploadedFiles: any[];
  isGenerating: boolean;
}

export const ConversationalChatPanel: React.FC<ConversationalChatPanelProps> = ({
  isOpen,
  onToggle,
  onExecuteAction,
  onSendPrompt,
  uploadedFiles,
  isGenerating
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI assistant. I can help you generate images and videos. Try saying 'Give me some quick shots' or 'Create Halloween variations'!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceInputAvailable, setVoiceInputAvailable] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        addMessage('ai', 'Sorry, I had trouble hearing you. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      setVoiceInputAvailable(true);
    }
  }, []);

  const addMessage = useCallback((type: 'user' | 'ai', content: string, action?: ChatMessage['action']) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      action
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const interpretCommand = useCallback(async (text: string): Promise<{ action?: string; data?: any; response: string }> => {
    const lowerText = text.toLowerCase();
    
    // Quick detection for obvious commands
    if (lowerText.includes('quick shot') || lowerText.includes('different angle') || 
        lowerText.includes('camera angle') || lowerText.includes('shot variation') ||
        lowerText.includes('different poses') || lowerText.includes('angles')) {
      return {
        action: 'quick_shots',
        response: "I'll open the Quick Shots presets for you! This will give you different camera angles and compositions."
      };
    }
    
    // Halloween Me commands
    if (lowerText.includes('halloween') || lowerText.includes('spooky') || 
        lowerText.includes('costume') || lowerText.includes('trick or treat') ||
        lowerText.includes('scary') || lowerText.includes('horror')) {
      return {
        action: 'halloween_me',
        response: "Perfect! I'll create Halloween-themed variations for you. Make sure you have 2 images uploaded!"
      };
    }
    
    // Generate commands
    if (lowerText.includes('generate') || lowerText.includes('create') || 
        lowerText.includes('make') || lowerText.includes('produce')) {
      return {
        action: 'generate',
        response: "I'll send this prompt to the generation system for you!"
      };
    }
    
    // Preset commands
    if (lowerText.includes('preset') || lowerText.includes('style') || 
        lowerText.includes('cinematic') || lowerText.includes('artistic')) {
      return {
        action: 'preset',
        response: "I'll help you select the best preset for your needs!"
      };
    }
    
    // For more complex or ambiguous requests, use Claude API
    try {
      const context = {
        uploadedFiles: uploadedFiles.length,
        hasImages: uploadedFiles.some(file => file.fileType === 'image'),
        hasVideos: uploadedFiles.some(file => file.fileType === 'video'),
        isGenerating
      };

      const response = await fetch('/api/claude-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          response: data.response
        };
      }
    } catch (error) {
      console.error('Claude API error:', error);
    }
    
    // Fallback response
    return {
      response: "I understand you want to generate something. I'll send this prompt to the system for you!"
    };
  }, [uploadedFiles, isGenerating]);

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    addMessage('user', messageText);
    setInputText('');
    setIsProcessing(true);

    try {
      // Interpret the command (now async)
      const interpretation = await interpretCommand(messageText);
      
      // Add AI response
      addMessage('ai', interpretation.response, interpretation.action ? {
        type: interpretation.action as any,
        data: interpretation.data
      } : undefined);

      // Execute action if needed
      if (interpretation.action) {
        setTimeout(() => {
          onExecuteAction(interpretation.action!, interpretation.data);
        }, 1000);
      } else {
        // Send as regular prompt
        onSendPrompt(messageText);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('ai', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, addMessage, interpretCommand, onExecuteAction, onSendPrompt]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="hidden lg:block fixed left-4 top-1/2 transform -translate-y-1/2 z-20 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Open AI Chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="hidden lg:block fixed left-0 top-0 h-screen w-80 bg-charcoal bg-opacity-95 backdrop-blur-md border-r border-border-gray border-opacity-30 z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-gray border-opacity-30">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <h3 className="text-light-gray font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-accent-gray hover:text-light-gray transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'ai' && <Bot className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />}
                {message.type === 'user' && <User className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  {message.action && (
                    <div className="mt-2 text-xs opacity-75">
                      Action: {message.action.type}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border-gray border-opacity-30 flex-shrink-0">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message or use voice..."
              className="w-full p-3 bg-gray-800 border border-border-gray border-opacity-30 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              rows={2}
              disabled={isGenerating}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            {voiceInputAvailable && (
              <button
                onClick={handleVoiceInput}
                disabled={isGenerating}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-gray-700 hover:bg-gray-600 text-light-gray'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isGenerating}
              className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center gap-4">
            {voiceInputAvailable && (
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3" />
                Voice enabled
              </span>
            )}
            {uploadedFiles.length > 0 && (
              <span>{uploadedFiles.length} file(s) ready</span>
            )}
          </div>
          {isGenerating && (
            <span className="text-orange-400">Generating...</span>
          )}
        </div>
      </div>
    </div>
  );
};
