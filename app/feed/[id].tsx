import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { FeedList } from '@/components/FeedList';

export default function FeedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { feeds, getContentForFeed } = useAppStore();

  const feed = feeds.find((f) => f.id === id);
  const items = getContentForFeed(id || 'all');

  return (
    <>
      <Stack.Screen
        options={{
          title: feed?.name || 'Feed',
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
        }}
      />
      <View className="flex-1 bg-surface-dark">
        <FeedList items={items} />
      </View>
    </>
  );
}
