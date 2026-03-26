import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MediaType, ContentSource } from '@/lib/types';

const SOURCE_COLORS: Record<string, string> = {
  youtube: '#ef4444',
  reddit: '#f97316',
  arxiv: '#8b5cf6',
  rss: '#3b82f6',
  hackernews: '#f59e0b',
  podcast: '#ec4899',
  devto: '#10b981',
  wikipedia: '#6b7280',
};

const SOURCE_ICONS: Record<string, string> = {
  youtube: 'logo-youtube',
  reddit: 'logo-reddit',
  arxiv: 'flask',
  rss: 'newspaper',
  hackernews: 'logo-hackernews',
  podcast: 'headset',
  devto: 'code-slash',
  wikipedia: 'book',
};

const TYPE_ICONS: Record<string, string> = {
  video: 'videocam',
  article: 'document-text',
  paper: 'flask',
  discussion: 'chatbubbles',
  podcast: 'headset',
  short: 'flash',
};

interface PlaceholderThumbnailProps {
  source: string;
  mediaType: string;
  title: string;
  interestColor?: string;
  width: number;
  height: number;
}

export function PlaceholderThumbnail({
  source,
  mediaType,
  title,
  interestColor,
  width,
  height,
}: PlaceholderThumbnailProps) {
  const color = interestColor || SOURCE_COLORS[source] || '#818cf8';
  const icon = SOURCE_ICONS[source] || TYPE_ICONS[mediaType] || 'document';

  return (
    <View
      style={{ width, height, backgroundColor: `${color}15` }}
      className="items-center justify-center"
    >
      {/* Decorative background pattern */}
      <View className="absolute inset-0 overflow-hidden">
        <View
          className="absolute rounded-full opacity-10"
          style={{ width: width * 0.6, height: width * 0.6, backgroundColor: color, top: -width * 0.1, right: -width * 0.1 }}
        />
        <View
          className="absolute rounded-full opacity-5"
          style={{ width: width * 0.4, height: width * 0.4, backgroundColor: color, bottom: -width * 0.05, left: -width * 0.05 }}
        />
      </View>

      {/* Icon */}
      <View
        className="rounded-2xl items-center justify-center mb-3"
        style={{ width: 56, height: 56, backgroundColor: `${color}22` }}
      >
        <Ionicons name={icon as any} size={28} color={color} />
      </View>

      {/* Title preview */}
      <Text
        className="text-center font-semibold px-4"
        style={{ color, fontSize: 13, lineHeight: 18 }}
        numberOfLines={3}
      >
        {title}
      </Text>

      {/* Source badge */}
      <View
        className="absolute bottom-3 right-3 px-2 py-1 rounded-md"
        style={{ backgroundColor: `${color}33` }}
      >
        <Text style={{ color, fontSize: 10, fontWeight: '600' }} className="capitalize">
          {source}
        </Text>
      </View>
    </View>
  );
}
