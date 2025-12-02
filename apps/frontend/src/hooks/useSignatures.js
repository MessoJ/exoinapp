import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'exoin_signatures';

/**
 * Custom hook for managing signatures across the application.
 * Provides CRUD operations for signatures stored in localStorage.
 * Can be used by any document editor (Letterhead, Invoice, Quotation, etc.)
 */
export function useSignatures() {
  const [signatures, setSignatures] = useState([]);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load signatures from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSignatures(parsed);
        // Auto-select the default signature if exists
        const defaultSig = parsed.find(s => s.isDefault);
        if (defaultSig) {
          setSelectedSignature(defaultSig);
        }
      }
    } catch (error) {
      console.error('Failed to load signatures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save signatures to localStorage whenever they change
  const saveToStorage = useCallback((sigs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sigs));
    } catch (error) {
      console.error('Failed to save signatures:', error);
    }
  }, []);

  // Add a new signature
  const addSignature = useCallback((dataUrl, name) => {
    const newSignature = {
      id: Date.now().toString(),
      name: name || `Signature ${signatures.length + 1}`,
      dataUrl,
      createdAt: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      isDefault: signatures.length === 0
    };

    const updated = [...signatures, newSignature];
    setSignatures(updated);
    saveToStorage(updated);
    
    // If it's the first signature, auto-select it
    if (signatures.length === 0) {
      setSelectedSignature(newSignature);
    }
    
    return newSignature;
  }, [signatures, saveToStorage]);

  // Delete a signature
  const deleteSignature = useCallback((id) => {
    const updated = signatures.filter(s => s.id !== id);
    setSignatures(updated);
    saveToStorage(updated);
    
    // If deleted signature was selected, clear selection
    if (selectedSignature?.id === id) {
      const newDefault = updated.find(s => s.isDefault) || updated[0] || null;
      setSelectedSignature(newDefault);
    }
  }, [signatures, selectedSignature, saveToStorage]);

  // Set a signature as default
  const setDefaultSignature = useCallback((id) => {
    const updated = signatures.map(s => ({
      ...s,
      isDefault: s.id === id
    }));
    setSignatures(updated);
    saveToStorage(updated);
  }, [signatures, saveToStorage]);

  // Select a signature for use
  const selectSignature = useCallback((signature) => {
    setSelectedSignature(signature);
  }, []);

  // Get the default signature
  const getDefaultSignature = useCallback(() => {
    return signatures.find(s => s.isDefault) || signatures[0] || null;
  }, [signatures]);

  // Get signature data URL by ID
  const getSignatureById = useCallback((id) => {
    return signatures.find(s => s.id === id) || null;
  }, [signatures]);

  return {
    signatures,
    selectedSignature,
    loading,
    addSignature,
    deleteSignature,
    setDefaultSignature,
    selectSignature,
    getDefaultSignature,
    getSignatureById,
    hasSignatures: signatures.length > 0
  };
}

export default useSignatures;
