import { supabase } from '../supabase';
import type {
  Interest,
  SubInterest,
  Feed,
  FeedFilter,
  ContentItem,
  ContentLevel,
  ContentFocus,
  MediaType,
  InteractionType,
} from '../types';

// ============================================================
// INTERESTS
// ============================================================

export async function fetchInterests(): Promise<Interest[]> {
  const { data, error } = await supabase
    .from('interests')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    description: row.description,
  }));
}

export async function upsertInterest(interest: Interest): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('interests').upsert({
    id: interest.id,
    user_id: user.id,
    name: interest.name,
    icon: interest.icon,
    color: interest.color,
    description: interest.description || null,
  });
  if (error) throw error;
}

export async function deleteInterest(id: string): Promise<void> {
  const { error } = await supabase.from('interests').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// SUB-INTERESTS
// ============================================================

export async function fetchSubInterests(interestId?: string): Promise<SubInterest[]> {
  let query = supabase.from('sub_interests').select('*').order('sort_order');
  if (interestId) query = query.eq('interest_id', interestId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    interestId: row.interest_id,
    name: row.name,
    description: row.description,
  }));
}

export async function upsertSubInterest(sub: SubInterest): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('sub_interests').upsert({
    id: sub.id,
    interest_id: sub.interestId,
    user_id: user.id,
    name: sub.name,
    description: sub.description || null,
  });
  if (error) throw error;
}

export async function deleteSubInterest(id: string): Promise<void> {
  const { error } = await supabase.from('sub_interests').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// FEEDS
// ============================================================

export async function fetchFeeds(): Promise<Feed[]> {
  const { data, error } = await supabase
    .from('feeds')
    .select(`
      *,
      feed_filters (*)
    `)
    .order('sort_order');
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    isCombined: row.is_combined,
    shuffleMode: row.shuffle_mode,
    filters: (row.feed_filters || []).map((f: any) => ({
      interestId: f.interest_id,
      subInterestIds: f.sub_interest_ids || [],
      levels: f.levels || [],
      focuses: f.focuses || [],
      mediaTypes: f.media_types || [],
      weight: f.weight,
    })),
  }));
}

export async function upsertFeed(feed: Feed): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Upsert the feed itself
  const { error: feedErr } = await supabase.from('feeds').upsert({
    id: feed.id,
    user_id: user.id,
    name: feed.name,
    icon: feed.icon,
    is_combined: feed.isCombined,
    shuffle_mode: feed.shuffleMode,
  });
  if (feedErr) throw feedErr;

  // Replace filters: delete existing, insert new
  await supabase.from('feed_filters').delete().eq('feed_id', feed.id);

  if (feed.filters.length > 0) {
    const { error: filterErr } = await supabase.from('feed_filters').insert(
      feed.filters.map((f) => ({
        feed_id: feed.id,
        interest_id: f.interestId,
        sub_interest_ids: f.subInterestIds || [],
        levels: f.levels || ['beginner', 'intermediate', 'advanced', 'research'],
        focuses: f.focuses || ['applied', 'theoretical', 'tutorial', 'news', 'entertainment'],
        media_types: f.mediaTypes || ['video', 'article', 'paper', 'discussion', 'podcast', 'short'],
        weight: f.weight,
      }))
    );
    if (filterErr) throw filterErr;
  }
}

export async function deleteFeed(id: string): Promise<void> {
  const { error } = await supabase.from('feeds').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// CONTENT ITEMS (feed queries)
// ============================================================

interface FetchContentOptions {
  feedId?: string;
  interestIds?: string[];
  levels?: ContentLevel[];
  focuses?: ContentFocus[];
  mediaTypes?: MediaType[];
  limit?: number;
  offset?: number;
}

export async function fetchFeedContent(options: FetchContentOptions = {}): Promise<ContentItem[]> {
  const { interestIds, levels, focuses, mediaTypes, limit = 20, offset = 0 } = options;

  let query = supabase
    .from('feed_content')
    .select('*')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (interestIds && interestIds.length > 0) {
    query = query.in('interest_id', interestIds);
  }
  if (levels && levels.length > 0) {
    query = query.in('level', levels);
  }
  if (focuses && focuses.length > 0) {
    query = query.in('focus', focuses);
  }
  if (mediaTypes && mediaTypes.length > 0) {
    query = query.in('media_type', mediaTypes);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Group by content_id to merge tags
  const contentMap = new Map<string, ContentItem>();
  for (const row of data || []) {
    if (!contentMap.has(row.id)) {
      contentMap.set(row.id, {
        id: row.id,
        source: row.source_type,
        sourceId: row.source_id,
        url: row.url,
        title: row.title,
        description: row.description || '',
        thumbnailUrl: row.thumbnail_url || '',
        mediaType: row.media_type,
        duration: row.duration,
        author: row.author || '',
        publishedAt: row.published_at,
        fetchedAt: row.fetched_at,
        interestIds: [row.interest_id],
        level: row.level,
        focus: row.focus,
      });
    } else {
      const existing = contentMap.get(row.id)!;
      if (!existing.interestIds.includes(row.interest_id)) {
        existing.interestIds.push(row.interest_id);
      }
    }
  }

  return Array.from(contentMap.values());
}

export async function fetchReelsContent(limit = 20): Promise<ContentItem[]> {
  return fetchFeedContent({
    mediaTypes: ['video', 'short'],
    limit,
  });
}

// ============================================================
// USER INTERACTIONS
// ============================================================

export async function recordInteraction(
  contentId: string,
  action: InteractionType,
  watchDuration?: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('user_interactions').insert({
    user_id: user.id,
    content_id: contentId,
    action,
    watch_duration: watchDuration,
  });
  if (error) console.warn('Failed to record interaction:', error);
}

export async function fetchLikedIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_interactions')
    .select('content_id')
    .eq('action', 'like');
  return new Set((data || []).map((r: any) => r.content_id));
}

export async function fetchSavedIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_interactions')
    .select('content_id')
    .eq('action', 'save');
  return new Set((data || []).map((r: any) => r.content_id));
}
