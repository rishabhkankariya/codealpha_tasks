import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, Plus, LogOut, Settings, BarChart2, 
  Trash2, Search, X, PanelLeftClose, Bot
} from 'lucide-react';
import { showConfirm } from '../../services/swal';

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: number | null;
  onSelectChat: (id: number) => void;
  onNewChat: () => void;
  onDeleteChat: (id: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onToggle,
  onOpenSettings
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Client-side filtering of chats by search query
  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity" 
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 bg-chatCard border-r border-chatBorder flex flex-col z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${!isOpen ? 'md:w-0 md:overflow-hidden md:border-r-0' : ''}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-chatBorder/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-chatPrimary/10 text-chatPrimary rounded-lg">
              <Bot size={18} />
            </div>
            <span className="font-extrabold text-chatText text-sm uppercase tracking-wide">
              Chatbot Hub
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Collapse button inside sidebar */}
            <button 
              onClick={onToggle}
              className="p-1.5 text-chatTextMuted hover:text-chatText hover:bg-chatBg rounded-lg cursor-pointer transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 space-y-3 shrink-0">
          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              // Auto close sidebar on mobile after choosing new chat
              if (window.innerWidth < 768) onToggle();
            }}
            className="w-full py-3 px-4 bg-chatBg border border-chatBorder hover:border-chatPrimary/40 text-chatText hover:text-chatPrimary font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <Plus size={18} />
            New Chat
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-chatTextMuted" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-8 py-2 bg-chatBg border border-chatBorder focus:border-chatPrimary/60 rounded-xl text-xs text-chatText placeholder-chatTextMuted/50 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-chatTextMuted hover:text-chatText"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          <div className="text-[10px] font-bold text-chatTextMuted/65 uppercase tracking-widest px-3 mb-2 select-none">
            Recent Chats
          </div>
          
          {filteredChats.length === 0 ? (
            <div className="text-center py-6 text-xs text-chatTextMuted/50 italic select-none">
              {searchQuery ? "No matching chats found." : "No chat history yet."}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all duration-150 relative ${
                  activeChatId === chat.id
                    ? 'bg-chatBg border border-chatBorder text-chatPrimary font-medium'
                    : 'text-chatTextMuted hover:bg-chatBg/60 hover:text-chatText border border-transparent'
                }`}
              >
                <div
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className="flex items-center gap-2.5 flex-1 min-w-0 pr-2 select-none"
                >
                  <MessageSquare size={16} className={activeChatId === chat.id ? 'text-chatPrimary' : 'text-chatTextMuted group-hover:text-chatText'} />
                  <span className="truncate">{chat.title}</span>
                </div>

                {/* Delete button (visible on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showConfirm(
                      'Delete Conversation',
                      'Are you sure you want to delete this chat session? All message logs will be permanently erased.',
                      'Delete'
                    ).then((result) => {
                      if (result.isConfirmed) {
                        onDeleteChat(chat.id);
                      }
                    });
                  }}
                  className="p-1 hover:text-red-400 text-chatTextMuted opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer z-10 hover:bg-chatBorder/20 rounded-md"
                  title="Delete conversation"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer (User details & actions) */}
        <div className="p-4 border-t border-chatBorder bg-chatBg/30 space-y-3 shrink-0">
          {user && (
            <div className="flex items-center gap-3 px-1 py-1 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-chatPrimary/20 text-chatPrimary border border-chatPrimary/30 flex items-center justify-center font-bold uppercase select-none">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-chatText truncate">{user.name}</div>
                <div className="text-[10px] text-chatTextMuted capitalize flex items-center gap-1 font-semibold">
                  <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-chatPrimary' : 'bg-chatTextMuted/70'}`} />
                  {user.role}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {/* Admin Dashboard Page Button (for Admin accounts) */}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  navigate('/admin');
                  if (window.innerWidth < 768) onToggle();
                }}
                className="w-full py-2 px-3 bg-chatPrimary/10 border border-chatPrimary/20 text-chatPrimary hover:bg-chatPrimary hover:text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <BarChart2 size={14} />
                Admin Dashboard
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={onOpenSettings}
                className="flex-1 py-2 px-3 bg-chatBg border border-chatBorder hover:border-chatTextMuted/40 text-chatText hover:text-chatText text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Settings size={14} />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="py-2 px-3 bg-red-950/20 border border-red-900/30 hover:bg-red-900 hover:text-white text-red-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
