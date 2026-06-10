import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Calendar, Mail, Bot, Terminal, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg glass-panel rounded-2xl shadow-2xl relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-chatBorder flex items-center justify-between">
              <div className="flex items-center gap-2 text-chatPrimary">
                <Settings size={20} />
                <h3 className="font-bold text-chatText">System Settings</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-chatTextMuted hover:text-chatText hover:bg-chatCard rounded-lg cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-6">
              {/* Profile card details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-chatTextMuted uppercase tracking-wider">User Account Profile</h4>
                
                <div className="bg-chatCard/50 border border-chatBorder p-4 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-chatPrimary/10 border border-chatPrimary/20 flex items-center justify-center text-chatPrimary font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-chatText">{user.name}</div>
                      <div className="text-xs text-chatTextMuted flex items-center gap-1.5 capitalize font-medium">
                        <Shield size={12} className="text-chatPrimary" />
                        {user.role} role access
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-chatBorder/40" />

                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-chatTextMuted">
                      <Mail size={14} />
                      <span className="font-medium">Email:</span>
                      <span className="text-chatText">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-chatTextMuted">
                      <Calendar size={14} />
                      <span className="font-medium">Joined:</span>
                      <span className="text-chatText">
                        {new Date(user.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chatbot Specifications info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-chatTextMuted uppercase tracking-wider">Chatbot Specifications</h4>
                <div className="bg-chatCard/30 border border-chatBorder/50 p-4 rounded-xl space-y-2.5 text-xs text-chatTextMuted">
                  <div className="flex items-start gap-2">
                    <Bot size={16} className="text-chatPrimary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-chatText">Model all-MiniLM-L6-v2</div>
                      <div>Retrieves answers based on semantic similarity search using FAISS vector indexing. Runs locally on CPU.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Terminal size={16} className="text-chatPrimary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-chatText">Response Classification</div>
                      <div>Intent categorization mapping handles routine statements (confidence &gt; 80%), falling back to FAISS database lookup.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-chatBorder bg-chatCard flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-chatPrimary hover:bg-chatPrimary/90 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Close Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
