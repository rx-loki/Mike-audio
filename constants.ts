import { Language } from './types';

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
];

export const VOICES = [
  { id: 'Kore', name: 'Kore (Calm Female)' },
  { id: 'Puck', name: 'Puck (Soft Male)' },
  { id: 'Charon', name: 'Charon (Deep Male)' },
  { id: 'Fenrir', name: 'Fenrir (Rough Male)' },
  { id: 'Zephyr', name: 'Zephyr (Bright Female)' },
];

export const TEXT_MODEL = 'gemini-2.5-flash';
export const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';