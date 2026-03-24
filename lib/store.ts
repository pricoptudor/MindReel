import { create } from 'zustand';
import type { ContentItem, Feed, FeedFilter, Interest, SubInterest, UserProfile } from './types';
import { mockInterests, mockFeeds, mockContent } from './mock-data';
import { buildFeed, buildReelsFeed } from './services/feed-algorithm';

interface AppState {
  // User
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;

  // Interests
  interests: Interest[];
  subInterests: SubInterest[];
  setInterests: (interests: Interest[]) => void;
  setSubInterests: (subInterests: SubInterest[]) => void;
  addInterest: (interest: Interest) => void;
  updateInterest: (interest: Interest) => void;
  removeInterest: (id: string) => void;
  addSubInterest: (sub: SubInterest) => void;
  updateSubInterest: (sub: SubInterest) => void;
  removeSubInterest: (id: string) => void;

  // Feeds
  feeds: Feed[];
  activeFeedId: string | null;
  setFeeds: (feeds: Feed[]) => void;
  setActiveFeed: (id: string | null) => void;
  addFeed: (feed: Feed) => void;
  updateFeed: (feed: Feed) => void;
  removeFeed: (id: string) => void;

  // Content
  feedContent: Record<string, ContentItem[]>;
  reelsContent: ContentItem[];
  setFeedContent: (feedId: string, items: ContentItem[]) => void;
  setReelsContent: (items: ContentItem[]) => void;

  // Interactions
  likedIds: Set<string>;
  savedIds: Set<string>;
  viewedIds: Set<string>;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  markViewed: (id: string) => void;

  // Feed content resolution
  getContentForFeed: (feedId: string) => ContentItem[];

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
  addInterest: (interest) =>
    set((s) => ({ interests: [...s.interests, interest] })),
  updateInterest: (interest) =>
    set((s) => ({
      interests: s.interests.map((i) => (i.id === interest.id ? interest : i)),
    })),
  removeInterest: (id) =>
    set((s) => ({
      interests: s.interests.filter((i) => i.id !== id),
      subInterests: s.subInterests.filter((si) => si.interestId !== id),
    })),
  addSubInterest: (sub) =>
    set((s) => ({ subInterests: [...s.subInterests, sub] })),
  updateSubInterest: (sub) =>
    set((s) => ({
      subInterests: s.subInterests.map((si) => (si.id === sub.id ? sub : si)),
    })),
  removeSubInterest: (id) =>
    set((s) => ({
      subInterests: s.subInterests.filter((si) => si.id !== id),
    })),

  feeds: [],
  activeFeedId: null,
  setFeeds: (feeds) => set({ feeds }),
  setActiveFeed: (id) => set({ activeFeedId: id }),
  addFeed: (feed) => set((s) => ({ feeds: [...s.feeds, feed] })),
  updateFeed: (feed) =>
    set((s) => ({
      feeds: s.feeds.map((f) => (f.id === feed.id ? feed : f)),
    })),
  removeFeed: (id) =>
    set((s) => ({
      feeds: s.feeds.filter((f) => f.id !== id),
      activeFeedId: s.activeFeedId === id ? null : s.activeFeedId,
    })),

  feedContent: {},
  reelsContent: [],
  setFeedContent: (feedId, items) =>
    set((state) => ({
      feedContent: { ...state.feedContent, [feedId]: items },
    })),
  setReelsContent: (items) => set({ reelsContent: items }),

  likedIds: new Set(),
  savedIds: new Set(),
  viewedIds: new Set(),
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
  markViewed: (id) =>
    set((state) => {
      const next = new Set(state.viewedIds);
      next.add(id);
      return { viewedIds: next };
    }),

  getContentForFeed: (feedId) => {
    const state = get();
    const feed = state.feeds.find((f) => f.id === feedId);
    const allContent = state.feedContent['all'] || [];
    if (!feed) return allContent;
    return buildFeed(allContent, feed, {
      viewedIds: state.viewedIds,
      likedIds: state.likedIds,
    });
  },

  initMockData: () =>
    set((state) => {
      const reels = buildReelsFeed(mockContent, { viewedIds: state.viewedIds });
      return {
        interests: mockInterests,
        feeds: mockFeeds,
        feedContent: { all: mockContent },
        reelsContent: reels,
      };
    }),
}));
