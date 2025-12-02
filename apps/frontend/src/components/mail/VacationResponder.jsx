import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Palmtree, 
  Calendar, 
  Clock, 
  Save, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';
import { mailApi } from '../../lib/api';

/**
 * VacationResponder - Settings panel for vacation auto-reply
 */
const VacationResponder = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responder, setResponder] = useState(null);
  const [isActive, setIsActive] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subject, setSubject] = useState('Out of Office');
  const [message, setMessage] = useState('');
  const [onlyContacts, setOnlyContacts] = useState(false);
  const [onlyOnce, setOnlyOnce] = useState(true);
  const [excludedDomains, setExcludedDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');

  // Format date for input
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await mailApi.getVacationResponder();
        if (res.data.responder) {
          const r = res.data.responder;
          setResponder(r);
          setIsActive(res.data.isActive);
          setStartDate(formatDateForInput(r.startDate));
          setEndDate(formatDateForInput(r.endDate));
          setSubject(r.subject);
          setMessage(r.message);
          setOnlyContacts(r.onlyContacts);
          setOnlyOnce(r.onlyOnce);
          setExcludedDomains(r.excludedDomains || []);
        }
      } catch (err) {
        console.error('Failed to fetch vacation settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    if (!startDate || !endDate || !message) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const res = await mailApi.updateVacationResponder({
        startDate,
        endDate,
        subject,
        message,
        isActive: true,
        onlyContacts,
        onlyOnce,
        excludedDomains,
      });
      setResponder(res.data.responder);
      setIsActive(true);
      alert('Vacation responder saved!');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save vacation responder');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active
  const handleToggle = async () => {
    try {
      await mailApi.toggleVacationResponder(!isActive);
      setIsActive(!isActive);
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  // Delete responder
  const handleDelete = async () => {
    if (!confirm('Delete vacation responder?')) return;
    
    try {
      await mailApi.deleteVacationResponder();
      setResponder(null);
      setIsActive(false);
      setStartDate('');
      setEndDate('');
      setSubject('Out of Office');
      setMessage('');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Add excluded domain
  const addDomain = () => {
    if (newDomain && !excludedDomains.includes(newDomain)) {
      setExcludedDomains([...excludedDomains, newDomain]);
      setNewDomain('');
    }
  };

  // Remove excluded domain
  const removeDomain = (domain) => {
    setExcludedDomains(excludedDomains.filter(d => d !== domain));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Palmtree className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vacation Responder
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {responder && (
              <button
                onClick={handleToggle}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-colors ${
                    isActive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
              >
                {isActive ? (
                  <><ToggleRight className="w-4 h-4" /> Active</>
                ) : (
                  <><ToggleLeft className="w-4 h-4" /> Inactive</>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          {responder && isActive && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 
              border border-green-200 dark:border-green-800">
              <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Vacation responder is active
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Auto-replies will be sent until {new Date(endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Out of Office"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Auto-Reply Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I'm currently away from the office and will respond to your email when I return..."
              rows={6}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOnce}
                onChange={(e) => setOnlyOnce(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Only respond once per sender
                </span>
                <p className="text-xs text-gray-500">
                  Avoid sending multiple auto-replies to the same person
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyContacts}
                onChange={(e) => setOnlyContacts(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Only respond to known contacts
                </span>
                <p className="text-xs text-gray-500">
                  Only auto-reply to people you've emailed before
                </p>
              </div>
            </label>
          </div>

          {/* Excluded Domains */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exclude Domains
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Don't send auto-replies to emails from these domains
            </p>
            
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                placeholder="e.g., newsletter.com"
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={addDomain}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 
                  text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {excludedDomains.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {excludedDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg
                      bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {domain}
                    <button
                      onClick={() => removeDomain(domain)}
                      className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div>
            {responder && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                  text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!startDate || !endDate || !message || saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                bg-orange-500 text-white rounded-lg hover:bg-orange-600
                transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save & Enable'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VacationResponder;
