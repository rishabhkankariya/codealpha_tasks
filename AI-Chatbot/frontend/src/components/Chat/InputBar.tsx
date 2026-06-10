import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { chatbotSwal } from '../../services/swal';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, disabled = false }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize input height based on length
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleAttachClick = () => {
    chatbotSwal.fire({
      title: 'Admin Access Required',
      text: 'To upload and train the chatbot with PDF knowledge bases, please navigate to the Admin Dashboard (available for Admin users).',
      icon: 'info'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto px-4 py-2 relative">
      <div className="relative flex items-end w-full bg-chatCard border border-chatBorder focus-within:border-chatPrimary/60 rounded-2xl p-2 transition-colors">
        
        {/* Attachment Button */}
        <button
          type="button"
          onClick={handleAttachClick}
          className="p-2.5 text-chatTextMuted hover:text-chatText rounded-xl hover:bg-chatBg/50 cursor-pointer transition-colors"
          title="Attach files (Admin Upload)"
        >
          <Paperclip size={20} />
        </button>

        {/* Input Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message AI Chatbot..."
          disabled={disabled}
          className="flex-1 max-h-48 py-2.5 px-3 bg-transparent text-chatText placeholder-chatTextMuted/50 focus:outline-none resize-none overflow-y-auto leading-relaxed text-sm"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="p-2.5 bg-chatPrimary hover:bg-chatPrimary/95 active:scale-95 disabled:active:scale-100 disabled:opacity-30 disabled:bg-chatPrimary text-white rounded-xl cursor-pointer transition-all shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
      <p className="text-center text-[10px] text-chatTextMuted/40 mt-2 select-none">
        AI Chatbot can make mistakes. Verify important info.
      </p>
    </form>
  );
};

export default InputBar;
