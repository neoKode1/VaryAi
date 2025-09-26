'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Bot, User, Loader2, X, MessageSquare, Video } from 'lucide-react';
import { GlifVideoGenerator } from './GlifVideoGenerator';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  action?: {
    type: 'quick_shots' | 'halloween_me' | 'generate' | 'preset' | 'video_generation';
    data?: any;
  };
}

interface ConversationState {
  isWaitingForConfirmation: boolean;
  pendingAction?: {
    type: string;
    prompt: string;
    context: any;
  };
  sceneContext?: {
    type?: string;
    setting?: string;
    style?: string;
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
  const [conversationState, setConversationState] = useState<ConversationState>({
    isWaitingForConfirmation: false
  });
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  
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

  const interpretCommand = useCallback(async (text: string): Promise<{ action?: string; data?: any; response: string; needsConfirmation?: boolean; pendingAction?: any }> => {
    const lowerText = text.toLowerCase();
    
    // Handle confirmation responses
    if (conversationState.isWaitingForConfirmation) {
      if (lowerText.includes('yes') || lowerText.includes('yeah') || lowerText.includes('sure') || lowerText.includes('proceed')) {
        if (conversationState.pendingAction) {
          setConversationState(prev => ({ ...prev, isWaitingForConfirmation: false }));
          return {
            action: conversationState.pendingAction.type,
            data: conversationState.pendingAction.context,
            response: "Perfect! I'll generate that for you now.",
            pendingAction: conversationState.pendingAction
          };
        }
      } else if (lowerText.includes('no') || lowerText.includes('cancel') || lowerText.includes('stop')) {
        setConversationState(prev => ({ ...prev, isWaitingForConfirmation: false, pendingAction: undefined }));
        return {
          response: "No problem! What would you like to try instead?"
        };
      }
    }
    
    // Scene generation requests
    if (lowerText.includes('scene') || lowerText.includes('scenes') || lowerText.includes('iterate') || 
        lowerText.includes('generate') && (lowerText.includes('character') || lowerText.includes('this'))) {
      
      // Ask for scene details
      if (!conversationState.sceneContext?.type) {
        setConversationState(prev => ({ 
          ...prev, 
          sceneContext: { ...prev.sceneContext, type: 'scene' }
        }));
        return {
          response: "Great! I'd love to help you create scenes for this character. What type of scene are you thinking? (e.g., action, dramatic, cinematic, outdoor, indoor, etc.)"
        };
      }
      
      // Ask for setting if we have type but not setting
      if (conversationState.sceneContext.type && !conversationState.sceneContext.setting) {
        const sceneType = text.trim();
        setConversationState(prev => ({ 
          ...prev, 
          sceneContext: { ...prev.sceneContext, setting: sceneType }
        }));
        return {
          response: `Nice! ${sceneType} scenes are great. What kind of setting or environment would you like? (e.g., forest, city, studio, beach, etc.)`
        };
      }
      
      // Propose specific generation
      if (conversationState.sceneContext.type && conversationState.sceneContext.setting) {
        const sceneType = conversationState.sceneContext.setting;
        const setting = text.trim();
        const proposedPrompt = `Close-up shots of this character in a ${sceneType} scene, ${setting} setting, cinematic lighting, professional photography`;
        
        setConversationState(prev => ({ 
          ...prev, 
          isWaitingForConfirmation: true,
          pendingAction: {
            type: 'generate',
            prompt: proposedPrompt,
            context: { customPrompt: proposedPrompt }
          }
        }));
        
        return {
          response: `Perfect! How about some close-up shots of this character in a ${sceneType} scene with a ${setting} setting? Should I proceed with generating this?`,
          needsConfirmation: true
        };
      }
    }
    
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
    
    // Video generation commands
    if (lowerText.includes('video') || lowerText.includes('infinite kling') || 
        lowerText.includes('kling 2.5') || lowerText.includes('long video') ||
        lowerText.includes('one-take') || lowerText.includes('continuous video')) {
      return {
        action: 'video_generation',
        response: "Great! I'll open the Infinite Kling 2.5 video generator for you. You can create infinitely long one-take videos!"
      };
    }
    
    // For more complex or ambiguous requests, use Claude API
    try {
      const context = {
        uploadedFiles: uploadedFiles.length,
        hasImages: uploadedFiles.some(file => file.fileType === 'image'),
        hasVideos: uploadedFiles.some(file => file.fileType === 'video'),
        isGenerating,
        conversationState
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
  }, [uploadedFiles, isGenerating, conversationState]);

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
          if (interpretation.pendingAction?.context?.customPrompt) {
            // Send custom prompt to main input
            onSendPrompt(interpretation.pendingAction.context.customPrompt);
          } else if (interpretation.action === 'video_generation') {
            // Show video generator modal
            setShowVideoGenerator(true);
          } else {
            onExecuteAction(interpretation.action!, interpretation.data);
          }
        }, 1000);
      } else if (!interpretation.needsConfirmation) {
        // Send as regular prompt only if not waiting for confirmation
        onSendPrompt(messageText);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('ai', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, addMessage, interpretCommand, onExecuteAction, onSendPrompt]);

  const handleVideoGeneration = useCallback((videoUrl: string) => {
    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `🎬 Your Infinite Kling 2.5 video has been generated! Check it out:`,
      timestamp: new Date(),
      action: {
        type: 'video_generation',
        data: { videoUrl }
      }
    };

    setMessages(prev => [...prev, aiMessage]);
    setShowVideoGenerator(false);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      
      // If modal hasn't been dragged yet, it's centered
      if (!modalPosition.x && !modalPosition.y) {
        // Modal is centered, so we need to account for the transform
        setDragOffset({
          x: e.clientX - (window.innerWidth / 2),
          y: e.clientY - (window.innerHeight / 2)
        });
      } else {
        // Modal has been dragged, use actual position
        setDragOffset({
          x: e.clientX - modalPosition.x,
          y: e.clientY - modalPosition.y
        });
      }
    }
  }, [modalPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
    <>
      {/* Backdrop for click-away functionality */}
      <div 
        className="hidden lg:block fixed inset-0 bg-black bg-opacity-50 z-20"
        onClick={onToggle}
      />
      
      {/* Chat Modal */}
      <div 
        className="hidden lg:block fixed w-96 h-[600px] bg-charcoal bg-opacity-95 backdrop-blur-md border border-border-gray border-opacity-30 rounded-lg shadow-2xl z-30 flex flex-col"
        style={{
          left: modalPosition.x || '50%',
          top: modalPosition.y || '50%',
          transform: modalPosition.x ? 'none' : 'translate(-50%, -50%)',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
      {/* Header - Draggable */}
      <div 
        className="flex items-center justify-between p-4 border-b border-border-gray border-opacity-30 drag-handle cursor-grab select-none"
        onMouseDown={handleMouseDown}
      >
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
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
                    <div className="mt-2">
                      {message.action.type === 'video_generation' && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-600 mb-2">🎬 Video Generated!</p>
                          {message.action.data?.videoUrl && (
                            <video 
                              src={message.action.data.videoUrl} 
                              controls 
                              className="w-full max-w-sm rounded-md"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      )}
                      {message.action.type !== 'video_generation' && (
                        <div className="text-xs opacity-75">
                          Action: {message.action.type}
                        </div>
                      )}
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

      {/* Video Generator Modal */}
      {showVideoGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Infinite Kling 2.5 Video Generator</h3>
                <button
                  onClick={() => setShowVideoGenerator(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <GlifVideoGenerator
                onVideoGenerated={handleVideoGeneration}
                userId={uploadedFiles[0]?.userId} // You might need to pass the actual user ID
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
