import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, Dimensions, FlatList, ViewToken, Animated as RNAnimated, Linking, Share } from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import YoutubePlayer from 'react-native-youtube-iframe';
import type { ContentItem } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { PlaceholderThumbnail } from './PlaceholderThumbnail';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const REEL_HEIGHT = SCREEN_HEIGHT;

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface ReelPlayerProps {
  items: ContentItem[];
}

function ReelOverlay({ item }: { item: ContentItem }) {
  const { likedIds, savedIds, toggleLike, toggleSave, interests, markViewed } = useAppStore();
  const isLiked = likedIds.has(item.id);
  const isSaved = savedIds.has(item.id);
  const interestData = interests.filter((i) => item.interestIds.includes(i.id));

  const handleLike = () => {
    toggleLike(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSave = () => {
    toggleSave(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="absolute inset-0" style={{ height: REEL_HEIGHT }} pointerEvents="box-none">
      {/* Right side action buttons */}
      <View className="absolute right-4 bottom-36 items-center gap-6">
        <Pressable onPress={handleLike} className="items-center">
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={32}
            color={isLiked ? '#ef4444' : '#fff'}
          />
          <Text className="text-white text-xs mt-1">Like</Text>
        </Pressable>

        <Pressable onPress={handleSave} className="items-center">
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={28}
            color={isSaved ? '#f59e0b' : '#fff'}
          />
          <Text className="text-white text-xs mt-1">Save</Text>
        </Pressable>

        <Pressable className="items-center" onPress={() => {
          if (item.url) Share.share({ message: `${item.title}\n${item.url}` });
        }}>
          <Ionicons name="share-outline" size={28} color="#fff" />
          <Text className="text-white text-xs mt-1">Share</Text>
        </Pressable>

        <Pressable className="items-center" onPress={() => {
          if (item.url) Linking.openURL(item.url);
        }}>
          <Ionicons name="open-outline" size={28} color="#fff" />
          <Text className="text-white text-xs mt-1">Open</Text>
        </Pressable>
      </View>

      {/* Bottom content info */}
      <View className="absolute bottom-28 left-4 right-20">
        {/* Interest tags */}
        <View className="flex-row flex-wrap mb-2">
          {interestData.map((interest) => (
            <View
              key={interest.id}
              className="px-2 py-0.5 rounded-full mr-2 mb-1"
              style={{ backgroundColor: `${interest.color}88` }}
            >
              <Text className="text-white text-xs font-semibold">{interest.name}</Text>
            </View>
          ))}
          <View className="px-2 py-0.5 rounded-full bg-white/20">
            <Text className="text-white text-xs font-semibold capitalize">{item.level}</Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-white text-lg font-bold mb-1" numberOfLines={2}>
          {item.title}
        </Text>

        {/* Author & source */}
        <View className="flex-row items-center">
          <Text className="text-white/70 text-sm">{item.author}</Text>
          <Text className="text-white/40 text-sm mx-2">·</Text>
          <Text className="text-white/50 text-xs capitalize">{item.source}</Text>
        </View>

        {/* Description */}
        <Text className="text-white/60 text-sm mt-1" numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}

export function ReelPlayer({ items }: ReelPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { toggleLike, markViewed } = useAppStore();
  const lastTap = useRef(0);
  const heartAnim = useRef(new RNAnimated.Value(0)).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
        // Mark as viewed
        const item = items[viewableItems[0].index];
        if (item) markViewed(item.id);
      }
    },
    [items, markViewed]
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Double-tap to like
  const handleTap = useCallback(
    (item: ContentItem) => {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Double tap — like
        toggleLike(item.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Animate heart
        heartAnim.setValue(1);
        RNAnimated.sequence([
          RNAnimated.timing(heartAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
          RNAnimated.timing(heartAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      }
      lastTap.current = now;
    },
    [toggleLike, heartAnim]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ContentItem; index: number }) => {
      const isActive = index === activeIndex;
      const ytId = item.source === 'youtube' ? extractYouTubeId(item.url) : null;

      return (
        <Pressable onPress={() => handleTap(item)}>
          <View style={{ width: SCREEN_WIDTH, height: REEL_HEIGHT }} className="bg-black relative">
            {/* Video player for YouTube, thumbnail for others */}
            {ytId && isActive ? (
              <View className="absolute inset-0" style={{ top: REEL_HEIGHT * 0.15 }}>
                <YoutubePlayer
                  height={SCREEN_WIDTH * (16 / 9) * 0.55}
                  width={SCREEN_WIDTH}
                  videoId={ytId}
                  play={isActive}
                  webViewProps={{
                    injectedJavaScript: `
                      document.body.style.backgroundColor = 'black';
                      true;
                    `,
                  }}
                />
              </View>
            ) : null}

            {/* Background thumbnail (shows when video isn't playing) */}
            {(!ytId || !isActive) && (
              item.thumbnailUrl ? (
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={{ width: SCREEN_WIDTH, height: REEL_HEIGHT }}
                  resizeMode="cover"
                />
              ) : (
                <PlaceholderThumbnail
                  source={item.source}
                  mediaType={item.mediaType}
                  title={item.title}
                  width={SCREEN_WIDTH}
                  height={REEL_HEIGHT}
                />
              )
            )}

            {/* Play hint for non-YouTube content */}
            {!ytId && isActive && (
              <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
                <Pressable onPress={() => { if (item.url) Linking.openURL(item.url); }}>
                  <View className="bg-black/40 rounded-full p-5">
                    <Ionicons name="open-outline" size={40} color="#fff" />
                  </View>
                </Pressable>
              </View>
            )}

            {/* Double-tap heart animation */}
            <RNAnimated.View
              className="absolute inset-0 items-center justify-center"
              pointerEvents="none"
              style={{ opacity: heartAnim, transform: [{ scale: heartAnim }] }}
            >
              <Ionicons name="heart" size={80} color="#ef4444" />
            </RNAnimated.View>

            <ReelOverlay item={item} />
          </View>
        </Pressable>
      );
    },
    [activeIndex, handleTap, heartAnim]
  );

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Ionicons name="videocam-off-outline" size={48} color="#6b7280" />
        <Text className="text-gray-500 text-lg mt-4">No reels available</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={REEL_HEIGHT}
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={(_, index) => ({
        length: REEL_HEIGHT,
        offset: REEL_HEIGHT * index,
        index,
      })}
    />
  );
}
