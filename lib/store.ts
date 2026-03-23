import { create } from 'zustand';
import type { ContentItem, Feed, Interest, SubInterest, UserProfile } from './types';
import { mockInterests, mockFeeds, mockContent } from './mock-data';

interface AppState {
  // User
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;

  // Interests
  interests: Interest[];
  subInterests: SubInterest[];
  setInterests: (interests: Interest[]) => void;
  setSubInterests: (subInterests: SubInterest[]) => void;

  // Feeds
  feeds: Feed[];
  activeFeedId: string | null;
  setFeeds: (feeds: Feed[]) => void;
  setActiveFeed: (id: string | null) => void;

  // Content
  feedContent: Record<string, ContentItem[]>;
  reelsContent: ContentItem[];
  setFeedContent: (feedId: string, items: ContentItem[]) => void;
  setReelsContent: (items: ContentItem[]) => void;

  // Interactions
  likedIds: Set<string>;
  savedIds: Set<string>;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;

  // Init with mock data
  initMockData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  interests: [],
  subInterests: [],
  setInterests: (interests) => set({ interests }),
  setSubInterests: (subInterests) => set({ subInterests }),

  feeds: [],
  activeFeedId: null,
  setFeeds: (feeds) => set({ feeds }),
  setActiveFeed: (id) => set({ activeFeedId: id }),

  feedContent: {},
  reelsContent: [],
  setFeedContent: (feedId, items) =>
    set((state) => ({
      feedContent: { ...state.feedContent, [feedId]: items },
    })),
  setReelsContent: (items) => set({ reelsContent: items }),

  likedIds: new Set(),
  savedIds: new Set(),
  toggleLike: (id) =>
    set((state) => {
      const next = new Set(state.likedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { likedIds: next };
    }),
  toggleSave: (id) =>
    set((state) => {
      const next = new Set(state.savedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { savedIds: next };
    }),

  initMockData: () =>
    set({
      interests: mockInterests,
      feeds: mockFeeds,
      feedContent: { all: mockContent },
      reelsContent: mockContent.filter((c) => c.mediaType === 'video' || c.mediaType === 'short'),
    }),
}));
