
import React, { useState } from 'react';
import { TextTranslator } from './components/TextTranslator';
import { LiveTranslator } from './components/LiveTranslator';
import { MessageSquareText, Radio } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<'text' | 'live'>('text');

  return (
    <div className="min-h-screen w-full bg-[#0f172a] relative overflow-x-hidden selection:bg-purple-500/30">
      {/* Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-0 md:h-20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center gap-3">
            {/* Logo Image */}
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-purple-500/20 ring-1 ring-white/10 bg-white/5">
              <img 
                src="logo.jpg" 
                alt="Mike-audio Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">Mike-audio</span>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-full md:w-auto justify-center md:justify-start">
            <button
              onClick={() => setMode('text')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                mode === 'text' 
                  ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <MessageSquareText size={16} />
              Text
            </button>
            <button
              onClick={() => setMode('live')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                mode === 'live' 
                  ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Radio size={16} />
              Live Audio
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-20">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50 mb-4 tracking-tight">
            {mode === 'text' ? 'Universal Text Translation' : 'Real-time Voice Interpretation'}
          </h1>
          <p className="text-base md:text-lg text-white/40 max-w-2xl mx-auto">
            {mode === 'text' 
              ? 'Instantly translate text across multiple languages with the power of Gemini 2.5.' 
              : 'Experience seamless conversational translation with ultra-low latency audio streaming.'}
          </p>
        </div>

        {mode === 'text' ? <TextTranslator /> : <LiveTranslator />}
      </main>
    </div>
  );
}

export default App;
