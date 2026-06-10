import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Chat/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import InputBar from '../components/Chat/InputBar';
import SettingsModal from '../components/Settings/SettingsModal';
import { Menu, PanelLeft, Download } from 'lucide-react';
import api from '../services/api';
import { showError } from '../services/swal';

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

interface Message {
  id: number;
  chat_id: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

const ChatPage: React.FC = () => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Responsive States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [botLoading, setBotLoading] = useState(false);

  // Fetch all chats on load
  const loadChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data);
    } catch (err) {
      console.error('Failed to load chats', err);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  // Fetch message details for active chat session
  const selectChat = async (id: number) => {
    try {
      setActiveChatId(id);
      setBotLoading(true);
      const response = await api.get(`/chats/${id}`);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Failed to load chat details', err);
      showError('Error', 'Could not retrieve chat history. Please try again.');
    } finally {
      setBotLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
  };

  // Delete a chat session
  const deleteChat = async (id: number) => {
    try {
      await api.delete(`/chats/${id}`);
      await loadChats();
      if (activeChatId === id) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
      showError('Error', 'Could not delete chat session.');
    }
  };

  // Send message to FastAPI
  const handleSendMessage = async (text: string) => {
    // 1. Instantly append user message to local thread list (micro-animations / instant feedback)
    const tempUserMsg: Message = {
      id: Date.now(),
      chat_id: activeChatId || 0,
      sender: 'user',
      message: text,
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, tempUserMsg]);
    setBotLoading(true);

    try {
      const response = await api.post('/chats/message', {
        chat_id: activeChatId,
        message: text
      });
      
      const { chat_id, title, user_message, bot_message } = response.data;
      
      // Update chat session and reload sidebar feed
      if (!activeChatId) {
        setActiveChatId(chat_id);
        setChats((prev) => [{ id: chat_id, title, created_at: new Date().toISOString() }, ...prev]);
        setMessages([user_message, bot_message]);
      } else {
        // Swap temp user message and insert final bot response
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, user_message, bot_message];
        });
      }
      
      // Reload chats list to keep titles in sync
      loadChats();
    } catch (err) {
      console.error('Failed to send message', err);
      // Remove temp message and notify
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      showError('Delivery Failed', 'Could not reach the AI backend. Please verify your connection.');
    } finally {
      setBotLoading(false);
    }
  };

  // Export current chat history transcript
  const handleExportChat = async () => {
    if (!activeChatId) return;
    try {
      const response = await api.get(`/chats/${activeChatId}/export`);
      
      // Create file download in browser
      const blob = new Blob([response.data], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const chatTitle = chats.find(c => c.id === activeChatId)?.title || 'chat_transcript';
      const cleanTitle = chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      link.setAttribute('download', `${cleanTitle}_transcript.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export transcript', err);
      showError('Export Failed', 'Could not generate chat transcript.');
    }
  };

  return (
    <div className="flex h-screen bg-chatBg text-chatText overflow-hidden relative">
      {/* Collapsed Sidebar Restore trigger for desktop */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden md:flex absolute top-4 left-4 p-2 bg-chatCard border border-chatBorder hover:border-chatPrimary/50 text-chatTextMuted hover:text-chatText rounded-xl cursor-pointer z-20 transition-all active:scale-95"
          title="Open sidebar"
        >
          <PanelLeft size={20} />
        </button>
      )}

      {/* Responsive Sidebar component */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={startNewChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Chat Area Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-chatCard border-b border-chatBorder shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-chatTextMuted hover:text-chatText hover:bg-chatBg rounded-lg"
          >
            <Menu size={20} />
          </button>
          <span className="font-extrabold text-sm uppercase tracking-wider text-chatPrimary">
            AI Chatbot
          </span>
          {activeChatId ? (
            <button
              onClick={handleExportChat}
              className="p-2 text-chatTextMuted hover:text-chatText hover:bg-chatBg rounded-lg"
              title="Export chat"
            >
              <Download size={18} />
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>

        {/* Desktop Export Action */}
        {activeChatId && (
          <button
            onClick={handleExportChat}
            className="hidden md:flex absolute top-4 right-4 p-2 bg-chatCard border border-chatBorder hover:border-chatPrimary/50 text-chatTextMuted hover:text-chatText rounded-xl cursor-pointer z-20 transition-all active:scale-95"
            title="Export conversation history"
          >
            <Download size={20} />
          </button>
        )}

        {/* Messages Workspace */}
        <ChatArea
          messages={messages}
          loading={botLoading}
          onSelectPrompt={handleSendMessage}
          chatTitle={chats.find((c) => c.id === activeChatId)?.title || 'New Chat'}
        />

        {/* Message Input Bar */}
        <div className="border-t border-chatBorder/40 bg-chatBg py-2 shrink-0">
          <InputBar onSendMessage={handleSendMessage} disabled={botLoading} />
        </div>
      </div>

      {/* Settings Modal overlay */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default ChatPage;
