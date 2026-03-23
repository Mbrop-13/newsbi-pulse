import { create } from "zustand";

export interface AudioTrack {
  id: string;
  title: string;
  summary: string;
  enriched_content?: string;
  category: string;
  image_url?: string;
  slug?: string;
  audioUrl?: string;
  isLoading?: boolean;
}

type PlayerMode = "full" | "mini" | "pinned" | "closed";

interface AudioPlayerState {
  // Mode
  mode: PlayerMode;
  setMode: (mode: PlayerMode) => void;
  
  // Mini player position
  miniPosition: { x: number; y: number };
  setMiniPosition: (pos: { x: number; y: number }) => void;
  
  // Pinned width
  pinnedWidth: number;
  setPinnedWidth: (w: number) => void;

  // Playlist
  tracks: AudioTrack[];
  setTracks: (tracks: AudioTrack[]) => void;
  
  // Category filter
  activeCategory: string;
  setActiveCategory: (cat: string) => void;

  // Read mode
  readMode: "summary" | "full";
  toggleReadMode: () => void;

  // Playback
  currentIndex: number;
  isPlaying: boolean;
  playbackRate: number;
  progress: number;
  duration: number;
  currentTime: number;
  volume: number;

  // Actions
  play: (index?: number) => void;
  playArticle: (article: Omit<AudioTrack, "audioUrl" | "isLoading">) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setPlaybackRate: (rate: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setTrackAudioUrl: (id: string, url: string) => void;
  setTrackLoading: (id: string, loading: boolean) => void;
  
  // Compat
  isOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  mode: "closed",
  setMode: (mode) => set({ mode }),
  
  miniPosition: { x: 20, y: -100 },
  setMiniPosition: (pos) => set({ miniPosition: pos }),
  
  pinnedWidth: 380,
  setPinnedWidth: (w) => set({ pinnedWidth: Math.max(320, Math.min(500, w)) }),

  tracks: [],
  setTracks: (tracks) => set({ tracks }),

  activeCategory: "all",
  setActiveCategory: (cat) => set({ activeCategory: cat, currentIndex: 0 }),

  readMode: "summary",
  toggleReadMode: () => set((s) => ({ readMode: s.readMode === "summary" ? "full" : "summary" })),

  currentIndex: 0,
  isPlaying: false,
  playbackRate: 1,
  progress: 0,
  duration: 0,
  currentTime: 0,
  volume: 1,

  play: (index) => {
    if (index !== undefined) set({ currentIndex: index, isPlaying: true, progress: 0, currentTime: 0 });
    else set({ isPlaying: true });
  },
  playArticle: (article) => {
    const state = get();
    // Try to find the article in current tracks
    const index = state.tracks.findIndex(t => t.id === article.id);
    if (index !== -1) {
      set({ currentIndex: index, isPlaying: true, progress: 0, currentTime: 0, mode: "full" });
    } else {
      // Add and play as first track
      const newTracks = [article, ...state.tracks];
      set({ tracks: newTracks, currentIndex: 0, isPlaying: true, progress: 0, currentTime: 0, mode: "full" });
    }
  },
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  next: () => {
    const { currentIndex, tracks } = get();
    if (currentIndex < tracks.length - 1) set({ currentIndex: currentIndex + 1, isPlaying: true, progress: 0, currentTime: 0 });
  },
  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1, isPlaying: true, progress: 0, currentTime: 0 });
  },
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume }),
  setTrackAudioUrl: (id, url) =>
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, audioUrl: url, isLoading: false } : t)) })),
  setTrackLoading: (id, loading) =>
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, isLoading: loading } : t)) })),

  // Compat layer
  get isOpen() { return get().mode !== "closed"; },
  toggleSidebar: () => set((s) => ({ mode: s.mode === "closed" ? "full" : "closed" })),
  openSidebar: () => set({ mode: "full" }),
  closeSidebar: () => set({ mode: "closed" }),
}));
