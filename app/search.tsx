import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, TextInput, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAppStore } from '@/lib/store';
import type { ContentItem } from '@/lib/types';
import { PostCard } from '@/components/PostCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const { feedContent, interests } = useAppStore();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ContentItem[]>([]);
  const allContent = feedContent['all'] || [];

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.trim().length < 2) {
        setResults([]);
        return;
      }

      const q = text.toLowerCase();
      const matched = allContent.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.interestIds.some((id) => {
            const interest = interests.find((i) => i.id === id);
            return interest?.name.toLowerCase().includes(q);
          })
      );
      setResults(matched);
    },
    [allContent, interests]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Search',
          headerShown: true,
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
        }}
      />
      <SafeAreaView className="flex-1 bg-surface-dark" edges={['bottom']}>
        {/* Search bar */}
        <View className="px-4 pt-2 pb-4">
          <View className="flex-row items-center bg-surface-card border border-surface-border rounded-xl px-4">
            <Ionicons name="search" size={18} color="#6b7280" />
            <TextInput
              className="flex-1 text-white text-base py-3 ml-3"
              placeholder="Search content, topics, authors..."
              placeholderTextColor="#4b5563"
              value={query}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => handleSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="#4b5563" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Results */}
        {query.length >= 2 ? (
          results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PostCard item={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListHeaderComponent={
                <Text className="text-gray-500 text-xs px-4 pb-2">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </Text>
              }
            />
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <Ionicons name="search-outline" size={48} color="#4b5563" />
              <Text className="text-gray-500 text-lg mt-4">No results</Text>
              <Text className="text-gray-600 text-sm mt-1 text-center">
                Try different keywords or browse your feeds
              </Text>
            </View>
          )
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="search" size={48} color="#2a2a3d" />
            <Text className="text-gray-600 text-sm mt-4 text-center">
              Search across all your feeds and content
            </Text>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}
