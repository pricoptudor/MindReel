export type MediaType = 'video' | 'article' | 'paper' | 'discussion' | 'podcast' | 'short';
export type ContentLevel = 'beginner' | 'intermediate' | 'advanced' | 'research';
export type ContentFocus = 'applied' | 'theoretical' | 'tutorial' | 'news' | 'entertainment';
export type ContentSource = 'youtube' | 'reddit' | 'arxiv' | 'rss' | 'hackernews' | 'podcast' | 'devto' | 'wikipedia';
export type InteractionType = 'view' | 'like' | 'save' | 'skip' | 'share';

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
