import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Chrome, Briefcase, Shield, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { ThemeToggleButton } from '../components/ui/ThemeToggle';

const SSOButton = ({ provider, onClick, loading }) => {
  const icons = {
    google: <Chrome className="w-5 h-5 text-red-500 flex-shrink-0" />,
    microsoft: <Briefcase className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    keycloak: <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />,
    oidc: <Shield className="w-5 h-5 text-purple-600 flex-shrink-0" />,
  };
  
  return (
    <button
      onClick={() => onClick(provider.id)}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors disabled:opacity-50 min-w-0"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500 flex-shrink-0" /> : icons[provider.id] || icons.oidc}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{provider.name}</span>
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
  
  // Check for SSO error in URL
  useEffect(() => {
    const ssoError = searchParams.get('sso_error') || searchParams.get('error');
    if (ssoError) {
      setError(`SSO Error: ${ssoError.replace(/_/g, ' ')}`);
    }
  }, [searchParams]);

  // Fetch available SSO providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await api.get('/auth/sso/providers');
        if (response.data.ssoEnabled && response.data.providers.length > 0) {
          setSsoProviders(response.data.providers);
        }
      } catch (err) {
        // SSO not available - silently ignore
        console.log('SSO providers not available');
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
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSSOLogin = (providerId) => {
    setSsoLoading(providerId);
    // Redirect to SSO login endpoint
    window.location.href = `/api/auth/sso/login/${providerId}?redirect=/dashboard`;
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex items-center justify-center p-4 safe-top safe-bottom relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggleButton className="text-slate-400 hover:text-white hover:bg-slate-800" />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
          <div className="h-10 w-10 sm:h-12 sm:w-12">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <path 
                d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" 
                fill="#FFFFFF" 
              />
              <path 
                d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" 
                fill="#F97316" 
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">EXOIN</h1>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-orange-500"></div>
              <span className="text-[8px] font-bold tracking-[0.3em] text-slate-400 uppercase">AFRICA</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Sign in to your workspace</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* SSO Options */}
          {ssoProviders.length > 0 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
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

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Forgot your password? Contact your administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
