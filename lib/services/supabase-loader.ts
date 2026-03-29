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
    // Fetch content items and tags separately for reliability
    const { data: items, error: itemsErr } = await supabase
      .from('content_items')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(200);

    if (itemsErr || !items?.length) return null;

    const { data: tags } = await supabase
      .from('content_tags')
      .select('content_id, interest_id, level, focus');

    // Build interest map per content
    const tagMap = new Map<string, { interestIds: string[]; level: string; focus: string }>();
    for (const tag of tags || []) {
      if (!tagMap.has(tag.content_id)) {
        tagMap.set(tag.content_id, { interestIds: [tag.interest_id], level: tag.level, focus: tag.focus });
      } else {
        const entry = tagMap.get(tag.content_id)!;
        if (!entry.interestIds.includes(tag.interest_id)) {
          entry.interestIds.push(tag.interest_id);
        }
      }
    }

    return items
      .filter((row: any) => tagMap.has(row.id))
      .map((row: any) => {
        const t = tagMap.get(row.id)!;
        return {
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
          interestIds: t.interestIds,
          level: t.level as any,
          focus: t.focus as any,
        };
      });
  } catch {
    return null;
  }
}
