import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, Lock, Mail, ArrowRight, AlertCircle, Loader } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Failed to log in. Please check your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-chatBg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-chatPrimary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-chatPrimary/20 text-chatPrimary rounded-xl flex items-center justify-center mb-4">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-2xl font-bold text-chatText">Welcome Back</h1>
          <p className="text-chatTextMuted text-sm mt-1">Sign in to continue your conversations</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-200 text-sm"
          >
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-chatTextMuted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chatTextMuted" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-chatBg/80 border border-chatBorder focus:border-chatPrimary rounded-xl text-chatText placeholder-chatTextMuted/50 focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-chatTextMuted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chatTextMuted" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-chatBg/80 border border-chatBorder focus:border-chatPrimary rounded-xl text-chatText placeholder-chatTextMuted/50 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 bg-chatPrimary hover:bg-chatPrimary/95 active:scale-95 disabled:active:scale-100 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {submitting ? (
              <Loader className="animate-spin" size={18} />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-chatTextMuted">
          Don't have an account?{' '}
          <Link to="/register" className="text-chatPrimary hover:underline font-semibold">
            Create account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
