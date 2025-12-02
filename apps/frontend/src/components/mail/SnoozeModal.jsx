import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Clock, Sun, Calendar, CalendarDays, 
  Moon, Coffee, ChevronRight 
} from 'lucide-react';
import { mailApi } from '../../lib/api';

const SnoozeModal = ({ isOpen, onClose, onSnooze, emailSubject }) => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('08:00');

  useEffect(() => {
    if (isOpen) {
      fetchPresets();
    }
  }, [isOpen]);

  const fetchPresets = async () => {
    try {
      const res = await mailApi.getSnoozePresets();
      setPresets(res.data.presets);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
      // Use default presets if API fails
      setPresets([
        { id: 'LATER_TODAY', label: 'Later today', time: { display: 'Today, 6:00 PM' } },
        { id: 'TOMORROW', label: 'Tomorrow', time: { display: 'Tomorrow, 8:00 AM' } },
        { id: 'THIS_WEEKEND', label: 'This weekend', time: { display: 'Saturday, 9:00 AM' } },
        { id: 'NEXT_WEEK', label: 'Next week', time: { display: 'Monday, 8:00 AM' } },
      ]);
    }
  };

  const handlePresetClick = async (preset) => {
    setLoading(true);
    try {
      await onSnooze(preset.id);
      onClose();
    } catch (error) {
      console.error('Failed to snooze:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSnooze = async () => {
    if (!customDate || !customTime) return;
    
    const dateTime = new Date(`${customDate}T${customTime}`);
    if (dateTime <= new Date()) {
      alert('Please select a future date and time');
      return;
    }

    setLoading(true);
    try {
      await onSnooze(null, dateTime.toISOString());
      onClose();
    } catch (error) {
      console.error('Failed to snooze:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPresetIcon = (presetId) => {
    switch (presetId) {
      case 'LATER_TODAY':
        return <Sun size={20} className="text-orange-500" />;
      case 'TOMORROW':
        return <Coffee size={20} className="text-amber-600" />;
      case 'THIS_WEEKEND':
        return <Moon size={20} className="text-indigo-500" />;
      case 'NEXT_WEEK':
        return <CalendarDays size={20} className="text-blue-500" />;
      default:
        return <Clock size={20} className="text-slate-500" />;
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Clock size={20} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Snooze Email
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                    {emailSubject || 'Untitled'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {!showCustom ? (
                <>
                  {/* Preset Options */}
                  <div className="space-y-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset)}
                        disabled={loading}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          {getPresetIcon(preset.id)}
                          <span className="font-medium text-slate-900 dark:text-white">
                            {preset.label}
                          </span>
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {preset.time?.display}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Option */}
                  <button
                    onClick={() => setShowCustom(true)}
                    className="w-full flex items-center justify-between p-4 mt-2 border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-600 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-slate-400" />
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        Pick date & time
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-slate-400" />
                  </button>
                </>
              ) : (
                /* Custom Date/Time Picker */
                <div className="space-y-4">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    ← Back to presets
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={today}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    onClick={handleCustomSnooze}
                    disabled={!customDate || !customTime || loading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Snoozing...' : 'Snooze'}
                  </button>
                </div>
              )}
            </div>

            {/* Footer Note */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                The email will return to your inbox at the scheduled time
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnoozeModal;
