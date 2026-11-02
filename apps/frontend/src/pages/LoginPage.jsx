import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Chrome, Briefcase, Shield, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import api from '../lib/api';

const SSOButton = ({ provider, onClick, loading }) => {
  const icons = {
    google: <Chrome className="w-4 h-4 text-red-500" />,
    microsoft: <Briefcase className="w-4 h-4 text-blue-600" />,
    keycloak: <Shield className="w-4 h-4 text-green-600" />,
    oidc: <Shield className="w-4 h-4 text-purple-600" />,
  };
  
  return (
    <button
      onClick={() => onClick(provider.id)}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : icons[provider.id] || icons.oidc}
      <span className="text-xs font-semibold text-slate-700">{provider.name}</span>
    </button>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoProviders, setSsoProviders] = useState([]);
  const [ssoLoading, setSsoLoading] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const ssoError = searchParams.get('sso_error') || searchParams.get('error');
    if (ssoError) {
      setError(`SSO Error: ${ssoError.replace(/_/g, ' ')}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await api.get('/auth/sso/providers');
        if (response.data?.ssoEnabled && response.data?.providers?.length > 0) {
          setSsoProviders(response.data.providers);
        }
      } catch (err) {
        // Silently ignore
      }
    };
    fetchProviders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSSOLogin = (providerId) => {
    setSsoLoading(providerId);
    window.location.href = `/api/auth/sso/login/${providerId}?redirect=/dashboard`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Apple-style background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-orange-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-16 w-16 relative p-2 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-md">
              <path 
                d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" 
                fill="#3B82F6" 
              />
              <path 
                d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" 
                fill="#F97316" 
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">EXOIN AFRICA</h1>
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mt-0.5">Enterprise Workspace Portal</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/40">
          <div className="mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Access job cards, invoices, delivery notes and CRM</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl mb-4 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@exoinafrica.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-slate-900/20 active:scale-98 transition-all disabled:opacity-50 touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* SSO Options */}
          {ssoProviders.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Or Continue With
              </span>
              <div className="flex gap-2">
                {ssoProviders.map((provider) => (
                  <SSOButton
                    key={provider.id}
                    provider={provider}
                    onClick={handleSSOLogin}
                    loading={ssoLoading === provider.id}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-400">
              Need account assistance? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
