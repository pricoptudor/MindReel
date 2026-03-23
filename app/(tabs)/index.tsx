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
  const { feeds, interests, feedContent, activeFeedId, setActiveFeed } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const currentFeedId = activeFeedId || 'all';
  const items = feedContent[currentFeedId] || feedContent['all'] || [];

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
          <Pressable hitSlop={8}>
            <Ionicons name="search-outline" size={24} color="#9ca3af" />
          </Pressable>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={24} color="#9ca3af" />
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
          <Pressable key={feed.id} onPress={() => setActiveFeed(feed.id)} className="mr-2">
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
        <Pressable className="mr-2">
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
        {interests.map((interest) => (
          <InterestPill key={interest.id} name={interest.name} color={interest.color} size="sm" />
        ))}
      </ScrollView>
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
