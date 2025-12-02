import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * SSO Callback Page
 * 
 * This page handles the OAuth2/OIDC callback from the backend.
 * It receives the JWT token from the URL and logs the user in.
 */
const SSOCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect') || '/';
    const ssoError = searchParams.get('sso_error');

    if (ssoError) {
      setError(ssoError);
      setTimeout(() => {
        navigate('/login?error=' + encodeURIComponent(ssoError));
      }, 3000);
      return;
    }

    if (!token) {
      setError('No authentication token received');
      setTimeout(() => {
        navigate('/login?error=no_token');
      }, 3000);
      return;
    }

    // The login function from AuthContext will handle storing the token
    // and fetching the user profile
    try {
      // Store the token
      localStorage.setItem('token', token);
      
      // Fetch user profile and complete login
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
        .then(user => {
          // Store user in context
          localStorage.setItem('user', JSON.stringify(user));
          // Navigate to the intended destination
          window.location.href = redirect;
        })
        .catch(err => {
          console.error('SSO callback error:', err);
          setError('Failed to complete authentication');
          localStorage.removeItem('token');
          setTimeout(() => {
            navigate('/login?error=profile_fetch_failed');
          }, 3000);
        });
    } catch (err) {
      console.error('SSO callback error:', err);
      setError('Failed to process authentication');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Authentication Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {error.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Completing Sign In...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we authenticate your account
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SSOCallbackPage;
