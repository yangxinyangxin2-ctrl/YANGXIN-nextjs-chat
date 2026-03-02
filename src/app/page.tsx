'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EmptyChatIcon, LoadingDots, SendIcon } from './Icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ModelOption {
  id: string;
  name: string;
}

async function getModels(): Promise<ModelOption[]> {
  try {
    const response = await fetch('/api/models');
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [isModelOpen, setIsModelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      if (!isInitialized.current) {
        isInitialized.current = true;
        const models = await getModels();
        setAvailableModels(models);
        if (models.length > 0) {
          setCurrentModel(models[0].id);
        }
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    };
    if (isModelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModelOpen]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: currentModel,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `抱歉，发生了错误: ${err.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 300)}px`;
  };

  const currentModelInfo = availableModels.find((m) => m.id === currentModel);

  return (
    <div className="flex flex-col h-screen bg-blue-950 text-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="mb-8">
                <EmptyChatIcon className="w-16 h-16 text-blue-300 mx-auto" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                Hello, I&apos;m Chatbot
              </h3>
              <p className="text-blue-200 text-sm">Start a conversation</p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div key={message.id} className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-4 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0 pt-1">
                        {isUser ? (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-blue-200"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center text-sm text-blue-50">
                        {isUser ? (
                          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="markdown-body prose dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && <LoadingDots />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-950 px-4 py-6 border-t border-blue-900">
        <div className="max-w-4xl mx-auto">
          <div className="relative px-6 py-4 rounded-3xl border border-blue-800 bg-blue-900/50 shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              rows={1}
              className="w-full bg-transparent text-white placeholder-blue-300 focus:outline-none focus:ring-0 resize-none disabled:opacity-50 disabled:cursor-not-allowed text-base min-h-[80px] pb-12 border-0"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="relative" ref={modelDropdownRef}>
                <button
                  onClick={() => setIsModelOpen(!isModelOpen)}
                  className="flex items-center gap-1.5 px-0 py-0 hover:opacity-70 transition-opacity text-sm"
                >
                  <span className="text-blue-200 font-medium">
                    {currentModelInfo?.name || 'Select Model'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-blue-300 transition-transform ${
                      isModelOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isModelOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-56 bg-blue-900 border border-blue-800 rounded-lg shadow-xl z-50">
                    <div className="p-1.5">
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setCurrentModel(model.id);
                            setIsModelOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                            model.id === currentModel
                              ? 'bg-blue-800'
                              : 'hover:bg-blue-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{model.name}</p>
                            {model.id === currentModel && (
                              <svg
                                className="w-4 h-4 text-white flex-shrink-0 ml-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 rounded-full bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors flex items-center justify-center flex-shrink-0"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
