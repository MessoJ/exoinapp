import React from 'react';
import { 
  ShieldCheckIcon, 
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * SecurityBadge - Displays email security/threat indicators
 * 
 * @param {Object} props
 * @param {string} props.threatLevel - 'safe' | 'suspicious' | 'dangerous' | 'phishing'
 * @param {string[]} props.indicators - Array of threat indicators
 * @param {boolean} props.compact - Show compact version
 * @param {function} props.onDetailsClick - Handler for viewing details
 */
export default function SecurityBadge({ 
  threatLevel = 'safe', 
  indicators = [], 
  compact = false,
  onDetailsClick 
}) {
  const getConfig = () => {
    switch (threatLevel) {
      case 'phishing':
        return {
          icon: ShieldExclamationIcon,
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-400',
          borderColor: 'border-red-300 dark:border-red-700',
          label: 'Phishing Risk',
          description: 'This email shows signs of phishing attempts',
        };
      case 'dangerous':
        return {
          icon: ShieldExclamationIcon,
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          textColor: 'text-orange-700 dark:text-orange-400',
          borderColor: 'border-orange-300 dark:border-orange-700',
          label: 'Dangerous',
          description: 'This email may contain harmful content',
        };
      case 'suspicious':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
          label: 'Suspicious',
          description: 'This email has some suspicious characteristics',
        };
      case 'safe':
      default:
        return {
          icon: ShieldCheckIcon,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-300 dark:border-green-700',
          label: 'Safe',
          description: 'No threats detected in this email',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <button
        onClick={onDetailsClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor} hover:opacity-80 transition-opacity`}
        title={config.description}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </button>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`w-5 h-5 ${config.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${config.textColor}`}>
              {config.label}
            </h4>
            {onDetailsClick && (
              <button
                onClick={onDetailsClick}
                className={`text-xs ${config.textColor} hover:underline flex items-center gap-1`}
              >
                <InformationCircleIcon className="w-4 h-4" />
                Details
              </button>
            )}
          </div>
          <p className={`text-sm ${config.textColor} opacity-80 mt-0.5`}>
            {config.description}
          </p>
          
          {indicators.length > 0 && (
            <div className="mt-2 space-y-1">
              {indicators.map((indicator, idx) => (
                <div
                  key={idx}
                  className={`text-xs ${config.textColor} opacity-70 flex items-center gap-1`}
                >
                  <span className="w-1 h-1 rounded-full bg-current" />
                  {indicator}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * SecurityAnalysisModal - Full security analysis details
 */
export function SecurityAnalysisModal({ analysis, isOpen, onClose }) {
  if (!isOpen) return null;

  const getThreatLevelColor = (level) => {
    switch (level) {
      case 'phishing': return 'text-red-600 dark:text-red-400';
      case 'dangerous': return 'text-orange-600 dark:text-orange-400';
      case 'suspicious': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-green-600 dark:text-green-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Security Analysis
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Threat Level */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Threat Level
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold capitalize ${getThreatLevelColor(analysis?.threatLevel)}`}>
                  {analysis?.threatLevel || 'Safe'}
                </span>
                <SecurityBadge threatLevel={analysis?.threatLevel} compact />
              </div>
            </div>

            {/* Confidence Score */}
            {analysis?.confidenceScore && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Confidence Score
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${analysis.confidenceScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {Math.round(analysis.confidenceScore * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Threats Detected */}
            {analysis?.threats && analysis.threats.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Threats Detected
                </h3>
                <ul className="space-y-2">
                  {analysis.threats.map((threat, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>{threat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suspicious Links */}
            {analysis?.suspiciousLinks && analysis.suspiciousLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Suspicious Links
                </h3>
                <ul className="space-y-1 text-sm">
                  {analysis.suspiciousLinks.map((link, idx) => (
                    <li
                      key={idx}
                      className="text-red-600 dark:text-red-400 truncate"
                    >
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            {analysis?.recommendation && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Recommendation
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  {analysis.recommendation}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
