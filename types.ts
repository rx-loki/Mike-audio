
export interface Language {
  code: string;
  name: string;
}

export type TranslationMode = 'text' | 'live';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface LiveSessionState {
  isConnected: boolean;
  isSpeaking: boolean;
  volume: number;
  error: string | null;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
