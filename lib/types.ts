export type MediaType = 'video' | 'article' | 'paper' | 'discussion' | 'podcast' | 'short';
export type ContentLevel = 'beginner' | 'intermediate' | 'advanced' | 'research';
export type ContentFocus = 'applied' | 'theoretical' | 'tutorial' | 'news' | 'entertainment';
export type ContentSource = 'youtube' | 'reddit' | 'arxiv' | 'rss' | 'hackernews' | 'podcast' | 'devto' | 'wikipedia';
export type InteractionType = 'view' | 'like' | 'save' | 'skip' | 'share';

export const ALL_LEVELS: ContentLevel[] = ['beginner', 'intermediate', 'advanced', 'research'];
export const ALL_FOCUSES: ContentFocus[] = ['applied', 'theoretical', 'tutorial', 'news', 'entertainment'];
export const ALL_MEDIA_TYPES: MediaType[] = ['video', 'article', 'paper', 'discussion', 'podcast', 'short'];

export const LEVEL_COLORS: Record<ContentLevel, string> = {
  beginner: '#10b981',
  intermediate: '#3b82f6',
  advanced: '#f59e0b',
  research: '#ef4444',
};

export const FOCUS_COLORS: Record<ContentFocus, string> = {
  applied: '#06b6d4',
  theoretical: '#8b5cf6',
  tutorial: '#10b981',
  news: '#f59e0b',
  entertainment: '#ec4899',
};

export const MEDIA_ICONS: Record<MediaType, string> = {
  video: 'videocam',
  article: 'document-text',
  paper: 'flask',
  discussion: 'chatbubbles',
  podcast: 'headset',
  short: 'flash',
};

// Curated icon options for interests
export const INTEREST_ICONS = [
  'atom', 'brain', 'web', 'musical-notes', 'telescope', 'trending-up',
  'code-slash', 'flask', 'book', 'globe', 'rocket', 'bulb',
  'school', 'fitness', 'heart', 'star', 'diamond', 'leaf',
  'color-palette', 'camera', 'game-controller', 'calculator',
  'newspaper', 'people', 'pizza', 'airplane', 'medkit', 'construct',
];

// Curated color options for interests
export const INTEREST_COLORS = [
  '#818cf8', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#f97316',
  '#ef4444', '#8b5cf6', '#3b82f6', '#14b8a6', '#a855f7', '#d946ef',
  '#64748b', '#e11d48', '#0ea5e9', '#84cc16',
];

export interface Interest {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export interface SubInterest {
  id: string;
  interestId: string;
  name: string;
  description?: string;
}

export interface FeedFilter {
  interestId: string;
  subInterestIds?: string[];
  levels?: ContentLevel[];
  focuses?: ContentFocus[];
  mediaTypes?: MediaType[];
  weight: number;
}

export interface Feed {
  id: string;
  userId: string;
  name: string;
  icon: string;
  isCombined: boolean;
  shuffleMode: boolean;
  filters: FeedFilter[];
}

export interface ContentItem {
  id: string;
  source: ContentSource;
  sourceId: string;
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  mediaType: MediaType;
  duration?: number;
  author: string;
  publishedAt: string;
  fetchedAt: string;
  interestIds: string[];
  level: ContentLevel;
  focus: ContentFocus;
}

export interface UserInteraction {
  userId: string;
  contentId: string;
  action: InteractionType;
  watchDuration?: number;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  interests: string[];
  createdAt: string;
}
