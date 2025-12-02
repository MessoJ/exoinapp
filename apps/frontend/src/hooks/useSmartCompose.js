import { useState, useCallback, useRef, useEffect } from 'react';
import { aiApi } from '../lib/api';

/**
 * useSmartCompose Hook
 * 
 * Provides AI-powered autocomplete suggestions for email composition.
 * Uses debouncing to avoid excessive API calls.
 */
export const useSmartCompose = (options = {}) => {
  const {
    enabled = true,
    debounceMs = 500,
    minChars = 15,
    tone = 'professional',
    isReply = false,
    emailContext = '',
    recipientInfo = '',
  } = options;

  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Check AI availability on mount
  useEffect(() => {
    if (enabled) {
      aiApi.getStatus()
        .then(res => setIsAvailable(res.data.available))
        .catch(() => setIsAvailable(false));
    }
  }, [enabled]);

  // Get suggestion
  const getSuggestion = useCallback(async (text) => {
    if (!enabled || !isAvailable || !text || text.length < minChars) {
      setSuggestion('');
      return;
    }

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce the request
    debounceTimerRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      setLoading(true);

      try {
        const response = await aiApi.smartCompose(text, {
          tone,
          isReply,
          emailContext,
          recipientInfo,
        });
        
        if (response.data.suggestion) {
          setSuggestion(response.data.suggestion);
        } else {
          setSuggestion('');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Smart compose error:', err);
        }
        setSuggestion('');
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [enabled, isAvailable, minChars, debounceMs, tone, isReply, emailContext, recipientInfo]);

  // Accept suggestion
  const acceptSuggestion = useCallback(() => {
    const accepted = suggestion;
    setSuggestion('');
    return accepted;
  }, [suggestion]);

  // Clear suggestion
  const clearSuggestion = useCallback(() => {
    setSuggestion('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    suggestion,
    loading,
    isAvailable,
    getSuggestion,
    acceptSuggestion,
    clearSuggestion,
  };
};

/**
 * useSmartReply Hook
 * 
 * Generates smart reply suggestions for an email.
 */
export const useSmartReply = () => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Check AI availability on mount
  useEffect(() => {
    aiApi.getStatus()
      .then(res => setIsAvailable(res.data.available))
      .catch(() => setIsAvailable(false));
  }, []);

  // Generate replies
  const generateReplies = useCallback(async (emailContent, options = {}) => {
    if (!isAvailable) {
      setError('AI service not available');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await aiApi.smartReply(emailContent, options);
      const suggestedReplies = response.data.replies || [];
      setReplies(suggestedReplies);
      return suggestedReplies;
    } catch (err) {
      console.error('Smart reply error:', err);
      setError('Failed to generate replies');
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  // Clear replies
  const clearReplies = useCallback(() => {
    setReplies([]);
  }, []);

  return {
    replies,
    loading,
    error,
    isAvailable,
    generateReplies,
    clearReplies,
  };
};

/**
 * useEmailSummarize Hook
 * 
 * Summarizes email content with key points and action items.
 */
export const useEmailSummarize = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Check AI availability on mount
  useEffect(() => {
    aiApi.getStatus()
      .then(res => setIsAvailable(res.data.available))
      .catch(() => setIsAvailable(false));
  }, []);

  // Summarize email
  const summarize = useCallback(async (emailContent, options = {}) => {
    if (!isAvailable) {
      setError('AI service not available');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await aiApi.summarize(emailContent, options);
      setSummary(response.data);
      return response.data;
    } catch (err) {
      console.error('Summarize error:', err);
      setError('Failed to summarize email');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  // Clear summary
  const clearSummary = useCallback(() => {
    setSummary(null);
  }, []);

  return {
    summary,
    loading,
    error,
    isAvailable,
    summarize,
    clearSummary,
  };
};

/**
 * useTextRewrite Hook
 * 
 * Rewrites text with different styles.
 */
export const useTextRewrite = () => {
  const [rewritten, setRewritten] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Rewrite text
  const rewrite = useCallback(async (text, style) => {
    setLoading(true);
    setError(null);

    try {
      const response = await aiApi.rewrite(text, style);
      setRewritten(response.data.rewritten);
      return response.data.rewritten;
    } catch (err) {
      console.error('Rewrite error:', err);
      setError('Failed to rewrite text');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear
  const clear = useCallback(() => {
    setRewritten('');
  }, []);

  return {
    rewritten,
    loading,
    error,
    rewrite,
    clear,
  };
};

export default useSmartCompose;
