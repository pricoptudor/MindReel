import React from 'react';
import { View, Text, Image, Pressable, Dimensions, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import type { ContentItem, MediaType } from '@/lib/types';
import { InterestPill } from './InterestPill';
import { PlaceholderThumbnail } from './PlaceholderThumbnail';
import { useAppStore } from '@/lib/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SOURCE_ICONS: Record<string, string> = {
  youtube: 'logo-youtube',
  reddit: 'logo-reddit',
  arxiv: 'document-text',
  rss: 'newspaper',
  hackernews: 'logo-hackernews',
  podcast: 'headset',
  devto: 'code-slash',
  wikipedia: 'book',
};

const MEDIA_LABELS: Record<MediaType, { label: string; color: string }> = {
  video: { label: '▶ Video', color: '#ef4444' },
  short: { label: '⚡ Short', color: '#f59e0b' },
  article: { label: '📄 Article', color: '#3b82f6' },
  paper: { label: '🔬 Paper', color: '#8b5cf6' },
  discussion: { label: '💬 Discussion', color: '#10b981' },
  podcast: { label: '🎧 Podcast', color: '#ec4899' },
};

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

interface PostCardProps {
  item: ContentItem;
  onPress?: () => void;
}

export function PostCard({ item, onPress }: PostCardProps) {
  const { likedIds, savedIds, toggleLike, toggleSave, interests, markViewed } = useAppStore();
  const isLiked = likedIds.has(item.id);
  const isSaved = savedIds.has(item.id);
  const mediaInfo = MEDIA_LABELS[item.mediaType];
  const interestData = interests.filter((i) => item.interestIds.includes(i.id));

  const handleLike = () => {
    toggleLike(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSave = () => {
    toggleSave(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePress = () => {
    markViewed(item.id);
    if (item.url) {
      WebBrowser.openBrowserAsync(item.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    }
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      <View className="bg-surface-card rounded-2xl mx-3 mb-4 overflow-hidden border border-surface-border">
        {/* Thumbnail */}
        <View className="relative">
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              className="w-full"
              style={{ height: SCREEN_WIDTH * 0.56 }}
              resizeMode="cover"
            />
          ) : (
            <PlaceholderThumbnail
              source={item.source}
              mediaType={item.mediaType}
              title={item.title}
              interestColor={interestData[0]?.color}
              width={SCREEN_WIDTH - 24}
              height={SCREEN_WIDTH * 0.56}
            />
          )}
          {/* Media type badge */}
          <View
            className="absolute top-3 left-3 px-2 py-1 rounded-md"
            style={{ backgroundColor: `${mediaInfo.color}dd` }}
          >
            <Text className="text-white text-xs font-bold">{mediaInfo.label}</Text>
          </View>
          {/* Duration */}
          {item.duration && (
            <View className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded-md">
              <Text className="text-white text-xs font-mono">{formatDuration(item.duration)}</Text>
            </View>
          )}
          {/* Level badge */}
          <View className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-md">
            <Text className="text-white text-xs font-semibold capitalize">{item.level}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Interest pills */}
          <View className="flex-row flex-wrap mb-2">
            {interestData.map((interest) => (
              <InterestPill key={interest.id} name={interest.name} color={interest.color} size="sm" />
            ))}
          </View>

          {/* Title */}
          <Text className="text-white text-base font-bold leading-5 mb-1.5" numberOfLines={2}>
            {item.title}
          </Text>

          {/* Description */}
          <Text className="text-gray-400 text-sm leading-5 mb-3" numberOfLines={2}>
            {item.description}
          </Text>

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons
                name={SOURCE_ICONS[item.source] as any || 'globe'}
                size={14}
                color="#9ca3af"
              />
              <Text className="text-gray-500 text-xs ml-1.5" numberOfLines={1}>
                {item.author}
              </Text>
              <Text className="text-gray-600 text-xs mx-1.5">·</Text>
              <Text className="text-gray-500 text-xs">{timeAgo(item.publishedAt)}</Text>
            </View>

            {/* Actions */}
            <View className="flex-row items-center gap-4">
              <Pressable onPress={handleLike} hitSlop={8}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isLiked ? '#ef4444' : '#9ca3af'}
                />
              </Pressable>
              <Pressable onPress={handleSave} hitSlop={8}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isSaved ? '#f59e0b' : '#9ca3af'}
                />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => {
                if (item.url) Share.share({ message: `${item.title}\n${item.url}` });
              }}>
                <Ionicons name="share-outline" size={20} color="#9ca3af" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
