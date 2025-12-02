import React, { useState, useCallback } from 'react';
import {
  UsersIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';

/**
 * MailMerge - Create and manage mail merge campaigns
 */
export default function MailMerge({ isOpen, onClose, accounts = [], templates = [] }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [fields, setFields] = useState([]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [senderEmail, setSenderEmail] = useState(accounts[0]?.email || '');
  const [senderName, setSenderName] = useState('');
  const [enableTracking, setEnableTracking] = useState(true);
  const [scheduledFor, setScheduledFor] = useState('');
  
  // Preview
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  
  // Validation
  const [validationErrors, setValidationErrors] = useState([]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target.result;
      setLoading(true);
      setError('');

      try {
        const response = await api.post('/mail-merge/parse-csv', { csvContent });
        setRecipients(response.data.recipients || []);
        setFields(response.data.fields || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to parse CSV file');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const insertField = (field) => {
    setContent(prev => prev + `{{${field}}}`);
  };

  const validateRecipients = async () => {
    const requiredFields = extractMergeFields(subject + content);
    
    try {
      const response = await api.post('/mail-merge/validate', {
        recipients,
        requiredFields
      });
      setValidationErrors(response.data.errors || []);
      return response.data.valid;
    } catch (err) {
      setError('Validation failed');
      return false;
    }
  };

  const extractMergeFields = (text) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const fields = new Set();
    let match;
    while ((match = regex.exec(text)) !== null) {
      fields.add(match[1].trim().toLowerCase());
    }
    return Array.from(fields);
  };

  const generatePreview = async () => {
    if (recipients.length === 0) return;

    try {
      const response = await api.post('/mail-merge/preview', {
        subject,
        content,
        recipient: recipients[previewIndex]
      });
      setPreviewData(response.data);
    } catch (err) {
      setError('Failed to generate preview');
    }
  };

  const handleSubmit = async (sendNow = false) => {
    setLoading(true);
    setError('');

    try {
      // Validate first
      const isValid = await validateRecipients();
      if (!isValid && validationErrors.length > 0) {
        setError('Please fix validation errors before proceeding');
        setLoading(false);
        return;
      }

      // Create mail merge
      const response = await api.post('/mail-merge', {
        name,
        subject,
        content,
        recipients,
        accountId,
        senderEmail,
        senderName,
        enableTracking,
        scheduledFor: scheduledFor || undefined
      });

      if (sendNow) {
        await api.post(`/mail-merge/${response.data.id}/start`);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create mail merge');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UsersIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mail Merge
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Send personalized emails to multiple recipients
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {s}
              </div>
              <span className={`ml-2 text-sm ${
                step >= s 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {s === 1 ? 'Recipients' : s === 2 ? 'Compose' : 'Review'}
              </span>
              {s < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step > s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Recipients */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Newsletter - December 2024"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Recipients (CSV)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    Drag & drop a CSV file or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-gray-400 mt-2">
                    CSV should have an "email" column plus any personalization fields
                  </p>
                </div>
              </div>

              {recipients.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-medium">{recipients.length} recipients loaded</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm text-green-600 dark:text-green-500">
                      Available fields:
                    </span>
                    {fields.map((f) => (
                      <span
                        key={f.field}
                        className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded text-sm"
                      >
                        {`{{${f.field}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Compose */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Account
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => {
                      setAccountId(e.target.value);
                      const account = accounts.find(a => a.id === e.target.value);
                      if (account) setSenderEmail(account.email);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sender Name (optional)
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Hello {{name}}, check out our latest update!"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Field Insertion */}
              {fields.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Insert field:</span>
                  {fields.map((f) => (
                    <button
                      key={f.field}
                      onClick={() => insertField(f.field)}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                      {`{{${f.field}}}`}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  placeholder="Dear {{name}},\n\nThank you for being a valued customer..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTracking}
                    onChange={(e) => setEnableTracking(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Enable open & click tracking
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Campaign</h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{name}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recipients</h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{recipients.length}</p>
                </div>
              </div>

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preview ({previewIndex + 1} of {recipients.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
                      disabled={previewIndex === 0}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setPreviewIndex(i => Math.min(recipients.length - 1, i + 1))}
                      disabled={previewIndex >= recipients.length - 1}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                    >
                      →
                    </button>
                    <button
                      onClick={generatePreview}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      <EyeIcon className="w-4 h-4 inline mr-1" />
                      Preview
                    </button>
                  </div>
                </div>
                {previewData ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        To: {recipients[previewIndex]?.email}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {previewData.subject}
                      </p>
                    </div>
                    <div className="p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {previewData.content}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center text-gray-400">
                    Click "Preview" to see how the email will look
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule Send (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-400 mb-2">
                    Validation Warnings
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-500 space-y-1">
                    {validationErrors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li>...and {validationErrors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <div className="flex gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && recipients.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                >
                  {scheduledFor ? 'Schedule' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                  Send Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
