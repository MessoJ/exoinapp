import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  ChevronDown,
  Send,
  Sun,
  Sunrise,
  Moon,
} from 'lucide-react';

/**
 * ScheduleSendModal - Modal for scheduling email send time
 */
const ScheduleSendModal = ({ 
  isOpen, 
  onClose, 
  onSchedule,
  defaultDate = null,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [showCustom, setShowCustom] = useState(false);

  // Calculate preset times
  const getPresets = () => {
    const now = new Date();
    const presets = [];

    // Tomorrow morning (8 AM)
    const tomorrowMorning = new Date(now);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(8, 0, 0, 0);
    presets.push({
      id: 'tomorrow_morning',
      label: 'Tomorrow morning',
      sublabel: formatDateTime(tomorrowMorning),
      icon: Sunrise,
      time: tomorrowMorning,
    });

    // Tomorrow afternoon (1 PM)
    const tomorrowAfternoon = new Date(now);
    tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
    tomorrowAfternoon.setHours(13, 0, 0, 0);
    presets.push({
      id: 'tomorrow_afternoon',
      label: 'Tomorrow afternoon',
      sublabel: formatDateTime(tomorrowAfternoon),
      icon: Sun,
      time: tomorrowAfternoon,
    });

    // Monday morning (8 AM) - if not already Monday
    const nextMonday = new Date(now);
    const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(8, 0, 0, 0);
    if (daysUntilMonday > 1) { // Only show if Monday is more than 1 day away
      presets.push({
        id: 'monday_morning',
        label: 'Monday morning',
        sublabel: formatDateTime(nextMonday),
        icon: Calendar,
        time: nextMonday,
      });
    }

    return presets;
  };

  const formatDateTime = (date) => {
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(null);
      setShowCustom(false);
      
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCustomDate(formatDateForInput(defaultDate || tomorrow));
      setCustomTime('09:00');
    }
  }, [isOpen, defaultDate]);

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    setShowCustom(false);
  };

  const handleSchedule = () => {
    let scheduledTime;
    
    if (showCustom) {
      // Custom date/time
      const [year, month, day] = customDate.split('-').map(Number);
      const [hours, minutes] = customTime.split(':').map(Number);
      scheduledTime = new Date(year, month - 1, day, hours, minutes);
    } else if (selectedPreset) {
      // Preset time
      const preset = getPresets().find(p => p.id === selectedPreset);
      scheduledTime = preset?.time;
    }
    
    if (scheduledTime && scheduledTime > new Date()) {
      onSchedule(scheduledTime);
      onClose();
    }
  };

  // Validate custom date/time is in future
  const isCustomValid = () => {
    if (!customDate || !customTime) return false;
    const [year, month, day] = customDate.split('-').map(Number);
    const [hours, minutes] = customTime.split(':').map(Number);
    const selected = new Date(year, month - 1, day, hours, minutes);
    return selected > new Date();
  };

  const canSchedule = showCustom ? isCustomValid() : selectedPreset !== null;

  if (!isOpen) return null;

  const presets = getPresets();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Schedule send
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Presets */}
            <div className="space-y-2 mb-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                    ${selectedPreset === preset.id && !showCustom
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedPreset === preset.id && !showCustom
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    <preset.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {preset.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {preset.sublabel}
                    </div>
                  </div>
                  {selectedPreset === preset.id && !showCustom && (
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Date/Time Toggle */}
            <button
              onClick={() => {
                setShowCustom(!showCustom);
                setSelectedPreset(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all mb-4
                ${showCustom
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  showCustom
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  Pick date & time
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                showCustom ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Custom Date/Time Picker */}
            <AnimatePresence>
              {showCustom && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        min={formatDateForInput(new Date())}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={!canSchedule}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                bg-orange-500 text-white rounded-lg hover:bg-orange-600 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Schedule send
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleSendModal;
