
import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LIVE_MODEL } from '../constants';
import { base64ToUint8Array, decodeAudioData, createPcmBlob } from '../services/audioUtils';

interface UseLiveTranslationProps {
  targetLanguage: string;
  voiceName: string;
}

export const useLiveTranslation = ({ targetLanguage, voiceName }: UseLiveTranslationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [transcripts, setTranscripts] = useState<{role: 'user' | 'model', text: string}[]>([]);

  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const connect = useCallback(async () => {
    // Create new instance here to ensure fresh API key
    aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (!aiRef.current) return;
    setIsError(null);

    try {
      // 1. Setup Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // 2. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Connect to Gemini Live
      sessionPromiseRef.current = aiRef.current.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: `You are a universal speech translator.
          1. LISTENING: Continuously listen to the audio stream.
          2. AUTO-DETECT: Automatically detect the source language of the user (it could be anything).
          3. TRANSLATE: Instantly translate the speech into ${targetLanguage}.
          4. VOICE CLONING STYLE: Attempt to match the original speaker's tone, emotion, and cadence in the translated audio using the ${voiceName} voice profile.`,
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setIsConnected(true);
            
            // Start processing microphone audio
            if (!inputContextRef.current || !streamRef.current) return;

            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 5, 1)); // Amplify a bit for visualizer

              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch((e) => {
                  // Swallow error here because the main 'onerror' callback or outer try/catch handles the connection failure.
                  // This prevents "Uncaught (in promise)" errors if the session connection failed.
              });
            };

            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
            
            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             
             if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                try {
                  const audioBuffer = await decodeAudioData(
                    base64ToUint8Array(base64Audio),
                    ctx,
                    24000
                  );
                  
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  
                  source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                  });

                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                } catch (e) {
                  console.error("Error decoding audio", e);
                }
             }

             // Handle Transcriptions
             if (message.serverContent?.outputTranscription?.text) {
                const text = message.serverContent.outputTranscription.text;
                setTranscripts(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'model') {
                    // Simple append for streaming text (could be improved with IDs but sufficient for demo)
                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                  }
                  return [...prev, { role: 'model', text }];
                });
             }
             
             // Handle turn complete to finalize transcript blocks if needed
             if (message.serverContent?.turnComplete) {
                // Could finalize current transcript block here
             }
          },
          onclose: () => {
            console.log('Gemini Live Closed');
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error('Gemini Live Error', err);
            setIsError('Connection error occurred.');
            disconnect();
          }
        }
      });

    } catch (err) {
      console.error('Failed to connect:', err);
      setIsError('Failed to access microphone or connect to service.');
      setIsConnected(false);
    }
  }, [targetLanguage, voiceName]);

  const disconnect = useCallback(() => {
    // Stop Microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Disconnect Audio Nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Stop Audio Output
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
    // Close Audio Contexts
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close Session
    sessionPromiseRef.current?.then(session => {
        session.close();
    }).catch(e => {
        // Ignore errors on close
    });

    setIsConnected(false);
    setVolume(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isError,
    volume,
    transcripts,
    connect,
    disconnect
  };
};
