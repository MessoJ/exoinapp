import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  CursorArrowRaysIcon,
  EnvelopeOpenIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';

/**
 * TrackingDashboard - View email tracking statistics
 */
export default function TrackingDashboard({ isOpen, onClose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTrackingHistory();
    }
  }, [isOpen, page]);

  const fetchTrackingHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/track/history', {
        params: { page, limit: 10 }
      });
      setEmails(response.data.emails || []);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch tracking history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailDetails = async (trackingId) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/track/stats/${trackingId}`);
      setSelectedEmail(response.data);
    } catch (err) {
      console.error('Failed to fetch tracking details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Email Tracking
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monitor opens and clicks for your sent emails
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

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Email List */}
          <div className={`${selectedEmail ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'} overflow-y-auto`}>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <EnvelopeOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tracked emails yet</p>
                <p className="text-sm mt-1">Enable tracking when sending emails to see stats here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {emails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => fetchEmailDetails(email.trackingId)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedEmail?.trackingId === email.trackingId 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {email.subject}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {email.recipientEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <EyeIcon className="w-4 h-4" />
                          {email.openCount}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <CursorArrowRaysIcon className="w-4 h-4" />
                          {email.clickCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <ClockIcon className="w-3.5 h-3.5" />
                      Sent {formatDate(email.createdAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Email Details */}
          {selectedEmail && (
            <div className="w-1/2 overflow-y-auto p-4">
              {detailLoading ? (
                <div className="flex items-center justify-center h-full">
                  <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {selectedEmail.subject}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      To: {selectedEmail.recipientEmail}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                        <EyeIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">Opens</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {selectedEmail.openCount}
                      </p>
                      {selectedEmail.firstOpenedAt && (
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                          First: {formatDate(selectedEmail.firstOpenedAt)}
                        </p>
                      )}
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                        <CursorArrowRaysIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">Clicks</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {selectedEmail.clickCount}
                      </p>
                    </div>
                  </div>

                  {/* Recent Opens */}
                  {selectedEmail.recentOpens && selectedEmail.recentOpens.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recent Opens
                      </h4>
                      <div className="space-y-2">
                        {selectedEmail.recentOpens.map((open, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">
                                {open.device}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {open.browser}
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs">
                              {formatDate(open.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links Clicked */}
                  {selectedEmail.links && selectedEmail.links.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Links Clicked
                      </h4>
                      <div className="space-y-2">
                        {selectedEmail.links.map((link, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {link.clicks} click{link.clicks !== 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-gray-400">
                                Last: {formatDate(link.lastClick)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {link.url}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
