import type { ContentItem, Feed, ContentLevel } from '../types';

interface ScoredItem {
  item: ContentItem;
  score: number;
}

const LEVEL_WEIGHT: Record<ContentLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  research: 4,
};

/**
 * Smart feed algorithm that mixes, weights, deduplicates, and interleaves content.
 */
export function buildFeed(
  allContent: ContentItem[],
  feed: Feed,
  options: {
    viewedIds?: Set<string>;
    likedIds?: Set<string>;
    maxItems?: number;
  } = {}
): ContentItem[] {
  const { viewedIds = new Set(), likedIds = new Set(), maxItems = 50 } = options;

  if (feed.filters.length === 0) return allContent.slice(0, maxItems);

  // Score each content item against feed filters
  const scored: ScoredItem[] = [];

  for (const item of allContent) {
    let totalScore = 0;
    let matched = false;

    for (const filter of feed.filters) {
      if (!item.interestIds.includes(filter.interestId)) continue;

      const levelOk = !filter.levels?.length || filter.levels.includes(item.level);
      const focusOk = !filter.focuses?.length || filter.focuses.includes(item.focus);
      const mediaOk = !filter.mediaTypes?.length || filter.mediaTypes.includes(item.mediaType);

      if (!levelOk || !focusOk || !mediaOk) continue;

      matched = true;
      let score = filter.weight;

      // Freshness boost: newer content scores higher
      const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / 3600000;
      if (ageHours < 24) score *= 1.5;
      else if (ageHours < 72) score *= 1.2;
      else if (ageHours > 168) score *= 0.8;

      // Penalize already-viewed content
      if (viewedIds.has(item.id)) score *= 0.3;

      // Slight boost for liked-similar content type
      if (likedIds.size > 0) {
        // Could be expanded with collaborative filtering
        score *= 1.05;
      }

      totalScore += score;
    }

    if (matched) {
      scored.push({ item, score: totalScore });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  if (feed.shuffleMode) {
    // Weighted shuffle: higher scores are more likely to appear first
    // but not deterministic — adds serendipity
    weightedShuffle(scored);
  }

  // Interleave media types for variety
  const result = interleaveByMediaType(scored.map((s) => s.item));

  return result.slice(0, maxItems);
}

/**
 * Weighted Fisher-Yates shuffle: items with higher scores
 * tend to stay near the top but order is randomized.
 */
function weightedShuffle(items: ScoredItem[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    // Bias toward keeping high-score items early
    const maxJ = Math.min(i + 1, Math.max(3, Math.floor(i * 0.6)));
    const j = Math.floor(Math.random() * maxJ);
    [items[i], items[j]] = [items[j], items[i]];
  }
}

/**
 * Interleave content so the same media type doesn't appear
 * more than 3 times in a row.
 */
function interleaveByMediaType(items: ContentItem[]): ContentItem[] {
  if (items.length <= 3) return items;

  const result: ContentItem[] = [];
  const remaining = [...items];
  let consecutiveType = '';
  let consecutiveCount = 0;

  while (remaining.length > 0) {
    let picked = false;

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      if (item.mediaType === consecutiveType && consecutiveCount >= 3) {
        continue; // Skip to break up long runs
      }

      result.push(item);
      remaining.splice(i, 1);

      if (item.mediaType === consecutiveType) {
        consecutiveCount++;
      } else {
        consecutiveType = item.mediaType;
        consecutiveCount = 1;
      }

      picked = true;
      break;
    }

    // If nothing was picked (all remaining are same type), just take the first
    if (!picked && remaining.length > 0) {
      result.push(remaining.shift()!);
      consecutiveCount++;
    }
  }

  return result;
}

/**
 * Build a reels feed from video/short content across all interests.
 */
export function buildReelsFeed(
  allContent: ContentItem[],
  options: {
    viewedIds?: Set<string>;
    maxItems?: number;
  } = {}
): ContentItem[] {
  const { viewedIds = new Set(), maxItems = 30 } = options;

  const reels = allContent
    .filter((c) => c.mediaType === 'video' || c.mediaType === 'short')
    .map((item) => {
      let score = 1;
      // Prefer shorts for reels
      if (item.mediaType === 'short') score *= 1.5;
      // Prefer shorter videos
      if (item.duration && item.duration < 300) score *= 1.3;
      // Freshness
      const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / 3600000;
      if (ageHours < 48) score *= 1.3;
      // Penalize viewed
      if (viewedIds.has(item.id)) score *= 0.2;

      return { item, score };
    });

  // Weighted shuffle for reels
  weightedShuffle(reels);

  return reels.map((r) => r.item).slice(0, maxItems);
}
