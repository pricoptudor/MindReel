import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { FeedList } from '@/components/FeedList';
import { InterestPill } from '@/components/InterestPill';

export default function HomeScreen() {
  const router = useRouter();
  const { feeds, interests, activeFeedId, setActiveFeed, getContentForFeed } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeInterestFilter, setActiveInterestFilter] = useState<string | null>(null);

  const currentFeedId = activeFeedId || 'all';
  let items = getContentForFeed(currentFeedId);

  // Additional client-side interest filter
  if (activeInterestFilter) {
    items = items.filter((item) => item.interestIds.includes(activeInterestFilter));
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const FeedHeader = (
    <View className="mb-2">
      {/* App header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <Text className="text-brand-400 text-2xl font-bold">MindReel</Text>
        <View className="flex-row gap-4">
          <Pressable onPress={() => router.push('/interests/')} hitSlop={8}>
            <Ionicons name="compass-outline" size={24} color="#9ca3af" />
          </Pressable>
          <Pressable onPress={() => router.push('/feed-config/')} hitSlop={8}>
            <Ionicons name="options-outline" size={24} color="#9ca3af" />
          </Pressable>
        </View>
      </View>

      {/* Feed selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
      >
        {feeds.map((feed) => (
          <Pressable key={feed.id} onPress={() => { setActiveFeed(feed.id); setActiveInterestFilter(null); }} className="mr-2">
            <View
              className={`px-4 py-2 rounded-full border ${
                currentFeedId === feed.id
                  ? 'bg-brand-500 border-brand-500'
                  : 'bg-surface-card border-surface-border'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  currentFeedId === feed.id ? 'text-white' : 'text-gray-400'
                }`}
              >
                {feed.name}
              </Text>
            </View>
          </Pressable>
        ))}

        {/* Add feed button */}
        <Pressable onPress={() => router.push('/feed-config/edit')} className="mr-2">
          <View className="px-4 py-2 rounded-full border border-dashed border-surface-border items-center justify-center">
            <Ionicons name="add" size={18} color="#6b7280" />
          </View>
        </Pressable>
      </ScrollView>

      {/* Interest filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 4 }}
      >
        <Pressable onPress={() => setActiveInterestFilter(null)}>
          <View
            className={`px-3 py-1 rounded-full mr-2 border ${
              !activeInterestFilter ? 'bg-white/10 border-white/20' : 'border-surface-border'
            }`}
          >
            <Text className={`text-xs font-semibold ${!activeInterestFilter ? 'text-white' : 'text-gray-500'}`}>
              All
            </Text>
          </View>
        </Pressable>
        {interests.map((interest) => (
          <InterestPill
            key={interest.id}
            name={interest.name}
            color={interest.color}
            size="sm"
            selected={activeInterestFilter === interest.id}
            onPress={() =>
              setActiveInterestFilter(activeInterestFilter === interest.id ? null : interest.id)
            }
          />
        ))}
      </ScrollView>

      {/* Active filter info */}
      <View className="px-4 pt-1 pb-2">
        <Text className="text-gray-600 text-xs">
          {items.length} item{items.length !== 1 ? 's' : ''} in feed
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface-dark" edges={['top']}>
      <FeedList
        items={items}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListHeaderComponent={FeedHeader}
      />
    </SafeAreaView>
  );
}
