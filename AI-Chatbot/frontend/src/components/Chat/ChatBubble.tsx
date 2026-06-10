import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, ThumbsUp, ThumbsDown, Star, Send, Check } from 'lucide-react';
import api from '../../services/api';
import { showError } from '../../services/swal';

interface Message {
  id: number;
  chat_id: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

interface ChatBubbleProps {
  msg: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ msg }) => {
  const isBot = msg.sender === 'bot';
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) return;
    
    setSubmittingFeedback(true);
    try {
      await api.post('/feedback', {
        chat_id: msg.chat_id,
        rating: rating,
        comment: comment.trim() || undefined
      });
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedbackForm(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback', err);
      showError('Submission Failed', 'Could not save feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full py-6 flex justify-center border-b border-chatBorder/30 ${
        isBot ? 'bg-chatCard/30' : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-3xl px-4 flex gap-4 md:gap-6 items-start">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-sm select-none ${
            isBot
              ? 'bg-chatPrimary/20 text-chatPrimary border border-chatPrimary/30'
              : 'bg-purple-600/20 text-purple-400 border border-purple-500/20'
          }`}
        >
          {isBot ? <MessageSquare size={16} /> : <User size={16} />}
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-chatText">
              {isBot ? 'AI Chatbot' : 'You'}
            </span>
            <span className="text-[10px] text-chatTextMuted/70">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="text-chatText text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.message}
          </div>

          {/* Bot Answer Feedback Section */}
          {isBot && (
            <div className="pt-3 flex flex-col gap-3">
              {!feedbackSubmitted && !showFeedbackForm && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-chatTextMuted mr-1 select-none">Was this helpful?</span>
                  <button
                    onClick={() => handleRatingClick(5)}
                    className="p-1 text-chatTextMuted hover:text-chatPrimary hover:bg-chatBg rounded-md transition-colors cursor-pointer"
                    title="Helpful (5 Stars)"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    onClick={() => handleRatingClick(2)}
                    className="p-1 text-chatTextMuted hover:text-red-400 hover:bg-chatBg rounded-md transition-colors cursor-pointer"
                    title="Not Helpful (2 Stars)"
                  >
                    <ThumbsDown size={14} />
                  </button>
                </div>
              )}

              {/* Feedback Comment Form */}
              {showFeedbackForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleFeedbackSubmit}
                  className="bg-chatBg border border-chatBorder p-3 rounded-xl max-w-md space-y-3 mt-1"
                >
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-xs text-chatText font-medium">Rate this response:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-0.5 cursor-pointer text-amber-400 transition-transform active:scale-125"
                        >
                          <Star
                            size={16}
                            fill={rating !== null && rating >= star ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {feedbackSubmitted ? (
                    <div className="flex items-center gap-2 text-chatPrimary text-xs font-semibold py-1">
                      <Check size={16} /> Feedback submitted. Thank you!
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment (optional)..."
                        className="flex-1 text-xs py-1.5 px-3 bg-chatCard border border-chatBorder focus:border-chatPrimary/60 rounded-lg text-chatText placeholder-chatTextMuted/50 focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className="p-1.5 bg-chatPrimary hover:bg-chatPrimary/90 rounded-lg text-white cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </motion.form>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
