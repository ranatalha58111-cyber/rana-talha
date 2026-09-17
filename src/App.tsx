/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JarvisHeader } from './components/JarvisHeader';
import { JarvisCore } from './components/JarvisCore';
import { ConversationPanel } from './components/ConversationPanel';
import { WebIntelPanel, WebIntelItem } from './components/WebIntelPanel';
import { AuthModal } from './components/AuthModal';
import { useSpeech } from './hooks/useSpeech';
import { Message, UserSettings, SystemStatus, AuthUser, VoiceState } from './types';
import {
  playElectronicMachineBootSequence,
  playRoboticStartupVoice,
  playJarvisWakeBlip,
} from './utils/audioEffects';
import { playRealJarvisStartupSound } from './utils/jarvisAudioPlayer';
import { parseJarvisCommand } from './utils/commandParser';
import { launchDesktopApplication, closeDesktopApplication } from './utils/nativeAppLauncher';

const SESSION_BOOT_KEY = 'jarvis_boot_initialized_session';

const DEFAULT_SETTINGS: UserSettings = {
  assistantName: 'JARVIS',
  speechEnabled: true,
  autoSpeakReplies: true,
  voiceName: '',
  speechRate: 0.95,
  speechPitch: 0.90,
  model: 'gemini-3.1-flash-lite',
  responseStyle: 'concise',
  temperature: 0.7,
  confirmAutomations: true,
  voiceEngine: 'browser',
  easyVoiceVoice: 'bm_daniel',
  micSensitivity: 50,
};

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('jarvis_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate deprecated or exhausted models to active gemini-3.1-flash-lite
        if (
          !parsed.model ||
          parsed.model === 'auto-balanced' ||
          parsed.model === 'gemini-3.8-flash' ||
          parsed.model === 'gemini-2.5-flash' ||
          parsed.model.startsWith('groq/')
        ) {
          parsed.model = 'gemini-3.1-flash-lite';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [hasBooted, setHasBooted] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_BOOT_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [bootPhase, setBootPhase] = useState<number>(() => {
    try {
      return sessionStorage.getItem(SESSION_BOOT_KEY) === 'true' ? 5 : 0;
    } catch {
      return 0;
    }
  });

  const isBootingRef = useRef<boolean>(false);

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'AUTO' | 'ROMAN_URDU' | 'اردو' | 'ENGLISH'>(
    (settings.language as any) || 'AUTO'
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [intelItems, setIntelItems] = useState<WebIntelItem[]>([]);
  const [directIntelAnswer, setDirectIntelAnswer] = useState<string | null>(null);
  const [isSearchingIntel, setIsSearchingIntel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'conversation' | 'core' | 'intel'>('core');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (settings.language && settings.language !== selectedLanguage) {
      setSelectedLanguage(settings.language as any);
    }
  }, [settings.language]);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('jarvis_current_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Talha' && (parsed.email === 'talha@jarvis.ai' || !parsed.email)) {
          localStorage.removeItem('jarvis_current_auth_user');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Discover server status and auto-configure EasyVoice
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data: SystemStatus) => {
        setSystemStatus(data);
        if (data?.hasEasyVoice) {
          setSettings((prev) => ({
            ...prev,
            voiceEngine: 'easyVoice',
            easyVoiceVoice: prev.easyVoiceVoice || 'bm_daniel',
          }));
        }
      })
      .catch((e) => console.warn('Status fetch warning:', e));
  }, []);

  // Sync settings
  useEffect(() => {
    try {
      localStorage.setItem('jarvis_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [settings]);

  // Forward ref for handleSendMessage
  const handleSendMessageRef = useRef<(text: string) => void>(() => {});

  // Handle Speech transcript (memoized, stable)
  const handleTranscriptComplete = useCallback((transcript: string) => {
    if (transcript.trim()) {
      handleSendMessageRef.current(transcript.trim());
    }
  }, []);

  // Forward ref for setVoiceState
  const setVoiceStateRef = useRef<(state: VoiceState) => void>(() => {});

  // Forward ref for executeSystemBootSequence
  const executeBootRef = useRef<() => void>(() => {});

  // Wake-word handler (continuous listening)
  const handleWakeWord = useCallback((remainder?: string) => {
    if (!hasBooted) {
      executeBootRef.current();
      return;
    }
    // Wake word detected! Plays tactical chirp, does NOT replay boot sequence
    playJarvisWakeBlip();
    setVoiceStateRef.current('listening');

    if (remainder && remainder.trim()) {
      handleSendMessageRef.current(remainder.trim());
    }
  }, [hasBooted]);

  const {
    voiceState,
    setVoiceState,
    availableVoices,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  } = useSpeech({
    settings,
    onTranscriptComplete: handleTranscriptComplete,
    onWakeWordDetected: handleWakeWord,
  });

  setVoiceStateRef.current = setVoiceState;

  const handleUserLogin = useCallback(
    (user: AuthUser) => {
      setCurrentUser(user);
      setSettings((prev) => ({
        ...prev,
        userName: user.name,
      }));

      // Add identity acknowledgment to conversation
      const welcomeMsg: Message = {
        id: `msg-welcome-${Date.now()}`,
        role: 'assistant',
        content: `Identity verified: ${user.name}. J.A.R.V.I.S is at your command.`,
        timestamp: new Date().toISOString(),
        status: 'complete',
      };
      setMessages((prev) => [...prev, welcomeMsg]);

      // Spoken greeting to the signed-in user
      if (settings.speechEnabled) {
        setVoiceState('speaking');
        const speechGreeting =
          selectedLanguage === 'اردو'
            ? `خوش آمدید، ${user.name} صاحب۔ جاروس آپ کے حکم کا منتظر ہے۔`
            : `Welcome, ${user.name}. All systems are initialized and ready for your command.`;
        speakText(speechGreeting, () => setVoiceState('ready'));
      }
    },
    [selectedLanguage, settings.speechEnabled, speakText, setVoiceState]
  );

  const handleUserLogout = useCallback(() => {
    const formerName = currentUser?.name;
    setCurrentUser(null);
    setSettings((prev) => ({
      ...prev,
      userName: undefined,
    }));

    const logoutMsg: Message = {
      id: `msg-logout-${Date.now()}`,
      role: 'assistant',
      content: formerName
        ? `Commander ${formerName} signed out. Default guest protocol active.`
        : 'Session ended. Guest mode active.',
      timestamp: new Date().toISOString(),
      status: 'complete',
    };
    setMessages((prev) => [...prev, logoutMsg]);
  }, [currentUser]);

  // ONE-TIME JARVIS SYSTEM BOOT SEQUENCE
  const executeSystemBootSequence = useCallback(() => {
    if (hasBooted || isBootingRef.current) return;
    isBootingRef.current = true;
    setVoiceState('booting');
    setBootPhase(0);

    // Play real-world Jarvis startup sound (.wav)
    playRealJarvisStartupSound();

    // 1. Play electronic machine boot sounds: "tunt... unt... t-tunt... vmmm..."
    playElectronicMachineBootSequence((phase) => {
      setBootPhase(phase);
    });

    // 2. Play robotic startup announcement when sounds complete (~2.4s)
    setTimeout(() => {
      setBootPhase(5);
      playRoboticStartupVoice(() => {
        try {
          sessionStorage.setItem(SESSION_BOOT_KEY, 'true');
        } catch {}
        setHasBooted(true);
        isBootingRef.current = false;
        setVoiceState('ready');
        try {
          startListening();
        } catch {}
      });
    }, 2400);
  }, [hasBooted, setVoiceState]);

  executeBootRef.current = executeSystemBootSequence;

  // Auto-trigger boot sequence on initial mount
  useEffect(() => {
    if (!hasBooted) {
      const timer = setTimeout(() => {
        executeSystemBootSequence();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setVoiceState('ready');
    }
  }, [hasBooted, executeSystemBootSequence, setVoiceState]);

  // Auto-start continuous background listening when booted so saying "Jarvis" wakes it up instantly
  useEffect(() => {
    if (hasBooted) {
      const timer = setTimeout(() => {
        startListening();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasBooted, startListening]);

  // Click handler for core - starts listening with zero delay
  const handleCoreClick = () => {
    if (!hasBooted) {
      setHasBooted(true);
      isBootingRef.current = false;
      try {
        sessionStorage.setItem(SESSION_BOOT_KEY, 'true');
      } catch {}
    }
    playJarvisWakeBlip();
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  // Send message handler (Natural Language Commands + AI Chat)
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    if (!hasBooted) {
      setHasBooted(true);
      isBootingRef.current = false;
      try {
        sessionStorage.setItem(SESSION_BOOT_KEY, 'true');
      } catch {}
    }

    stopSpeaking();

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
      status: 'complete',
    };

    setMessages((prev) => [...prev, userMessage]);

    const effectiveUserName = currentUser?.name || settings.userName || '';

    // 1. Check local command parser for immediate desktop actions & security barrier
    const parsed = parseJarvisCommand(text, selectedLanguage, effectiveUserName);

    if (parsed.isCommand) {
      // A. Dangerous or unauthorized action blocked
      if (parsed.type === 'SECURITY_BLOCKED' || parsed.type === 'UNAUTHORIZED') {
        setVoiceState('thinking');
        const replyText =
          parsed.spokenReply ||
          (effectiveUserName
            ? `That action is not authorized, ${effectiveUserName}.`
            : 'That application is not currently authorized.');
        const blockMessage: Message = {
          id: `msg-blocked-${Date.now()}`,
          role: 'assistant',
          content: replyText,
          timestamp: new Date().toISOString(),
          status: 'complete',
        };
        setMessages((prev) => [...prev, blockMessage]);

        if (settings.speechEnabled) {
          setVoiceState('speaking');
          speakText(replyText, () => setVoiceState('ready'));
        } else {
          setVoiceState('ready');
        }
        return;
      }

      // B. Approved real desktop action
      setVoiceState('executing');

      // 1. Native Desktop App Launch (Electron, Local Bridge, or OS Scheme)
      if (parsed.type === 'APP_LAUNCH') {
        const launchResult = await launchDesktopApplication(
          parsed,
          selectedLanguage,
          effectiveUserName
        );

        const finalReply =
          launchResult.spokenFeedback ||
          parsed.spokenReply ||
          `Action executed for ${parsed.appName}.`;

        const assistantMessage: Message = {
          id: `msg-cmd-${Date.now()}`,
          role: 'assistant',
          content: finalReply,
          timestamp: new Date().toISOString(),
          status: 'complete',
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (settings.speechEnabled) {
          setVoiceState('speaking');
          speakText(finalReply, () => setVoiceState('ready'));
        } else {
          setTimeout(() => setVoiceState('ready'), 1000);
        }
        return;
      }
      // 1b. Close App / Terminate
      else if (parsed.type === 'CLOSE_APP' || parsed.type === 'APP_CLOSE') {
        if (typeof window !== 'undefined') {
          try {
            document.querySelectorAll('video, audio').forEach((el: any) => {
              el.pause();
              el.currentTime = 0;
            });
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
          } catch {}
        }

        const closeResult = await closeDesktopApplication(
          parsed,
          selectedLanguage,
          effectiveUserName
        );

        const finalReply =
          closeResult.spokenFeedback ||
          parsed.spokenReply ||
          `Closed ${parsed.appName}.`;

        const assistantMessage: Message = {
          id: `msg-close-${Date.now()}`,
          role: 'assistant',
          content: finalReply,
          timestamp: new Date().toISOString(),
          status: 'complete',
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (settings.speechEnabled) {
          setVoiceState('speaking');
          speakText(finalReply, () => setVoiceState('ready'));
        } else {
          setTimeout(() => setVoiceState('ready'), 1000);
        }
        return;
      }
      // 2. URL Open (YouTube, Spotify Web, web links)
      else if (parsed.type === 'URL_OPEN' && parsed.url) {
        if (typeof window !== 'undefined' && window.electronAPI?.isDesktop && window.electronAPI.openUrl) {
          window.electronAPI.openUrl(parsed.url).catch(console.warn);
        } else {
          try {
            window.open(parsed.url, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.warn('Fallback URL open error:', e);
          }
        }
      }
      // 3. Screen Scroll
      else if (parsed.type === 'SCREEN_SCROLL') {
        const dir = parsed.direction || 'down';
        const amt = parsed.amount || 500;
        if (typeof window !== 'undefined' && window.electronAPI?.isDesktop && window.electronAPI.scrollScreen) {
          window.electronAPI.scrollScreen(dir, amt).catch(() => {});
        }
        try {
          if (dir === 'up') window.scrollBy({ top: -amt, behavior: 'smooth' });
          else window.scrollBy({ top: amt, behavior: 'smooth' });
        } catch {}
      }
      // 4. Media Control
      else if (parsed.type === 'MEDIA_CONTROL') {
        const action = parsed.action || 'pause';
        if (typeof window !== 'undefined' && window.electronAPI?.isDesktop && window.electronAPI.controlMedia) {
          window.electronAPI.controlMedia(action).catch(() => {});
        }
        if (action === 'pause' || action === 'stop') {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        }
      }

      const replyContent =
        parsed.spokenReply ||
        (effectiveUserName
          ? `I have completed that for you, ${effectiveUserName}.`
          : 'Action executed, sir.');
      const assistantMessage: Message = {
        id: `msg-cmd-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toISOString(),
        status: 'complete',
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (settings.speechEnabled) {
        setVoiceState('speaking');
        speakText(replyContent, () => setVoiceState('ready'));
      } else {
        setTimeout(() => setVoiceState('ready'), 1000);
      }
      return;
    }

    // 2. Freeform conversational AI via /api/chat
    setIsLoading(true);
    setVoiceState('thinking');

    const isSearchQuery = /search|news|weather|who is|what is|latest|current|tavily|live/i.test(text);
    if (isSearchQuery) {
      setIsSearchingIntel(true);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          messages: [...messages, userMessage].slice(-6),
          language: selectedLanguage,
          userName: effectiveUserName,
          userSettings: {
            ...settings,
            userName: effectiveUserName,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server status: ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Request processed, sir.',
        timestamp: new Date().toISOString(),
        status: 'complete',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.answer) {
        setDirectIntelAnswer(data.answer);
      }

      if (data.searchResults && Array.isArray(data.searchResults) && data.searchResults.length > 0) {
        setIntelItems(
          data.searchResults.map((sr: any, idx: number) => ({
            id: `intel-${Date.now()}-${idx}`,
            title: sr.title || 'Web Intelligence Result',
            url: sr.url || '#',
            snippet: sr.snippet || sr.description || '',
            source: sr.source || 'TAVILY REAL-TIME',
            category: sr.category === 'video' ? 'video' : 'website',
            authorOrChannel: sr.authorOrChannel,
          }))
        );
      } else {
        // Generate contextual fallback suggestions for videos and websites only
        const encText = encodeURIComponent(text.slice(0, 50));
        setIntelItems([
          {
            id: `intel-vid-${Date.now()}`,
            title: `Watch: ${text.slice(0, 36)} - Video Explainer`,
            url: `https://www.youtube.com/results?search_query=${encText}+tutorial`,
            snippet: `Curated video walkthroughs and community explanations related to "${text.slice(0, 40)}".`,
            source: 'YOUTUBE VIDEO',
            category: 'video',
            authorOrChannel: 'YouTube',
          },
          {
            id: `intel-vid-guide-${Date.now()}`,
            title: `YouTube: ${text.slice(0, 36)} - Deep Dive Walkthrough`,
            url: `https://www.youtube.com/results?search_query=${encText}+walkthrough`,
            snippet: `In-depth visual walkthrough and expert demonstrations.`,
            source: 'YOUTUBE VIDEO',
            category: 'video',
            authorOrChannel: 'YouTube',
          },
          {
            id: `intel-site-${Date.now()}`,
            title: `${text.slice(0, 36)} - Official Portals & Web Directory`,
            url: `https://duckduckgo.com/?q=!ducky+${encText}+official+website`,
            snippet: `Primary canonical portals, community repositories, and technical resources.`,
            source: 'OFFICIAL WEB PORTAL',
            category: 'website',
            authorOrChannel: 'Web Portal',
          },
          {
            id: `intel-site-wiki-${Date.now()}`,
            title: `${text.slice(0, 36)} - Online Portal & Knowledge Base`,
            url: `https://en.wikipedia.org/wiki/Special:Search?search=${encText}`,
            snippet: `Encyclopedia web portal and resource index.`,
            source: 'WIKIPEDIA PORTAL',
            category: 'website',
            authorOrChannel: 'Wikipedia',
          },
        ]);
      }

      // Process side effects from server tool registry
      if (data.sideEffects && Array.isArray(data.sideEffects)) {
        for (const se of data.sideEffects) {
          if (se.type === 'APP_LAUNCH' && se.app) {
            setVoiceState('executing');
            if (typeof window !== 'undefined' && window.electronAPI?.isDesktop && window.electronAPI.launchApp) {
              window.electronAPI.launchApp(se.target || se.app.command).catch(console.warn);
            } else if (se.app.webFallbackUrl) {
              try {
                window.open(se.app.webFallbackUrl, '_blank', 'noopener,noreferrer');
              } catch (e) {
                console.warn('Fallback URL open error:', e);
              }
            }
          } else if (se.type === 'URL_OPEN' && se.url) {
            setVoiceState('executing');
            if (typeof window !== 'undefined' && window.electronAPI?.isDesktop && window.electronAPI.openUrl) {
              window.electronAPI.openUrl(se.url).catch(console.warn);
            } else {
              try {
                window.open(se.url, '_blank', 'noopener,noreferrer');
              } catch (e) {
                console.warn('URL open error:', e);
              }
            }
          } else if (se.type === 'SCREEN_SCROLL') {
            const dir = se.direction || 'down';
            const amt = Number(se.amount) || 500;
            if (typeof window !== 'undefined' && window.electronAPI?.isDesktop && window.electronAPI.scrollScreen) {
              window.electronAPI.scrollScreen(dir, amt).catch(() => {});
            }
            try {
              if (dir === 'up') window.scrollBy({ top: -amt, behavior: 'smooth' });
              else window.scrollBy({ top: amt, behavior: 'smooth' });
            } catch {}
          } else if (se.type === 'MEDIA_CONTROL') {
            const action = se.action || 'pause';
            if (typeof window !== 'undefined' && window.electronAPI?.isDesktop && window.electronAPI.controlMedia) {
              window.electronAPI.controlMedia(action, se.service).catch(() => {});
            }
            if (action === 'pause' || action === 'stop' || action === 'mute') {
              if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }
          }
        }
      }

      // Voice response
      if (settings.speechEnabled && assistantMessage.content) {
        setVoiceState('speaking');
        speakText(assistantMessage.content, () => setVoiceState('ready'));
      } else {
        setVoiceState('ready');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: 'System communication error. Systems re-establishing link.',
        timestamp: new Date().toISOString(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
      setVoiceState('ready');
    } finally {
      setIsLoading(false);
      setIsSearchingIntel(false);
    }
  };

  handleSendMessageRef.current = handleSendMessage;

  const handleDirectWebSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingIntel(true);
    setDirectIntelAnswer(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.answer) {
          setDirectIntelAnswer(data.answer);
        }
        if (data.sources && Array.isArray(data.sources)) {
          setIntelItems(
            data.sources.map((sr: any, idx: number) => ({
              id: `intel-${Date.now()}-${idx}`,
              title: sr.title || 'Web Result',
              url: sr.url || '#',
              snippet: sr.snippet || '',
              source: sr.source || 'TAVILY REAL-TIME',
              category: sr.category === 'video' ? 'video' : 'website',
              authorOrChannel: sr.authorOrChannel,
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Direct web search error:', err);
    } finally {
      setIsSearchingIntel(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#030712] text-zinc-100 flex flex-col overflow-hidden bg-tech-grid relative select-none">
      {/* Subtle Radial Lighting Backdrop */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* TOP HEADER */}
      <JarvisHeader
        isOnline={true}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        activeMobileTab={activeMobileTab}
        onSelectMobileTab={setActiveMobileTab}
        intelCount={intelItems.length}
      />

      {/* MAIN SCREEN: THREE VERTICAL ZONES */}
      <div className="flex-1 flex w-full min-h-0 relative z-10 overflow-hidden">
        {/* LEFT ZONE: CONVERSATION PANEL */}
        <div
          className={`h-full flex-col overflow-hidden transition-all duration-200 ${
            activeMobileTab === 'conversation'
              ? 'flex w-full z-20'
              : 'hidden md:flex md:w-[200px] lg:w-[320px] shrink-0'
          }`}
        >
          <ConversationPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            userName={currentUser?.name}
          />
        </div>

        {/* CENTER ZONE: MAIN JARVIS CORE */}
        <div
          className={`h-full flex-1 min-w-0 flex flex-col justify-center items-center relative overflow-hidden ${
            activeMobileTab === 'core'
              ? 'flex w-full'
              : 'hidden md:flex'
          }`}
        >
          <JarvisCore
            voiceState={voiceState}
            onCoreClick={handleCoreClick}
          />
        </div>

        {/* RIGHT ZONE: LIVE WEB INTEL */}
        <div
          className={`h-full flex-col overflow-hidden transition-all duration-200 ${
            activeMobileTab === 'intel'
              ? 'flex w-full z-20'
              : 'hidden md:flex md:w-[210px] lg:w-[320px] xl:w-[340px] shrink-0'
          }`}
        >
          <WebIntelPanel
            intelItems={intelItems}
            isSearching={isSearchingIntel}
            onSearch={handleDirectWebSearch}
            directAnswer={directIntelAnswer}
          />
        </div>
      </div>

      {/* AUTHENTICATION & IDENTITY MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleUserLogin}
        onLogout={handleUserLogout}
        onUpdateName={(newName) => {
          setSettings((prev) => ({ ...prev, userName: newName }));
        }}
      />
    </div>
  );
}
