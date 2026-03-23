import React, { useCallback } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { ContentItem } from '@/lib/types';
import { PostCard } from './PostCard';

interface FeedListProps {
  items: ContentItem[];
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
  onEndReached?: () => void;
}

export function FeedList({
  items,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
  onEndReached,
}: FeedListProps) {
  const renderItem = useCallback(
    ({ item }: { item: ContentItem }) => <PostCard item={item} />,
    []
  );

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-gray-500 text-lg text-center">
          No content yet. Configure your feeds to start discovering!
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      estimatedItemSize={350}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      ListHeaderComponent={ListHeaderComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#818cf8"
            colors={['#818cf8']}
          />
        ) : undefined
      }
    />
  );
}
