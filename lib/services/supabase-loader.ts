/**
 * Fetches real content from Supabase for use in the app.
 * Falls back to mock data if Supabase is not configured or fails.
 */
import { supabase } from '../supabase';
import type { ContentItem, Interest, Feed, SubInterest } from '../types';

const SUPABASE_CONFIGURED =
  !supabase.supabaseUrl.includes('your-project') &&
  supabase.supabaseUrl.includes('supabase.co');

export async function fetchRealInterests(): Promise<Interest[] | null> {
  if (!SUPABASE_CONFIGURED) return null;
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('sort_order');
    if (error || !data?.length) return null;
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      color: r.color,
      description: r.description,
    }));
  } catch {
    return null;
  }
}

export async function fetchRealFeeds(): Promise<Feed[] | null> {
  if (!SUPABASE_CONFIGURED) return null;
  try {
    const { data, error } = await supabase
      .from('feeds')
      .select('*, feed_filters(*)')
      .order('sort_order');
    if (error || !data?.length) return null;
    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      icon: r.icon,
      isCombined: r.is_combined,
      shuffleMode: r.shuffle_mode,
      filters: (r.feed_filters || []).map((f: any) => ({
        interestId: f.interest_id,
        subInterestIds: f.sub_interest_ids || [],
        levels: f.levels || [],
        focuses: f.focuses || [],
        mediaTypes: f.media_types || [],
        weight: f.weight,
      })),
    }));
  } catch {
    return null;
  }
}

export async function fetchRealContent(): Promise<ContentItem[] | null> {
  if (!SUPABASE_CONFIGURED) return null;
  try {
    // Use the feed_content view that joins content_items with content_tags
    const { data, error } = await supabase
      .from('feed_content')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100);

    if (error || !data?.length) return null;

    // Group by content id (one item may have multiple tags/interests)
    const map = new Map<string, ContentItem>();
    for (const row of data) {
      if (!map.has(row.id)) {
        map.set(row.id, {
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
          publishedAt: row.published_at || new Date().toISOString(),
          fetchedAt: row.fetched_at,
          interestIds: [row.interest_id],
          level: row.level,
          focus: row.focus,
        });
      } else {
        const existing = map.get(row.id)!;
        if (!existing.interestIds.includes(row.interest_id)) {
          existing.interestIds.push(row.interest_id);
        }
      }
    }

    return Array.from(map.values());
  } catch {
    return null;
  }
}
