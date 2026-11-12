import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RefreshCw, Radio, Volume2 } from 'lucide-react';
import { AnimeItem, Episode } from '../types/anime';
import {
  cleanAnimeSlug,
  getDeterministicStreamUrl,
  ToonplayServer,
  ToonplayLang,
  ToonplayEpisodeResponse,
} from '../utils/toonplayEngine';

interface VideoPlayerProps {
  anime: AnimeItem;
  seasonNumber: number;
  currentEpisode: Episode;
  isResolvingSeries?: boolean;
}

const DEFAULT_LANGS: ToonplayLang[] = [
  { code: 'hin', label: 'Hindi' },
  { code: 'eng', label: 'English' },
  { code: 'jpn', label: 'Japanese' },
];

const clientServersCache = new Map<string, ToonplayServer[]>();

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  anime,
  seasonNumber,
  currentEpisode,
}) => {
  const [selectedLang, setSelectedLang] = useState<string>('hin');
  const [selectedServerIdx, setSelectedServerIdx] = useState<number>(0);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [availableLangs, setAvailableLangs] = useState<ToonplayLang[]>(DEFAULT_LANGS);

  const isMovie =
    anime.type === 'Movie' ||
    Boolean(anime.pageUrl && anime.pageUrl.includes('/movies/'));

  const slug = useMemo(() => {
    return cleanAnimeSlug(
      anime.slug || anime.pageUrl || anime.id || anime.title
    );
  }, [anime.slug, anime.pageUrl, anime.id, anime.title]);

  const streamCacheKey = `${slug}-s${seasonNumber}-e${currentEpisode.number}-${selectedLang}`;

  // Initial servers: only from cache to avoid flashing third-party error screens
  const [servers, setServers] = useState<ToonplayServer[]>(() => {
    return clientServersCache.get(streamCacheKey) || [];
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [, setIsResolvingStream] = useState<boolean>(!clientServersCache.has(streamCacheKey));

  // Background Stream Resolver: Asynchronously extracts mirrors and multi-dub tracks
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    // If already in client cache, use it immediately
    const cached = clientServersCache.get(streamCacheKey);
    if (cached && cached.length > 0) {
      setServers(cached);
      setIsResolvingStream(false);
      return;
    }

    setIsResolvingStream(true);

    const epUrlParam = currentEpisode.episodeUrl || '';
    const pageUrlParam = anime.pageUrl || '';
    const titleParam = anime.title || '';

    const endpoint = `/api/toonplay/episode?slug=${encodeURIComponent(
      slug
    )}&season=${seasonNumber}&ep=${currentEpisode.number}&lang=${encodeURIComponent(
      selectedLang
    )}&isMovie=${isMovie}&episodeUrl=${encodeURIComponent(
      epUrlParam
    )}&pageUrl=${encodeURIComponent(
      pageUrlParam
    )}&title=${encodeURIComponent(
      titleParam
    )}`;

    fetch(endpoint, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ToonplayEpisodeResponse) => {
        if (!active || controller.signal.aborted) return;
        if (data && Array.isArray(data.servers) && data.servers.length > 0) {
          clientServersCache.set(streamCacheKey, data.servers);
          setServers(data.servers);
          setSelectedServerIdx(0);
        }
        if (data && Array.isArray(data.availableLangs) && data.availableLangs.length > 0) {
          setAvailableLangs(data.availableLangs);
        }
        setIsResolvingStream(false);
      })
      .catch(() => {
        if (active) setIsResolvingStream(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    slug,
    seasonNumber,
    currentEpisode.number,
    currentEpisode.episodeUrl,
    anime.pageUrl,
    anime.title,
    selectedLang,
    isMovie,
    streamCacheKey,
    reloadKey,
  ]);

  // Reset to Server 1 when switching episodes or seasons
  useEffect(() => {
    setSelectedServerIdx(0);
  }, [slug, seasonNumber, currentEpisode.number]);

  const activeServer = servers[selectedServerIdx] || servers[0];
  const activeUrl = activeServer?.url || '';

  const handleSelectServer = (idx: number) => {
    setSelectedServerIdx(idx);
  };

  const handleSelectLang = (code: string) => {
    setSelectedLang(code);
  };

  const handleReload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const isAntiSandboxHost =
    activeServer?.allowSandbox === false ||
    (activeServer?.url &&
      (activeServer.url.includes('cloudy.upns') ||
        activeServer.url.includes('vidc.upns')));

  const sandboxSettings = isAntiSandboxHost
    ? 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox'
    : 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups';

  return (
    <div>
      {/* 16:9 Anti-Ad & Anti-Popup Sandboxed Video Player Container */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
        {activeUrl ? (
          <iframe
            ref={iframeRef}
            key={`player-${slug}-s${seasonNumber}-e${currentEpisode.number}-${selectedServerIdx}-${selectedLang}-${reloadKey}`}
            src={activeUrl}
            title={`${anime.title} - ${isMovie ? 'Movie' : `Season ${seasonNumber} Episode ${currentEpisode.number}`}`}
            sandbox={sandboxSettings}
            referrerPolicy="no-referrer"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            className="w-full h-full border-0 bg-black"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black">
            <div className="w-9 h-9 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Multi-Server & Audio Dub Selector Bar */}
      <div className="mt-3 space-y-2.5">
        {/* Servers Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1 text-xs font-bold uppercase text-zinc-950 shrink-0">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              Servers:
            </span>
            {servers.length > 0 ? (
              servers.map((s, idx) => {
                const isSelected = selectedServerIdx === idx;
                return (
                  <button
                    key={s.id || s.name}
                    type="button"
                    onClick={() => handleSelectServer(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                        : 'bg-white border-zinc-200 text-zinc-950 font-semibold hover:border-blue-600 hover:text-blue-600'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })
            ) : (
              <span className="text-xs font-mono text-zinc-400 py-1">Loading servers...</span>
            )}
          </div>

          {/* Quick Refresh Stream Button */}
          <button
            type="button"
            onClick={handleReload}
            title="Reload Video Player"
            className="p-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-blue-600 hover:border-blue-600 shrink-0 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audio Dub Selector Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1 text-xs font-bold uppercase text-zinc-950 shrink-0">
            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            Audio Dub:
          </span>
          {availableLangs.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLang(lang.code)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white border-zinc-200 text-zinc-950 font-semibold hover:border-blue-600 hover:text-blue-600'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
