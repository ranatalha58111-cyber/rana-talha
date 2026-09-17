import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceState, UserSettings } from '../types';

interface UseSpeechProps {
  settings: UserSettings;
  onTranscriptComplete: (transcript: string) => void;
  onWakeWordDetected?: (remainder?: string) => void;
}

// Regex to capture "gravis", "garvis", "jarvis", etc. with optional prefixes and suffixes including "yeh kaam karo" / "yeh akm karo"
const WAKE_WORD_REGEX = /(?:^|\s)(?:hey\s+|hi\s+|ok\s+|hello\s+|suno\s+|oye\s+)?(gravis|garvis|jarvis|travis|javis|jarves)(?:\s+(?:yeh\s+kaam\s+karo|yeh\s+akm\s+karo|ye\s+kaam\s+karo|ye\s+kam\s+karo|kaam\s+karo|akm\s+karo))?(?:$|[,\s.!?]+(.*))/i;

// Cached neural TTS status to avoid repeated network timeouts on every response
let cachedNeuralTtsAvailable: boolean | null = false;

export function useSpeech({ settings, onTranscriptComplete, onWakeWordDetected }: UseSpeechProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [interimText, setInterimText] = useState<string>('');
  const [audioLevel] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const onTranscriptCompleteRef = useRef(onTranscriptComplete);
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);
  const settingsRef = useRef(settings);

  useEffect(() => {
    onTranscriptCompleteRef.current = onTranscriptComplete;
    onWakeWordDetectedRef.current = onWakeWordDetected;
    settingsRef.current = settings;
  });

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const shouldListenRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const restartTimerRef = useRef<any>(null);
  const speakingSafetyTimerRef = useRef<any>(null);

  // Load system speech synthesis voices once
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const updateVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        }
      } catch (e) {
        console.warn('Error reading voices:', e);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const cleanupMicStream = useCallback(() => {
    // Clean, lightweight state reset
  }, []);

  // Initialize Speech Recognition once on mount without re-binding loops
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Configure Speech Recognition dialect based on settings.language
      const langPreference = settings.language || 'AUTO';
      if (langPreference === 'اردو' || langPreference === 'ROMAN_URDU' || langPreference === 'AUTO') {
        recognition.lang = 'ur-PK';
      } else {
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        if (isSpeakingRef.current) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        const candidateText = (final || interim).trim();

        // Check for wake word trigger (e.g. "Jarvis", "Jarvis yeh kaam karo", "Jarvis yeh akm karo")
        let match = candidateText.match(WAKE_WORD_REGEX);
        let remainder = "";
        let isWakeMatch = false;

        if (match) {
          isWakeMatch = true;
          remainder = (match[2] || '').trim();
        } else if (/^(?:yeh\s+kaam\s+karo|yeh\s+akm\s+karo|ye\s+kaam\s+karo)\s*/i.test(candidateText)) {
          isWakeMatch = true;
          remainder = candidateText.replace(/^(?:yeh\s+kaam\s+karo|yeh\s+akm\s+karo|ye\s+kaam\s+karo)\s*/i, '').trim();
        }

        if (isWakeMatch) {
          remainder = remainder.replace(/^(?:yeh\s+kaam\s+karo|yeh\s+akm\s+karo|ye\s+kaam\s+karo|ye\s+kam\s+karo|kaam\s+karo|akm\s+karo)\s*/i, '').trim();
          if (onWakeWordDetectedRef.current) {
            onWakeWordDetectedRef.current(remainder);
            setInterimText('');
            return;
          }
        }

        setInterimText(interim || final);

        if (final.trim()) {
          const cleanedText = final.trim()
            .replace(/\b(open|chalao|kholo|play|search|band)\s+\1\b/gi, '$1')
            .replace(/\s+/g, ' ');
          if (cleanedText.length > 1) {
            setVoiceState('thinking');
            onTranscriptCompleteRef.current?.(cleanedText);
          }
          setInterimText('');
        }
      };

      recognition.onerror = () => {
        shouldListenRef.current = false;
        isListeningRef.current = false;
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = null;
        }
        setVoiceState((prev) => (prev === 'listening' ? 'ready' : prev));
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setVoiceState((prev) => (prev === 'listening' ? 'ready' : prev));

        if (shouldListenRef.current && !isSpeakingRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current && !isSpeakingRef.current && !isListeningRef.current) {
              try {
                recognition.start();
              } catch {
                shouldListenRef.current = false;
              }
            }
          }, 400);
        }
      };

      recognitionRef.current = recognition;
    } catch {
      setIsSupported(false);
    }

    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    shouldListenRef.current = true;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;

    setVoiceState('listening');
    isListeningRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch {}
          }, 150);
        } catch {}
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      isListeningRef.current = false;
    }
    cleanupMicStream();
    setVoiceState('ready');
  }, [cleanupMicStream]);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean text from markdown formatting before speech
  const cleanMarkdownForSpeech = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~#]/g, '')
      .replace(/>\s+/g, '')
      .replace(/[-*]\s+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  };

  const speakViaBrowser = useCallback(
    (cleaned: string, onEndCallback?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      // Temporarily pause speech recognition while speaking
      isSpeakingRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);

      // Detect if text is in Urdu script
      const hasUrduScript = /[\u0600-\u06FF]/.test(cleaned);
      // Detect if text is Roman Urdu / Hinglish
      const isRomanUrdu = /\b(jee|hukm|karta|karti|karein|karo|kholo|chalao|lagao|shukriya|hazir|aapka|aapki|aapke|mera|meri|mere|hain|hai|theek|bilkul|sahab|madad|kaam|batao|sunao|suno|kaisa|kaisi|kaise|mukammal|foran|khidmaat|maazrat)\b/i.test(cleaned);

      if (hasUrduScript) {
        utterance.lang = 'ur-PK';
        utterance.rate = 0.92;
        utterance.pitch = 0.98;
      } else if (isRomanUrdu) {
        // Natural, calm, polite South Asian / British hybrid phonetic for Roman Urdu
        utterance.lang = 'en-IN';
        utterance.rate = settings.speechRate ? settings.speechRate * 0.98 : 0.96;
        utterance.pitch = settings.speechPitch ? settings.speechPitch * 0.92 : 0.92;
      } else {
        // Authentic J.A.R.V.I.S (Paul Bettany) vocal parameters: refined, calm, deep British cadence
        utterance.lang = 'en-GB';
        utterance.rate = settings.speechRate ? settings.speechRate * 0.95 : 0.95;
        utterance.pitch = settings.speechPitch ? settings.speechPitch * 0.90 : 0.90;
      }

      if (settings.voiceName && availableVoices.length > 0) {
        const selected = availableVoices.find((v) => v.name === settings.voiceName);
        if (selected) utterance.voice = selected;
      } else if (availableVoices.length > 0) {
        if (hasUrduScript) {
          const urduVoice =
            availableVoices.find((v) => v.lang.startsWith('ur') || v.lang.includes('ur-PK') || v.lang.includes('ur_PK')) ||
            availableVoices.find((v) => v.lang.startsWith('hi') || v.lang.includes('hi-IN')) ||
            availableVoices[0];
          if (urduVoice) utterance.voice = urduVoice;
        } else if (isRomanUrdu) {
          // Check for Indian / UK Male voice for clear pronunciation with JARVIS tone
          const romanUrduVoice =
            availableVoices.find((v) => (v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('rishi') || v.name.toLowerCase().includes('prabhat')) && (v.lang.includes('IN') || v.lang.includes('GB'))) ||
            availableVoices.find((v) => (v.lang.includes('en-IN') || v.lang.includes('en_IN')) && v.name.toLowerCase().includes('male')) ||
            availableVoices.find((v) => v.lang.includes('en-IN') || v.lang.includes('en_IN') || v.name.toLowerCase().includes('india')) ||
            availableVoices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en_GB')) ||
            availableVoices.find((v) => v.lang.startsWith('hi') || v.lang.startsWith('ur')) ||
            availableVoices[0];
          if (romanUrduVoice) utterance.voice = romanUrduVoice;
        } else {
          // Iconic JARVIS Voice: Paul Bettany British gentleman persona (Daniel, George, Oliver, Arthur, UK Male)
          const jarvisVoice =
            availableVoices.find(
              (v) =>
                (v.lang.includes('en-GB') || v.lang.includes('en_GB') || v.lang === 'en-GB') &&
                (v.name.toLowerCase().includes('daniel') ||
                  v.name.toLowerCase().includes('george') ||
                  v.name.toLowerCase().includes('arthur') ||
                  v.name.toLowerCase().includes('oliver') ||
                  v.name.toLowerCase().includes('male') ||
                  v.name.toLowerCase().includes('uk english male'))
            ) ||
            availableVoices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en_GB')) ||
            availableVoices.find((v) => v.name.toLowerCase().includes('male') && v.lang.startsWith('en')) ||
            availableVoices.find((v) => v.name.toLowerCase().includes('natural') && v.lang.startsWith('en')) ||
            availableVoices.find((v) => v.lang.startsWith('en')) ||
            availableVoices[0];

          if (jarvisVoice) utterance.voice = jarvisVoice;
        }
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setVoiceState('speaking');
      };

      const finishSpeaking = () => {
        if (speakingSafetyTimerRef.current) {
          clearTimeout(speakingSafetyTimerRef.current);
          speakingSafetyTimerRef.current = null;
        }
        isSpeakingRef.current = false;
        setVoiceState('ready');
        if (onEndCallback) onEndCallback();

        // Resume listening only if user had explicitly enabled listening
        if (shouldListenRef.current && recognitionRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch {
              shouldListenRef.current = false;
            }
          }, 250);
        }
      };

      utterance.onend = finishSpeaking;
      utterance.onerror = finishSpeaking;

      // Watchdog timeout to prevent voice state from hanging
      const safetyMs = Math.max(3000, Math.min(20000, cleaned.length * 80));
      speakingSafetyTimerRef.current = setTimeout(finishSpeaking, safetyMs);

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finishSpeaking();
      }
    },
    [settings.speechRate, settings.speechPitch, settings.voiceName, availableVoices]
  );

  const speakText = useCallback(
    async (rawText: string, onEnd?: () => void) => {
      if (!settings.speechEnabled) {
        if (onEnd) onEnd();
        return;
      }

      // Cancel ongoing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }

      const cleaned = cleanMarkdownForSpeech(rawText);
      if (!cleaned) {
        if (onEnd) onEnd();
        return;
      }

      isSpeakingRef.current = true;
      setVoiceState('speaking');

      // Attempt Neural TTS only if not known to be unavailable and user didn't force browser
      if (settings.voiceEngine !== 'browser' && cachedNeuralTtsAvailable !== false) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600);

          const res = await fetch('/api/tts', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: cleaned,
              voice: settings.easyVoiceVoice || 'bm_daniel',
              engine: settings.voiceEngine || 'easyVoice',
            }),
          });
          clearTimeout(timeoutId);

          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('audio')) {
            const blob = await res.blob();
            if (blob.size > 200) {
              cachedNeuralTtsAvailable = true;
              const audioUrl = URL.createObjectURL(blob);
              const audio = new Audio(audioUrl);
              currentAudioRef.current = audio;
              audio.playbackRate = settings.speechRate || 1.0;

              audio.onplay = () => {
                isSpeakingRef.current = true;
                setVoiceState('speaking');
              };
              audio.onended = () => {
                isSpeakingRef.current = false;
                setVoiceState('ready');
                URL.revokeObjectURL(audioUrl);
                currentAudioRef.current = null;
                if (onEnd) onEnd();
                if (shouldListenRef.current && recognitionRef.current) {
                  setTimeout(() => {
                    try {
                      recognitionRef.current.start();
                    } catch {
                      shouldListenRef.current = false;
                    }
                  }, 250);
                }
              };
              audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                currentAudioRef.current = null;
                speakViaBrowser(cleaned, onEnd);
              };

              await audio.play().catch(() => {
                speakViaBrowser(cleaned, onEnd);
              });
              return;
            }
          } else {
            // Server returned fallback (e.g. no neural key configured)
            cachedNeuralTtsAvailable = false;
          }
        } catch {
          // Network issue or timeout - cache as unavailable to prevent further lag
          cachedNeuralTtsAvailable = false;
        }
      }

      speakViaBrowser(cleaned, onEnd);
    },
    [settings.speechEnabled, settings.voiceEngine, settings.easyVoiceVoice, settings.speechRate, speakViaBrowser]
  );

  const stopSpeaking = useCallback(() => {
    isSpeakingRef.current = false;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('ready');
  }, []);

  return {
    voiceState,
    setVoiceState,
    interimText,
    audioLevel,
    availableVoices,
    isSupported,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  };
}
