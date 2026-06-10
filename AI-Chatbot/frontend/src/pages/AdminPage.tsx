import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, BarChart2, BookOpen, MessageSquare, Trash2, 
  Upload, Plus, Star, Users, Database, FileText, CheckCircle, Loader 
} from 'lucide-react';
import api from '../services/api';
import { showError, showSuccess, showConfirm } from '../services/swal';

interface KBEntry {
  id: number;
  category: string;
  question: string;
  answer: string;
}

interface FeedbackLog {
  id: number;
  chat_id: number;
  user_id: number | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface AnalyticsStats {
  summary: {
    total_users: number;
    total_chats: number;
    total_messages: number;
    total_kb_entries: number;
    average_rating: number;
    total_feedbacks: number;
  };
  rating_distribution: Record<number, number>;
  kb_categories: Record<string, number>;
  sender_distribution: Record<string, number>;
  recent_chats: Array<{
    id: number;
    title: string;
    created_at: string;
    username: string;
    message_count: number;
  }>;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'analytics' | 'kb' | 'feedback'>('analytics');

  // API Data States
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Add KB Entry Form States
  const [newCategory, setNewCategory] = useState('General FAQ');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [addingKB, setAddingKB] = useState(false);

  // PDF Upload States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Load active tab data
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const res = await api.get('/analytics/stats');
        setAnalytics(res.data);
      } else if (activeTab === 'kb') {
        const res = await api.get('/kb');
        setKbEntries(res.data);
      } else if (activeTab === 'feedback') {
        const res = await api.get('/feedback');
        setFeedbacks(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
      showError('Data Error', 'Error fetching records. Check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [activeTab, user]);

  // Delete KB Entry
  const handleDeleteKB = async (id: number) => {
    showConfirm(
      'Delete FAQ Entry',
      'Are you sure you want to delete this Knowledge Base entry? This action is permanent and will remove it from FAISS search.',
      'Delete'
    ).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/kb/${id}`);
          setKbEntries((prev) => prev.filter((entry) => entry.id !== id));
          showSuccess('Deleted!', 'FAQ entry was deleted successfully.');
        } catch (err) {
          console.error('Failed to delete KB entry', err);
          showError('Delete Failed', 'Failed to delete FAQ entry.');
        }
      }
    });
  };

  // Create Manual KB Entry
  const handleAddKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    setAddingKB(true);
    try {
      const res = await api.post('/kb', {
        category: newCategory.trim(),
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
      });
      setKbEntries((prev) => [...prev, res.data]);
      setNewQuestion('');
      setNewAnswer('');
      showSuccess('FAQ Saved', 'Knowledge Base entry added successfully!');
    } catch (err) {
      console.error('Failed to add KB entry', err);
      showError('Save Failed', 'Error creating manual FAQ entry.');
    } finally {
      setAddingKB(false);
    }
  };

  // Upload PDF KB Ingestion
  const handlePDFUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return;

    const formData = new FormData();
    formData.append('file', pdfFile);

    setUploadingPDF(true);
    setUploadSuccess(null);

    try {
      const res = await api.post('/kb/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess(
        `Successfully uploaded PDF! Created ${res.data.inserted_qa_relations} index records.`
      );
      setPdfFile(null);
      // Reset input element
      const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // If we are showing KB list, reload it
      if (activeTab === 'kb') {
        const resKb = await api.get('/kb');
        setKbEntries(resKb.data);
      }
    } catch (err: any) {
      console.error('PDF ingestion failed', err);
      showError('Ingestion Failed', err.response?.data?.detail || 'Failed to ingest PDF. Ensure it has readable text.');
    } finally {
      setUploadingPDF(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-chatBg text-chatText flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 bg-chatCard border-b border-chatBorder px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-chatTextMuted hover:text-chatText hover:bg-chatBg border border-chatBorder hover:border-chatPrimary/30 rounded-xl cursor-pointer transition-colors"
            title="Return to chat platform"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-chatText flex items-center gap-2">
              System Admin Portal
            </h1>
            <p className="text-[10px] text-chatTextMuted font-semibold tracking-wider uppercase">
              Management & Performance Analytics
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-chatBg border border-chatBorder p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'analytics' ? 'bg-chatPrimary text-white' : 'text-chatTextMuted hover:text-chatText'
            }`}
          >
            <BarChart2 size={14} /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('kb')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'kb' ? 'bg-chatPrimary text-white' : 'text-chatTextMuted hover:text-chatText'
            }`}
          >
            <BookOpen size={14} /> Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'feedback' ? 'bg-chatPrimary text-white' : 'text-chatTextMuted hover:text-chatText'
            }`}
          >
            <MessageSquare size={14} /> Feedbacks
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {loading && !analytics && kbEntries.length === 0 && feedbacks.length === 0 ? (
          <div className="flex items-center justify-center py-20 flex-col gap-3">
            <Loader className="animate-spin text-chatPrimary" size={36} />
            <span className="text-chatTextMuted text-sm">Aggregating platform datasets...</span>
          </div>
        ) : (
          <>
            {/* TABS 1: SYSTEM ANALYTICS */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                {/* Metric Summary Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="bg-chatCard border border-chatBorder p-4 rounded-2xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-chatTextMuted tracking-wider mb-2 flex items-center gap-1">
                      <Users size={12} className="text-purple-400" /> Users
                    </span>
                    <span className="text-2xl font-black text-chatText">{analytics.summary.total_users}</span>
                  </div>
                  <div className="bg-chatCard border border-chatBorder p-4 rounded-2xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-chatTextMuted tracking-wider mb-2 flex items-center gap-1">
                      <MessageSquare size={12} className="text-emerald-400" /> Chats
                    </span>
                    <span className="text-2xl font-black text-chatText">{analytics.summary.total_chats}</span>
                  </div>
                  <div className="bg-chatCard border border-chatBorder p-4 rounded-2xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-chatTextMuted tracking-wider mb-2 flex items-center gap-1">
                      <FileText size={12} className="text-sky-400" /> Messages
                    </span>
                    <span className="text-2xl font-black text-chatText">{analytics.summary.total_messages}</span>
                  </div>
                  <div className="bg-chatCard border border-chatBorder p-4 rounded-2xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-chatTextMuted tracking-wider mb-2 flex items-center gap-1">
                      <Database size={12} className="text-amber-400" /> KB Entries
                    </span>
                    <span className="text-2xl font-black text-chatText">{analytics.summary.total_kb_entries}</span>
                  </div>
                  <div className="bg-chatCard border border-chatBorder p-4 rounded-2xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-chatTextMuted tracking-wider mb-2 flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" /> Avg Rating
                    </span>
                    <span className="text-2xl font-black text-chatText flex items-center gap-1">
                      {analytics.summary.average_rating} <Star size={18} fill="currentColor" className="text-yellow-500" />
                    </span>
                  </div>
                  <div className="bg-chatCard border border-chatBorder p-4 rounded-2xl flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-chatTextMuted tracking-wider mb-2 flex items-center gap-1">
                      <CheckCircle size={12} className="text-pink-400" /> Reviews
                    </span>
                    <span className="text-2xl font-black text-chatText">{analytics.summary.total_feedbacks}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Rating distribution CSS progress bars */}
                  <div className="bg-chatCard border border-chatBorder p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-chatText">User Feedback Ratings</h3>
                    <div className="space-y-3 pt-2">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = analytics.rating_distribution[stars] || 0;
                        const total = analytics.summary.total_feedbacks || 1;
                        const percentage = Math.round((count / total) * 100);
                        return (
                          <div key={stars} className="flex items-center gap-3 text-xs">
                            <span className="w-10 font-medium text-chatTextMuted flex items-center gap-0.5">
                              {stars} <Star size={12} fill="currentColor" className="text-yellow-500 shrink-0" />
                            </span>
                            <div className="flex-1 h-3 bg-chatBg rounded-full overflow-hidden border border-chatBorder">
                              <div
                                style={{ width: `${percentage}%` }}
                                className="h-full bg-chatPrimary transition-all duration-500"
                              />
                            </div>
                            <span className="w-8 text-right font-semibold text-chatText">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* KB Categories Breakdown list */}
                  <div className="bg-chatCard border border-chatBorder p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-chatText">Knowledge Base Categories</h3>
                    <div className="overflow-y-auto max-h-56 space-y-2 pr-1">
                      {Object.keys(analytics.kb_categories).length === 0 ? (
                        <div className="text-center py-10 text-xs text-chatTextMuted italic">No entries indexed.</div>
                      ) : (
                        Object.entries(analytics.kb_categories).map(([cat, count]) => (
                          <div key={cat} className="flex justify-between items-center text-xs py-2 border-b border-chatBorder/30">
                            <span className="font-semibold text-chatText truncate max-w-[200px]">{cat}</span>
                            <span className="px-2 py-0.5 bg-chatBg border border-chatBorder text-chatPrimary rounded-md font-bold">
                              {count} items
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Sender distribution chart widget */}
                  <div className="bg-chatCard border border-chatBorder p-6 rounded-2xl flex flex-col justify-between">
                    <h3 className="text-sm font-bold text-chatText mb-4">Message Share Ratio</h3>
                    <div className="flex-1 flex flex-col justify-center items-center gap-4 py-2">
                      <div className="flex gap-8 text-center text-xs">
                        <div>
                          <div className="text-2xl font-black text-purple-400">{analytics.sender_distribution.user || 0}</div>
                          <span className="text-chatTextMuted uppercase tracking-wider text-[9px] font-bold">User Sent</span>
                        </div>
                        <div className="border-r border-chatBorder" />
                        <div>
                          <div className="text-2xl font-black text-chatPrimary">{analytics.sender_distribution.bot || 0}</div>
                          <span className="text-chatTextMuted uppercase tracking-wider text-[9px] font-bold">AI Replied</span>
                        </div>
                      </div>
                      <div className="w-full h-4 bg-chatBg rounded-full overflow-hidden border border-chatBorder flex mt-2">
                        {(() => {
                          const total = (analytics.sender_distribution.user || 0) + (analytics.sender_distribution.bot || 0) || 1;
                          const userPct = ((analytics.sender_distribution.user || 0) / total) * 100;
                          return (
                            <>
                              <div style={{ width: `${userPct}%` }} className="bg-purple-500 h-full" />
                              <div style={{ width: `${100 - userPct}%` }} className="bg-chatPrimary h-full" />
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Chat Session Table */}
                <div className="bg-chatCard border border-chatBorder p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-chatText">Active Conversations Log</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-chatBorder text-chatTextMuted font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Chat Title</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Message Count</th>
                          <th className="py-3 px-4">Start Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recent_chats.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-chatTextMuted italic">No active conversations found.</td>
                          </tr>
                        ) : (
                          analytics.recent_chats.map((c) => (
                            <tr key={c.id} className="border-b border-chatBorder/40 hover:bg-chatBg/30">
                              <td className="py-3.5 px-4 font-bold text-chatText truncate max-w-xs">{c.title}</td>
                              <td className="py-3.5 px-4 text-chatTextMuted">{c.username}</td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 bg-chatBg border border-chatBorder text-chatText rounded-md font-semibold">
                                  {c.message_count} msgs
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-chatTextMuted">
                                {new Date(c.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TABS 2: KNOWLEDGE BASE CONFIG */}
            {activeTab === 'kb' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Forms: Manual entry + PDF uploader */}
                <div className="space-y-6 lg:col-span-1">
                  
                  {/* PDF Knowledge Uploader */}
                  <div className="bg-chatCard border border-chatBorder p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-chatText flex items-center gap-2">
                      <Upload size={16} className="text-chatPrimary" /> Ingest PDF Knowledge Base
                    </h3>
                    <p className="text-xs text-chatTextMuted leading-relaxed">
                      Upload any university prospectus or transport guidelines. The system automatically extracts paragraphs, generates semantic searchable sentence keys, and incorporates them into the FAISS index.
                    </p>

                    <form onSubmit={handlePDFUpload} className="space-y-4 pt-2">
                      <div className="border-2 border-dashed border-chatBorder hover:border-chatPrimary/60 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                        <input
                          id="pdf-file-input"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="text-chatTextMuted mb-2" size={24} />
                        <span className="text-xs font-bold text-chatText truncate max-w-[200px]">
                          {pdfFile ? pdfFile.name : 'Choose a PDF file'}
                        </span>
                        <span className="text-[10px] text-chatTextMuted mt-1">PDF max 5MB</span>
                      </div>

                      {uploadSuccess && (
                        <div className="p-3 bg-chatPrimary/10 border border-chatPrimary/30 rounded-xl text-[10px] font-bold text-chatPrimary leading-relaxed">
                          {uploadSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!pdfFile || uploadingPDF}
                        className="w-full py-2.5 bg-chatPrimary hover:bg-chatPrimary/95 active:scale-95 disabled:active:scale-100 disabled:opacity-40 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {uploadingPDF ? (
                          <>
                            <Loader className="animate-spin" size={14} /> Chunking & Indexing...
                          </>
                        ) : (
                          <>
                            <Upload size={14} /> Upload & Train FAISS
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Manual Entry Form */}
                  <div className="bg-chatCard border border-chatBorder p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-chatText flex items-center gap-2">
                      <Plus size={16} className="text-chatPrimary" /> Add Manual FAQ Entry
                    </h3>
                    
                    <form onSubmit={handleAddKB} className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-chatTextMuted">Category Group</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full py-2 px-3 bg-chatBg border border-chatBorder rounded-lg text-chatText focus:outline-none focus:border-chatPrimary"
                        >
                          <option>Admission</option>
                          <option>Fees</option>
                          <option>Hostel</option>
                          <option>Bus Pass</option>
                          <option>Bus Routes</option>
                          <option>Lost Ticket</option>
                          <option>Refund</option>
                          <option>Contact Support</option>
                          <option>Complaint</option>
                          <option>General FAQ</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-chatTextMuted">FAQ Question (FAISS Matching Key)</label>
                        <input
                          type="text"
                          required
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="e.g. How much is the hostel security deposit?"
                          className="w-full py-2 px-3 bg-chatBg border border-chatBorder rounded-lg text-chatText focus:outline-none focus:border-chatPrimary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-chatTextMuted">FAQ Answer Response</label>
                        <textarea
                          required
                          rows={4}
                          value={newAnswer}
                          onChange={(e) => setNewAnswer(e.target.value)}
                          placeholder="e.g. Hostel security deposit is $200, payable during hostel allotment..."
                          className="w-full py-2 px-3 bg-chatBg border border-chatBorder rounded-lg text-chatText focus:outline-none focus:border-chatPrimary resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={addingKB}
                        className="w-full py-2.5 bg-chatPrimary hover:bg-chatPrimary/95 active:scale-95 disabled:active:scale-100 disabled:opacity-45 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        {addingKB ? <Loader className="animate-spin" size={14} /> : <Plus size={14} />}
                        Save FAQ Record
                      </button>
                    </form>
                  </div>

                </div>

                {/* Right Panel: KB Entries Listing Table */}
                <div className="lg:col-span-2 bg-chatCard border border-chatBorder p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-chatText flex items-center justify-between">
                    <span>Indexed Knowledge Base ({kbEntries.length} Items)</span>
                    <button 
                      onClick={loadData}
                      className="text-xs text-chatPrimary hover:underline"
                    >
                      Refresh List
                    </button>
                  </h3>
                  
                  <div className="overflow-y-auto max-h-[600px] border border-chatBorder rounded-xl scrollbar-thin">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-chatCard border-b border-chatBorder text-chatTextMuted font-bold uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-3 px-4 w-28">Category</th>
                          <th className="py-3 px-4 w-60">Question</th>
                          <th className="py-3 px-4">Answer Snippet</th>
                          <th className="py-3 px-4 w-12 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kbEntries.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-10 text-chatTextMuted italic">No FAQ entries indexed. Seed the database or upload a PDF.</td>
                          </tr>
                        ) : (
                          kbEntries.map((entry) => (
                            <tr key={entry.id} className="border-b border-chatBorder/40 hover:bg-chatBg/30">
                              <td className="py-3 px-4 font-bold text-chatPrimary">
                                <span className="px-2 py-0.5 bg-chatBg border border-chatBorder rounded-md text-[10px]">
                                  {entry.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-chatText truncate max-w-xs">{entry.question}</td>
                              <td className="py-3 px-4 text-chatTextMuted truncate max-w-sm">{entry.answer}</td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleDeleteKB(entry.id)}
                                  className="p-1.5 text-chatTextMuted hover:text-red-400 hover:bg-chatBg/50 rounded-lg cursor-pointer transition-colors"
                                  title="Delete Q&A entry"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TABS 3: FEEDBACK LOG FEED */}
            {activeTab === 'feedback' && (
              <div className="bg-chatCard border border-chatBorder p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-chatText flex items-center justify-between">
                  <span>Student Feedback Logs ({feedbacks.length} Reviews)</span>
                  <button 
                    onClick={loadData}
                    className="text-xs text-chatPrimary hover:underline"
                  >
                    Refresh reviews
                  </button>
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-chatBorder text-chatTextMuted font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 w-28">Star Rating</th>
                        <th className="py-3 px-4">Written Comment</th>
                        <th className="py-3 px-4 w-24 text-center font-bold">Chat ID</th>
                        <th className="py-3 px-4 w-44">Submitted Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-chatTextMuted italic">No student ratings or reviews logged yet.</td>
                        </tr>
                      ) : (
                        feedbacks.map((f) => (
                          <tr key={f.id} className="border-b border-chatBorder/40 hover:bg-chatBg/30">
                            <td className="py-3 px-4 font-bold text-chatText">
                              <div className="flex gap-0.5 text-amber-500">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={12}
                                    fill={f.rating >= s ? 'currentColor' : 'none'}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-chatTextMuted font-medium italic">
                              {f.comment ? `"${f.comment}"` : <span className="opacity-40 font-normal">No text comment provided</span>}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-chatText">{f.chat_id}</td>
                            <td className="py-3 px-4 text-chatTextMuted">
                              {new Date(f.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
