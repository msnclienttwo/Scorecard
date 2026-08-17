'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSpeechRecognition,
  getFinalTranscript,
  getLatestInterimTranscript,
  isSpeechRecognitionSupported,
  type SpeechRecognitionLike,
} from '@/lib/speech';

interface VoiceRecorderOptions {
  language?: string;
  onFinal?: (finalTranscript: string) => void;
  onInterim?: (interimTranscript: string) => void;
  autoRestart?: boolean;
}

// Errors after which restarting makes no sense — the user must fix something
// (permissions, hardware, network) before trying again.
const FATAL_ERRORS: ReadonlySet<string> = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'network',
  'language-not-supported',
  'service-not-available',
]);

const FRIENDLY_ERRORS: Record<string, string> = {
  'not-allowed':
    'Microphone access is blocked. Allow the microphone for this site and try again.',
  'service-not-allowed':
    'Speech recognition is disabled in your browser. Check browser/device settings and try again.',
  'no-speech': 'No speech detected. Try speaking again.',
  'audio-capture': 'No microphone was found. Connect a microphone and try again.',
  network:
    'Speech recognition lost its network connection. Check your connection and try again.',
  aborted: 'Listening was interrupted.',
  'language-not-supported': 'This language is not supported for voice input.',
  'service-not-available':
    'Speech recognition is temporarily unavailable. Try again in a moment.',
};

const RESTART_DELAY_MS = 300;

/**
 * Voice-to-text hook built on the Web Speech API.
 *
 * Each session uses a BRAND-NEW SpeechRecognition instance. Chrome's API is
 * known to silently stop producing results when the same instance is restarted
 * (the original implementation reused one instance via `continuous: true`, so
 * after the first end the transcript went dead). We also:
 *  - stop auto-restarting after permission/hardware/network errors,
 *  - guard against double starts (InvalidStateError) and stop() races,
 *  - tear down cleanly on unmount.
 */
export function useVoiceRecorder(options: VoiceRecorderOptions = {}) {
  const { onFinal, onInterim, autoRestart = true } = options;

  const [isSupported] = useState<boolean>(() =>
    typeof window !== 'undefined' ? isSpeechRecognitionSupported() : false
  );
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const supportedRef = useRef(isSupported);
  supportedRef.current = isSupported;

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languageRef = useRef(options.language);
  languageRef.current = options.language;
  const autoRestartRef = useRef(autoRestart);
  autoRestartRef.current = autoRestart;
  const isStoppingRef = useRef(true);

  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const onInterimRef = useRef(onInterim);
  onInterimRef.current = onInterim;

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const beginSession = useCallback(() => {
    if (!supportedRef.current) return;

    const recognition = createSpeechRecognition(languageRef.current);
    if (!recognition) return;

    recognitionRef.current = recognition;
    isStoppingRef.current = false;

    recognition.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const final = getFinalTranscript(event);
      if (final) {
        // Commit final text and drop the interim echo so the save/display text
        // never contains partial duplicates.
        setFinalTranscript((prev) =>
          (prev ? `${prev} ${final}` : final).trim()
        );
        setInterimTranscript('');
        onFinalRef.current?.(final);
      } else {
        const interim = getLatestInterimTranscript(event);
        setInterimTranscript(interim);
        onInterimRef.current?.(interim);
      }
    };

    recognition.onerror = (event) => {
      if (isStoppingRef.current) return; // abort() triggered by stop()/cleanup
      if (FATAL_ERRORS.has(event.error)) {
        isStoppingRef.current = true;
        clearRestartTimer();
        setError(
          FRIENDLY_ERRORS[event.error] ??
            `Speech recognition error: ${event.error}`
        );
        setIsListening(false);
      } else {
        // Transient (e.g. no-speech): surface a hint, keep listening via onend.
        setError(
          FRIENDLY_ERRORS[event.error] ??
            `Speech recognition error: ${event.error}`
        );
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return; // stale session
      recognitionRef.current = null;
      if (autoRestartRef.current && !isStoppingRef.current) {
        clearRestartTimer();
        restartTimerRef.current = setTimeout(() => {
          if (!isStoppingRef.current) beginSession();
        }, RESTART_DELAY_MS);
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch {
      // Double-start / InvalidStateError etc. — reset to a clean idle state.
      recognitionRef.current = null;
      isStoppingRef.current = true;
      setError(
        'Could not start the microphone. Check your browser permissions and try again.'
      );
      setIsListening(false);
    }
  }, [clearRestartTimer]);

  const start = useCallback(() => {
    if (!supportedRef.current) return;
    clearRestartTimer();
    setError(null);
    // Tear down any in-flight session so every start begins from a clean slate.
    const existing = recognitionRef.current;
    recognitionRef.current = null;
    if (existing) {
      try {
        existing.abort();
      } catch {
        // ignore
      }
    }
    beginSession();
  }, [beginSession, clearRestartTimer]);

  const stop = useCallback(() => {
    isStoppingRef.current = true;
    clearRestartTimer();
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, [clearRestartTimer]);

  const reset = useCallback(() => {
    stop();
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, [stop]);

  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      clearRestartTimer();
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [clearRestartTimer]);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    reset,
  };
}
