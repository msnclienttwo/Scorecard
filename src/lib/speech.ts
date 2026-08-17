export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string; confidence: number };
    };
  };
}

const SPEECH_LANGS: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  kn: "kn-IN",
  ta: "ta-IN",
  te: "te-IN",
  ml: "ml-IN",
};

export function speechRecognitionLanguage(language?: string): string {
  return SPEECH_LANGS[language ?? "en"] ?? "en-US";
}

export function getSpeechRecognitionConstructor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function createSpeechRecognition(
  language?: string,
  options: { interimResults?: boolean; continuous?: boolean } = {}
): SpeechRecognitionLike | null {
  const Ctor = getSpeechRecognitionConstructor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = speechRecognitionLanguage(language);
  // Chrome's `continuous` mode is unreliable: restarted sessions frequently
  // stop delivering results. `continuous: false` commits finals on each pause
  // and the caller restarts with a fresh instance for seamless listening.
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = options.interimResults ?? true;
  recognition.maxAlternatives = 1;
  return recognition;
}

export function getFinalTranscript(
  event: SpeechRecognitionResultEventLike
): string {
  let transcript = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (result.isFinal) {
      transcript += result[0]?.transcript ?? "";
    }
  }
  return transcript.trim();
}

export function getLatestInterimTranscript(
  event: SpeechRecognitionResultEventLike
): string {
  const last = event.results[event.results.length - 1];
  if (!last) return "";
  return (last[0]?.transcript ?? "").trim();
}
