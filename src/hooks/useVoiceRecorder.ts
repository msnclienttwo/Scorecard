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

export function useVoiceRecorder(options: VoiceRecorderOptions = {}) {
  const { language, onFinal, onInterim, autoRestart = true } = options;

  const [isSupported] = useState<boolean>(() =>
    typeof window !== 'undefined' ? isSpeechRecognitionSupported() : false
  );
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const autoRestartRef = useRef(autoRestart);
  autoRestartRef.current = autoRestart;
  const isListeningRef = useRef(false);
  isListeningRef.current = isListening;

  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const onInterimRef = useRef(onInterim);
  onInterimRef.current = onInterim;

  const createInstance = useCallback(() => {
    const recognition = createSpeechRecognition(language);
    if (!recognition) return null;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      const interim = getLatestInterimTranscript(event);
      const final = getFinalTranscript(event);
      setInterimTranscript(interim);
      if (final) {
        setFinalTranscript((prev) =>
          (prev ? `${prev} ${final}` : final).trim()
        );
        onFinalRef.current?.(final);
      }
      onInterimRef.current?.(interim);
    };

    recognition.onerror = (event) => {
      if (
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed'
      ) {
        setError(
          'Microphone access is blocked. Allow microphone access and try again.'
        );
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Try speaking again.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (autoRestartRef.current && isListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through to stopped state
        }
      }
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [language]);

  const start = useCallback(() => {
    if (!isSupported) return;
    const recognition = recognitionRef.current ?? createInstance();
    if (!recognition) return;
    isListeningRef.current = true;
    try {
      recognition.start();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [createInstance, isSupported]);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, [stop]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

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
