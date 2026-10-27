import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/** 재생기 공통 조작 — 파일 영상(<video>)과 YouTube 를 같은 방식으로 다룸 */
export interface PlayerHandle {
  currentTime(): number;
  duration(): number;
  seek(seconds: number, play?: boolean): void;
  setRate(rate: number): void;
}

export interface PlayerEvents {
  /** 재생 정보를 처음 알았을 때 (이어 보기 위치로 옮기는 시점) */
  onReady?: (duration: number) => void;
  /** 재생 중 약 1초마다 */
  onTick?: (current: number, duration: number) => void;
  /** 멈춤·끝 — 위치 바로 저장 */
  onPause?: () => void;
  onError?: (message: string) => void;
}

// ───────── 파일 영상 ─────────
export const FileVideo = forwardRef<PlayerHandle, PlayerEvents & { src: string }>(function FileVideo({ src, onReady, onTick, onPause, onError }, ref) {
  const v = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => ({
    currentTime: () => v.current?.currentTime ?? 0,
    duration: () => (Number.isFinite(v.current?.duration) ? v.current!.duration : 0),
    seek: (s, play) => {
      if (!v.current) return;
      v.current.currentTime = s;
      if (play) v.current.play().catch(() => undefined);
    },
    setRate: (r) => {
      if (v.current) v.current.playbackRate = r;
    },
  }));
  return (
    <video
      ref={v}
      src={src}
      controls
      playsInline
      preload="metadata"
      className="aspect-video w-full rounded-2xl bg-ink"
      onLoadedMetadata={(e) => onReady?.(e.currentTarget.duration || 0)}
      onTimeUpdate={(e) => onTick?.(e.currentTarget.currentTime, e.currentTarget.duration || 0)}
      onPause={onPause}
      onEnded={onPause}
      // 디코딩 실패도 화면에 알림 (KoreanEdu 모바일 재생 수정)
      onError={(e) => {
        const err = e.currentTarget.error;
        onError?.(
          err?.code === 4
            ? '이 기기에서 재생할 수 없는 영상 형식이에요. (아이폰 HEVC 영상이면 "호환성 우선"으로 다시 찍거나 mp4 로 바꿔 올려 주세요)'
            : err?.message || `영상 오류 (${err?.code ?? '알 수 없음'})`,
        );
      }}
    />
  );
});

// ───────── YouTube (IFrame API: 배속·이어 보기·메모 시각을 위해 일반 iframe 대신 사용) ─────────
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(s: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  setPlaybackRate(r: number): void;
  getPlayerState(): number;
  destroy(): void;
}
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  apiPromise ??= new Promise<void>((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => (prev?.(), resolve());
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => ((apiPromise = null), reject(new Error('YouTube 를 불러오지 못했어요.')));
    document.head.appendChild(s);
  });
  return apiPromise;
}

/** watch?v= / youtu.be / shorts / embed / live 주소에서 영상 ID (KoreanEdu 는 watch?v= 만 바꿔서 &t= 등이 붙으면 깨졌음) */
export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{6,})/);
      return m ? m[2] : null;
    }
  } catch {
    /* 주소 형식 아님 */
  }
  return null;
}

/** 링크가 영상 파일 자체인지 (.mp4 등) → <video> 로 재생 */
export const isDirectVideoUrl = (url: string) => /\.(mp4|webm|m4v|mov)(\?|#|$)/i.test(url);

const YT_ERRORS: Record<number, string> = {
  2: '영상 주소가 올바르지 않아요.',
  5: '이 브라우저에서 재생할 수 없어요.',
  100: '삭제되었거나 비공개인 영상이에요.',
  101: '영상 주인이 다른 사이트에서 재생을 막아 두었어요. 아래 "YouTube 에서 보기"를 눌러 주세요.',
  150: '영상 주인이 다른 사이트에서 재생을 막아 두었어요. 아래 "YouTube 에서 보기"를 눌러 주세요.',
};

export const YouTubeVideo = forwardRef<PlayerHandle, PlayerEvents & { videoId: string }>(function YouTubeVideo(
  { videoId, onReady, onTick, onPause, onError },
  ref,
) {
  const box = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const events = useRef({ onReady, onTick, onPause, onError });
  events.current = { onReady, onTick, onPause, onError };

  useImperativeHandle(ref, () => ({
    currentTime: () => player.current?.getCurrentTime?.() ?? 0,
    duration: () => player.current?.getDuration?.() ?? 0,
    seek: (s, play) => {
      player.current?.seekTo(s, true);
      if (play) player.current?.playVideo();
    },
    setRate: (r) => player.current?.setPlaybackRate?.(r),
  }));

  useEffect(() => {
    let alive = true;
    let timer = 0;
    const root = box.current;
    const host = document.createElement('div');
    root?.appendChild(host);
    loadYouTubeApi()
      .then(() => {
        if (!alive || !window.YT) return;
        player.current = new window.YT.Player(host, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: () => events.current.onReady?.(player.current?.getDuration() ?? 0),
            onStateChange: (e: { data: number }) => {
              window.clearInterval(timer);
              if (e.data === 1) {
                // 재생 중
                timer = window.setInterval(() => {
                  const p = player.current;
                  if (p) events.current.onTick?.(p.getCurrentTime(), p.getDuration());
                }, 1000);
              } else if (e.data === 2 || e.data === 0) events.current.onPause?.();
            },
            onError: (e: { data: number }) => events.current.onError?.(YT_ERRORS[e.data] ?? `YouTube 오류 (${e.data})`),
          },
        });
      })
      .catch((e: Error) => events.current.onError?.(e.message));
    return () => {
      alive = false;
      window.clearInterval(timer);
      player.current?.destroy();
      player.current = null;
      if (root) root.innerHTML = '';
    };
  }, [videoId]);

  return <div ref={box} className="aspect-video w-full overflow-hidden rounded-2xl bg-ink [&>*]:h-full [&>*]:w-full" />;
});

export function fmtTime(s: number): string {
  const t = Math.max(0, Math.floor(s));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
