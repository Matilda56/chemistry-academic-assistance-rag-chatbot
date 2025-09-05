'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
// from app/chat -> ../../lib/withBase
import { withBase } from '/workspace/rag-bot/ui/app/lib/withBase.ts';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text:
        'Hello! I am the Chemistry Department assistant bot at Durham University. I can help you answer questions related to Durham University Chemistry Department, including course outlines, grade percentages, exam schedules, reimbursement processes and other areas. What would you like to know?',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Call Next API route on same origin
  const getBotResponse = async (userMessage: string): Promise<string> => {
    try {
      const resp = await fetch(withBase('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ question: userMessage }),
      });

      const text = await resp.text();
      if (!resp.ok) return `Backend ${resp.status}: ${text}`;
      const data = JSON.parse(text);
      return data?.answer ?? 'Empty answer';
    } catch {
      return 'Sorry, I cannot answer this question right now.';
    }
  };

  const handleSendMessage = async () => {
    if (isTyping) return;
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    const loadingMessage: Message = {
      id: Date.now() + 1,
      text: '',
      isBot: true,
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);
    setIsTyping(true);

    try {
      const botResponseText = await getBotResponse(userMessage.text);
      setMessages(prev => {
        const withoutLoading = prev.filter(m => !m.isLoading);
        return [...withoutLoading, {
          id: Date.now() + 2,
          text: botResponseText,
          isBot: true,
          timestamp: new Date(),
        }];
      });
    } catch {
      setMessages(prev => {
        const withoutLoading = prev.filter(m => !m.isLoading);
        return [...withoutLoading, {
          id: Date.now() + 2,
          text: 'Sorry, I encountered some technical issues. Please try again later.',
          isBot: true,
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
              <i className="ri-robot-2-line text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Chemistry Assistant</h1>
              <p className="text-sm text-gray-600">Online to answer your chemistry questions</p>
            </div>
          </div>
          <Link
            href={withBase('/')}
            prefetch={false}
            className="text-purple-600 hover:text-purple-800 cursor-pointer"
          >
            <i className="ri-home-line mr-1"></i>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 pb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl h-full flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex max-w-xs lg:max-w-md ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.isBot ? 'bg-gradient-to-br from-blue-500 to-purple-600 mr-3' : 'bg-blue-100 ml-3'}`}>
                      <i className={`text-lg ${message.isBot ? 'ri-robot-2-line text-white' : 'ri-user-smile-line text-blue-600'}`}></i>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl min-h-[60px] flex items-center ${message.isBot ? 'bg-white shadow-lg border border-gray-100' : 'bg-gradient-to-r from-blue-200 to-purple-200 text-gray-700'}`} style={message.isBot ? { boxShadow: '0 4px 20px rgba(147, 51, 234, 0.15)' } : {}}>
                      {message.isLoading ? (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      ) : (
                        <div>
                          <p className={`text-sm ${message.isBot ? 'text-gray-800' : 'text-gray-700'}`}>{message.text}</p>
                          <p className="text-xs mt-1 text-gray-500">{message.timestamp.toLocaleTimeString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your chemistry question..."
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                rows={2}
                maxLength={500}
                aria-label="Type your message"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
                title={isTyping ? 'Sending…' : 'Send'}
              >
                <i className="ri-send-plane-line"></i>
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">Press Enter to send, Shift + Enter for new line</div>
          </div>
        </div>
      </div>
    </div>
  );
}
