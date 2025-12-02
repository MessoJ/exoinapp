import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';

/**
 * TwoFactorSettings - Manage 2FA settings
 */
export default function TwoFactorSettings() {
  const [status, setStatus] = useState({ enabled: false, loading: true });
  const [setupData, setSetupData] = useState(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/auth/2fa/status');
      setStatus({ enabled: response.data.enabled, loading: false });
    } catch (err) {
      setStatus({ enabled: false, loading: false });
      console.error('Failed to fetch 2FA status:', err);
    }
  };

  const handleSetup = async () => {
    setError('');
    setIsProcessing(true);
    try {
      const response = await api.post('/auth/2fa/setup');
      setSetupData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to setup 2FA');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnable = async () => {
    if (!verifyToken || verifyToken.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setError('');
    setIsProcessing(true);
    try {
      const response = await api.post('/auth/2fa/enable', { token: verifyToken });
      setBackupCodes(response.data.backupCodes || []);
      setShowBackupCodes(true);
      setStatus({ enabled: true, loading: false });
      setSetupData(null);
      setVerifyToken('');
      setSuccess('Two-factor authentication enabled successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable = async () => {
    const token = prompt('Enter your 2FA code to disable:');
    if (!token) return;

    setError('');
    setIsProcessing(true);
    try {
      await api.post('/auth/2fa/disable', { token });
      setStatus({ enabled: false, loading: false });
      setSuccess('Two-factor authentication disabled');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const token = prompt('Enter your 2FA code to regenerate backup codes:');
    if (!token) return;

    setError('');
    setIsProcessing(true);
    try {
      const response = await api.post('/auth/2fa/regenerate-backup', { token });
      setBackupCodes(response.data.backupCodes || []);
      setShowBackupCodes(true);
      setSuccess('Backup codes regenerated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to regenerate backup codes');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setSuccess('Backup codes copied to clipboard');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (status.loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
          status.enabled 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
        }`}>
          {status.enabled ? (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">2FA is enabled</span>
            </>
          ) : (
            <>
              <XCircleIcon className="w-5 h-5" />
              <span className="font-medium">2FA is not enabled</span>
            </>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
            {success}
          </div>
        )}

        {/* Setup Flow */}
        {!status.enabled && !setupData && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Two-factor authentication adds an extra layer of security by requiring 
              a code from your authenticator app in addition to your password.
            </p>
            <button
              onClick={handleSetup}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <DevicePhoneMobileIcon className="w-5 h-5" />
              {isProcessing ? 'Setting up...' : 'Set Up 2FA'}
            </button>
          </div>
        )}

        {/* QR Code Setup */}
        {setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                <img 
                  src={setupData.qrCode} 
                  alt="2FA QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Can't scan? Enter this code manually:
              </p>
              <code className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                {setupData.secret}
              </code>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter verification code from your app
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-xl tracking-widest font-mono"
                  maxLength={6}
                />
                <button
                  onClick={handleEnable}
                  disabled={isProcessing || verifyToken.length !== 6}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setSetupData(null)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              Cancel setup
            </button>
          </div>
        )}

        {/* Enabled State Actions */}
        {status.enabled && !showBackupCodes && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <KeyIcon className="w-5 h-5" />
                View Backup Codes
              </button>
              <button
                onClick={handleDisable}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
                Disable 2FA
              </button>
            </div>
          </div>
        )}

        {/* Backup Codes Display */}
        {showBackupCodes && backupCodes.length > 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                Save Your Backup Codes
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-4">
                Store these codes in a safe place. Each code can only be used once 
                if you lose access to your authenticator app.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, idx) => (
                  <code
                    key={idx}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded text-sm font-mono text-gray-800 dark:text-gray-200 text-center"
                  >
                    {code}
                  </code>
                ))}
              </div>
              <button
                onClick={copyBackupCodes}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <ClipboardDocumentIcon className="w-5 h-5" />
                Copy All Codes
              </button>
            </div>
            <button
              onClick={() => setShowBackupCodes(false)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              Close backup codes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
