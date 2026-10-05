import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, Sliders, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const YOUTUBE_VIDEO_ID = 'rifTkEXFb_U';
const STORAGE_KEY_PLAYING = 'passly_ambient_sound_playing';
const STORAGE_KEY_VOLUME = 'passly_ambient_sound_volume';

export function BackgroundAudioPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
      return saved ? parseInt(saved, 10) : 55;
    } catch {
      return 55;
    }
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY_PLAYING));
    } catch {
      return false;
    }
  });

  // Send API command to YouTube iframe safely via postMessage
  const postToPlayer = useCallback((func: string, args: (string | number | boolean)[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  }, []);

  // Listen to YouTube player state events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.origin === 'string' && event.origin.includes('youtube.com')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.event === 'onStateChange') {
            // 1: PLAYING, 2: PAUSED, 0: ENDED, 3: BUFFERING
            if (data.info === 1) {
              setIsPlaying(true);
            } else if (data.info === 2 || data.info === 0) {
              setIsPlaying(false);
            }
          }
        } catch {
          // ignore non-json messages
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize volume when iframe loads
  const handleIframeLoad = () => {
    postToPlayer('setVolume', [volume]);
  };

  const handleTogglePlay = () => {
    setHasInteracted(true);
    try {
      localStorage.setItem(STORAGE_KEY_PLAYING, '1');
    } catch {
      // storage unavailable
    }

    if (isPlaying) {
      postToPlayer('pauseVideo');
      setIsPlaying(false);
    } else {
      postToPlayer('unMute');
      postToPlayer('setVolume', [volume]);
      postToPlayer('playVideo');
      setIsPlaying(true);
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      postToPlayer('unMute');
      postToPlayer('setVolume', [volume || 50]);
      setIsMuted(false);
    } else {
      postToPlayer('mute');
      setIsMuted(true);
    }
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, newVol.toString());
    } catch {
      // storage unavailable
    }

    if (newVol === 0) {
      setIsMuted(true);
      postToPlayer('mute');
    } else {
      if (isMuted) {
        setIsMuted(false);
        postToPlayer('unMute');
      }
      postToPlayer('setVolume', [newVol]);
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      {/* Invisible YouTube Player Engine (No mp4 video display, purely background audio) */}
      <iframe
        ref={iframeRef}
        onLoad={handleIframeLoad}
        tabIndex={-1}
        aria-hidden="true"
        title="Atmospheric Sound Engine"
        src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&origin=${encodeURIComponent(
          originUrl
        )}&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&playsinline=1`}
        className="fixed -bottom-[9999px] -right-[9999px] w-1 h-1 opacity-0 pointer-events-none"
        allow="autoplay; encrypted-media"
      />

      {/* Floating Luxury Ambient Sound Dock */}
      <div className="fixed bottom-16 sm:bottom-6 left-4 sm:left-6 z-40 select-none">
        <AnimatePresence>
          {/* First visit subtle invitation tooltip */}
          {!hasInteracted && !isPlaying && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="mb-2 max-w-[250px] p-2.5 rounded-xl bg-[#0B0F17]/95 border border-[#C5A059]/40 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-left flex items-start gap-2.5"
            >
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping mt-1 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-[#D4AF37] tracking-tight">
                  Ambient Classical Audio
                </p>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">
                  Tap to play relaxing orchestral background sound during your visit.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
          className={`${
            isExpanded
              ? 'rounded-2xl w-[290px] sm:w-[320px] bg-[#0B0F17]/96 border border-[#C5A059]/40 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_1px_3px_rgba(212,175,55,0.2)]'
              : 'rounded-full bg-[#0B0F17]/92 border border-[#C5A059]/35 shadow-[0_8px_32px_rgba(11,15,23,0.35),0_1px_2px_rgba(212,175,55,0.15)]'
          } backdrop-blur-xl text-white overflow-hidden`}
        >
          {/* Main Header / Collapsed Pill */}
          <div className="flex items-center justify-between gap-2.5 px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                title={isPlaying ? 'Pause Background Music' : 'Play Background Music'}
                className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#C5A059] to-[#B88B2A] text-[#0B0F17] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-[0_2px_8px_rgba(197,160,89,0.3)] cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-[#0B0F17] stroke-[1.5]" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-[#0B0F17] stroke-[1.5] translate-x-0.5" />
                )}
              </button>

              {/* Equalizer Frequency Bars */}
              <div
                className="flex items-end gap-[3px] h-4.5 px-1 shrink-0 cursor-pointer"
                onClick={handleTogglePlay}
                title={isPlaying ? 'Audio Streaming' : 'Audio Paused'}
              >
                <span
                  className={`w-[2.5px] rounded-full bg-gradient-to-t from-[#B88B2A] to-[#D4AF37] transition-all ${
                    isPlaying ? 'animate-wave-1' : 'h-[3px] opacity-40'
                  }`}
                />
                <span
                  className={`w-[2.5px] rounded-full bg-gradient-to-t from-[#B88B2A] to-[#D4AF37] transition-all ${
                    isPlaying ? 'animate-wave-2' : 'h-[4px] opacity-40'
                  }`}
                />
                <span
                  className={`w-[2.5px] rounded-full bg-gradient-to-t from-[#B88B2A] to-[#D4AF37] transition-all ${
                    isPlaying ? 'animate-wave-3' : 'h-[3px] opacity-40'
                  }`}
                />
                <span
                  className={`w-[2.5px] rounded-full bg-gradient-to-t from-[#B88B2A] to-[#D4AF37] transition-all ${
                    isPlaying ? 'animate-wave-4' : 'h-[5px] opacity-40'
                  }`}
                />
              </div>

              {/* Track Info (Click to toggle expansion) */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-left flex flex-col justify-center focus:outline-none cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-white tracking-tight leading-tight truncate">
                    Ambient Sound
                  </span>
                  <span className="text-[8px] font-mono uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 px-1.5 py-0.5 rounded-full border border-[#D4AF37]/30 shrink-0">
                    {isPlaying ? 'Live' : 'Ready'}
                  </span>
                </div>
                {!isExpanded && (
                  <span className="text-[9px] text-zinc-400 truncate max-w-[105px] leading-tight">
                    Classical Lounge
                  </span>
                )}
              </button>
            </div>

            {/* Expand / Minimize Controls Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Hide controls' : 'Show volume controls'}
              className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
              )}
            </button>
          </div>

          {/* Expanded Drawer (Volume Slider & Full Track Metadata) */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="border-t border-[#C5A059]/20 px-4 pt-3 pb-3.5 bg-[#0B0F17]/90 flex flex-col gap-3"
              >
                {/* Volume Level Row */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                      Volume Control
                    </span>
                    <span className="text-[#D4AF37] font-mono font-medium text-[11px]">
                      {isMuted ? 'Muted' : `${volume}%`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      title={isMuted ? 'Unmute' : 'Mute'}
                      className="p-1 rounded-md text-zinc-400 hover:text-[#D4AF37] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-[#C5A059]" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeSlider}
                      className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Track Metadata Card */}
                <div className="p-2.5 rounded-lg bg-white/[0.04] border border-[#C5A059]/20 flex flex-col gap-1">
                  <p className="text-[11px] font-medium text-white truncate leading-tight">
                    Classical Music for Relaxation
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="text-[#C5A059] font-medium">HALIDONMUSIC</span>
                    <span className="text-zinc-500 font-mono text-[9px]">Ambient Stream</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
