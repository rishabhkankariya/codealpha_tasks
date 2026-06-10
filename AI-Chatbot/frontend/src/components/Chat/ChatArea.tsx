import React, { useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';
import SuggestedPrompts from './SuggestedPrompts';
import { Bot, MessageSquare } from 'lucide-react';

interface Message {
  id: number;
  chat_id: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

interface ChatAreaProps {
  messages: Message[];
  loading: boolean;
  onSelectPrompt: (promptText: string) => void;
  chatTitle: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  loading,
  onSelectPrompt,
  chatTitle
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of the message thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto bg-chatBg flex flex-col">
      {messages.length === 0 ? (
        // Welcome View / Home Screen
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 max-w-4xl mx-auto w-full">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-chatPrimary/10 border border-chatPrimary/30 rounded-2xl flex items-center justify-center text-chatPrimary animate-pulse">
              <Bot size={40} />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-chatText tracking-tight">
              How can I help you today?
            </h2>
            <p className="text-chatTextMuted text-sm md:text-base max-w-md">
              Ask about college admissions, fees, hostel check-ins, bus passes, schedules, or refund policies.
            </p>
          </div>

          <SuggestedPrompts onSelectPrompt={onSelectPrompt} />
        </div>
      ) : (
        // Message thread view
        <div className="flex-1 flex flex-col">
          {/* Channel Header Banner */}
          <div className="sticky top-0 bg-chatBg/80 backdrop-blur-md border-b border-chatBorder/40 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-chatCard border border-chatBorder flex items-center justify-center text-chatPrimary">
                <MessageSquare size={16} />
              </div>
              <h3 className="text-chatText font-bold text-sm truncate max-w-xs sm:max-w-md">
                {chatTitle}
              </h3>
            </div>
          </div>

          {/* List of bubbles */}
          <div className="flex-1">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="w-full py-6 flex justify-center bg-chatCard/30 border-b border-chatBorder/30">
                <div className="w-full max-w-3xl px-4 flex gap-4 md:gap-6 items-start">
                  <div className="w-8 h-8 rounded-lg bg-chatPrimary/20 text-chatPrimary border border-chatPrimary/30 flex items-center justify-center font-bold text-sm animate-pulse">
                    <Bot size={16} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-semibold text-chatText">AI Chatbot</span>
                    <div className="flex space-x-1.5 items-center justify-start py-2.5">
                      <div className="w-2 h-2 bg-chatPrimary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-chatPrimary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-chatPrimary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
