import { useState, useCallback, useRef, useEffect } from 'react';

export interface ScannerState {
  scanning: boolean;
  lastScannedValue: string | null;
  error: string | null;
  hasCamera: boolean;
}

export interface UseAwbScannerOptions {
  onScan: (value: string) => void;
  debounceMs?: number;
}

/**
 * useAwbScannerKeyboard — listens for rapid barcode scanner keystrokes
 * Barcode scanners type each character in <50ms and end with Enter.
 * Normal humans type > 100ms between keys.
 * This hook discriminates between human and scanner input.
 */
export function useAwbScannerKeyboard({ onScan, debounceMs = 80 }: UseAwbScannerOptions): ScannerState & {
  inputRef: React.RefObject<HTMLInputElement | null>;
  toggleScanning: () => void;
  clearError: () => void;
} {
  const [scanning, setScanning] = useState(false);
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  // Detect camera availability
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setHasCamera(devices.some((d) => d.kind === 'videoinput'));
      }).catch(() => setHasCamera(false));
    }
  }, []);

  const handleGlobalKeydown = useCallback((e: KeyboardEvent) => {
    if (!scanning) return;

    const now = Date.now();
    const delta = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    if (e.key === 'Enter') {
      const scanned = bufferRef.current.trim().toUpperCase();
      bufferRef.current = '';
      if (scanned.length >= 6) {
        setLastScannedValue(scanned);
        onScan(scanned);
      }
      return;
    }

    // If gap between keys > debounceMs, this is a human typing — discard buffer
    if (delta > debounceMs && bufferRef.current.length > 0) {
      bufferRef.current = '';
    }

    if (e.key.length === 1) {
      bufferRef.current += e.key;
    }
  }, [scanning, onScan, debounceMs]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [handleGlobalKeydown]);

  const toggleScanning = useCallback(() => {
    setScanning((prev) => !prev);
    setError(null);
    bufferRef.current = '';
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { scanning, lastScannedValue, error, hasCamera, inputRef, toggleScanning, clearError };
}
