
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { LANGUAGES } from '../constants';
import { translateText } from '../services/geminiService';
import { ArrowRight, Copy, Check, Mic, MicOff, Languages, AlertTriangle, ArrowDown, Info } from 'lucide-react';

export const TextTranslator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto'); // Default 'auto'
  const [targetLang, setTargetLang] = useState('en');   // Default 'en' (English)
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           setInputText(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'no-speech') return;

        setIsListening(false);
        
        if (event.error === 'not-allowed') {
             setPermissionError("Microphone access blocked. Please click the lock icon in your browser address bar to 'Allow' microphone access.");
        } else if (event.error === 'service-not-allowed') {
             setPermissionError("Speech recognition service is not available.");
        } else {
             setPermissionError(`Recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = async () => {
    setPermissionError(null);

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        setPermissionError("Speech recognition is not supported in this browser.");
        return;
      }

      try {
        // CRITICAL FIX: Explicitly request getUserMedia permission first.
        // This forces the browser to show the permission prompt if it hasn't been granted yet,
        // preventing the "not-allowed" error from SpeechRecognition.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // We only needed the permission, so stop the stream immediately to release the mic
        stream.getTracks().forEach(track => track.stop());

        // Configure Language
        // Web Speech API does not support 'auto'. We must default to a specific language.
        // Based on user preference for Chinese-English app, default to Chinese if Auto is selected.
        let langCode = sourceLang;
        if (sourceLang === 'auto') langCode = 'zh-CN';
        else if (sourceLang === 'zh') langCode = 'zh-CN'; 
        
        recognitionRef.current.lang = langCode;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error("Microphone permission failed:", err);
        setIsListening(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
           setPermissionError("Microphone permission denied. Please allow access in your browser settings.");
        } else {
           setPermissionError("Could not access microphone. " + (err.message || ""));
        }
      }
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setPermissionError(null);
    try {
      const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || 'English';
      const sourceLangName = sourceLang === 'auto' ? 'auto' : LANGUAGES.find(l => l.code === sourceLang)?.name || 'auto';
      
      const result = await translateText(inputText, targetLangName, sourceLangName);
      setOutputText(result);
    } catch (error) {
      console.error(error);
      setOutputText('Error translating text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Language Controls */}
      <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto flex-1">
           {/* Source Language */}
           <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-white/60 text-sm whitespace-nowrap min-w-[40px]">From:</span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full"
            >
              <option value="auto" className="bg-gray-900 font-semibold text-purple-300">✨ Auto Detect</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-gray-900">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="text-white/40 hidden md:block" size={20} />
          <ArrowDown className="text-white/40 md:hidden block" size={20} />
          
          {/* Target Language */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-white/60 text-sm whitespace-nowrap min-w-[40px]">To:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-gray-900">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim()}
          className="w-full md:w-auto px-8 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-purple-900/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Translate
        </button>
      </GlassCard>
      
      {permissionError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-300 animate-fade-in">
          <AlertTriangle size={20} className="shrink-0" />
          <span className="text-sm font-medium">{permissionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <GlassCard className="p-6 h-[250px] md:h-full md:min-h-[300px] flex flex-col relative group">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-white/60">Input Text</label>
            {isListening && (
              <span className="flex items-center gap-2 text-red-400 text-xs animate-pulse">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Listening ({sourceLang === 'auto' ? 'Chinese' : LANGUAGES.find(l => l.code === sourceLang)?.name})...
              </span>
            )}
          </div>
          <textarea
            className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-lg placeholder-white/20 text-white leading-relaxed"
            placeholder="Type or speak to translate..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="mt-4 flex items-center justify-between relative z-20">
             <div className="flex items-center gap-2">
                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-full transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-2 ring-red-500/50' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                  title={sourceLang === 'auto' ? "Mic defaults to Chinese when Auto is selected" : `Speak in ${LANGUAGES.find(l => l.code === sourceLang)?.name}`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                {sourceLang === 'auto' && (
                  <div className="hidden md:flex items-center gap-1 text-xs text-white/30 bg-white/5 px-2 py-1 rounded-full">
                    <Info size={12} />
                    <span>Mic defaults to Chinese</span>
                  </div>
                )}
            </div>
            <span className="text-xs text-white/40">{inputText.length} chars</span>
          </div>
        </GlassCard>

        {/* Output Section */}
        <GlassCard className="p-6 h-[250px] md:h-full md:min-h-[300px] flex flex-col relative bg-white/5">
          <label className="text-sm font-medium text-white/60 mb-2">Translation ({LANGUAGES.find(l => l.code === targetLang)?.name})</label>
          <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : outputText ? (
              <p className="text-lg text-white leading-relaxed">{outputText}</p>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <Languages size={32} className="mb-2 opacity-50" />
                <p>Translation will appear here</p>
              </div>
            )}
          </div>
          {outputText && (
            <button
              onClick={copyToClipboard}
              className="absolute bottom-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
            </button>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
