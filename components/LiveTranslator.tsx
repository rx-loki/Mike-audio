import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useLiveTranslation } from '../hooks/useLiveTranslation';
import { LANGUAGES, VOICES } from '../constants';
import { Mic, MicOff, Activity, AlertCircle, Waves, Globe } from 'lucide-react';

export const LiveTranslator: React.FC = () => {
  // Default to English as per user request ("mostly Chinese to English")
  const [targetLang, setTargetLang] = useState('en'); 
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  
  const { isConnected, isError, volume, transcripts, connect, disconnect } = useLiveTranslation({ 
    targetLanguage: LANGUAGES.find(l => l.code === targetLang)?.name || 'English',
    voiceName: selectedVoice
  });

  const toggleConnection = async () => {
    if (isConnected) {
      disconnect();
    } else {
      // Check for API Key before connecting
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
         const hasKey = await window.aistudio.hasSelectedApiKey();
         if (!hasKey) {
             if (window.aistudio.openSelectKey) {
                 await window.aistudio.openSelectKey();
                 return;
             }
         }
      }
      connect();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 animate-fade-in-up">
      
      {/* Visualizer Circle */}
      <div className="relative group my-4">
        <div className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-2xl transition-opacity duration-300 ${isConnected ? 'opacity-50' : 'opacity-0'}`}></div>
        <button
          onClick={toggleConnection}
          className={`relative z-10 w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4 ${
            isConnected 
              ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20' 
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
          }`}
          style={{
             transform: isConnected ? `scale(${1 + volume * 0.5})` : 'scale(1)'
          }}
        >
          {isConnected ? <MicOff size={32} className="text-red-400 md:w-10 md:h-10" /> : <Mic size={32} className="text-white md:w-10 md:h-10" />}
        </button>
        {isConnected && (
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 whitespace-nowrap">
                <div className="flex items-center gap-2 text-red-400 font-medium animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    LIVE
                </div>
                <span className="text-xs text-white/50">Auto-Detecting Language...</span>
            </div>
        )}
      </div>

      {isError && (
        <div className="flex items-center gap-2 text-red-300 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/20 text-center text-sm mx-4">
            <AlertCircle size={18} className="shrink-0" />
            <span>{isError}</span>
        </div>
      )}

      {/* Settings Card */}
      <GlassCard className="p-4 w-full flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Output Language */}
        <div className="flex items-center gap-3 w-full md:w-auto p-2 md:p-0 bg-white/5 md:bg-transparent rounded-lg md:rounded-none">
          <Globe className="text-blue-400 shrink-0" size={20} />
          <div className="flex flex-col flex-1">
            <span className="text-xs text-white/40 uppercase tracking-wider">Translate To</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer w-full"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-gray-900">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full h-px md:w-px md:h-10 bg-white/10 block"></div>

        {/* Voice Selection */}
        <div className="flex items-center gap-3 w-full md:w-auto p-2 md:p-0 bg-white/5 md:bg-transparent rounded-lg md:rounded-none">
          <Waves className="text-purple-400 shrink-0" size={20} />
           <div className="flex flex-col flex-1">
            <span className="text-xs text-white/40 uppercase tracking-wider">Voice Identity</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isConnected}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full"
              title={isConnected ? "Disconnect to change voice" : "Select output voice"}
            >
              {VOICES.map((voice) => (
                <option key={voice.id} value={voice.id} className="bg-gray-900">
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      </GlassCard>

      {/* Live Transcripts */}
      <GlassCard className="w-full h-80 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-white/50 text-sm uppercase tracking-wider border-b border-white/10 pb-2">
            <Activity size={14} />
            <span>Live Transcript</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
           {transcripts.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-white/10 text-center space-y-2">
                   <p>Start the session and speak naturally.</p>
                   <p className="text-xs max-w-[80%] mx-auto">I will auto-detect your language and respond in {LANGUAGES.find(l => l.code === targetLang)?.name} with {selectedVoice}'s voice.</p>
               </div>
           ) : (
               transcripts.map((t, idx) => (
                   <div key={idx} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] md:max-w-[80%] p-3 rounded-xl text-sm ${
                           t.role === 'user' 
                             ? 'bg-white/5 text-white/60 rounded-tr-none' 
                             : 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 text-white border border-white/10 rounded-tl-none shadow-lg'
                       }`}>
                           {t.text}
                       </div>
                   </div>
               ))
           )}
        </div>
      </GlassCard>
    </div>
  );
};