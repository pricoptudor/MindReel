import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useAppStore } from '@/lib/store';

export default function FeedConfigListScreen() {
  const router = useRouter();
  const { feeds, interests, removeFeed } = useAppStore();

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Feed', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeFeed(id) },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Feeds',
          headerShown: true,
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
        }}
      />
      <SafeAreaView className="flex-1 bg-surface-dark" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {feeds.length === 0 ? (
            <View className="items-center py-16">
              <Ionicons name="layers-outline" size={48} color="#4b5563" />
              <Text className="text-gray-500 text-lg mt-4">No feeds yet</Text>
              <Text className="text-gray-600 text-sm mt-1">
                Create your first feed to curate content
              </Text>
            </View>
          ) : (
            feeds.map((feed) => {
              const filterInterests = feed.filters
                .map((f) => interests.find((i) => i.id === f.interestId))
                .filter(Boolean);

              return (
                <Pressable
                  key={feed.id}
                  onPress={() => router.push(`/feed-config/edit?id=${feed.id}`)}
                >
                  <View className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-xl bg-surface-elevated items-center justify-center mr-3">
                          <Ionicons name={(feed.icon as any) || 'layers'} size={20} color="#818cf8" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-base font-semibold">{feed.name}</Text>
                          <Text className="text-gray-500 text-xs mt-0.5">
                            {feed.isCombined ? 'Combined' : 'Single'} feed
                            {feed.shuffleMode ? ' · Shuffle on' : ''}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => handleDelete(feed.id, feed.name)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </Pressable>
                        <Ionicons name="chevron-forward" size={18} color="#4b5563" />
                      </View>
                    </View>

                    {/* Interest chips */}
                    <View className="flex-row flex-wrap mt-1">
                      {filterInterests.map((interest) => (
                        <View
                          key={interest!.id}
                          className="px-2 py-0.5 rounded-full mr-1.5 mb-1"
                          style={{ backgroundColor: `${interest!.color}22`, borderWidth: 1, borderColor: `${interest!.color}44` }}
                        >
                          <Text style={{ color: interest!.color }} className="text-xs font-medium">
                            {interest!.name}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Filter summary */}
                    {feed.filters.some((f) => f.levels && f.levels.length > 0 && f.levels.length < 4) && (
                      <Text className="text-gray-600 text-xs mt-2">
                        Levels: {feed.filters.flatMap((f) => f.levels || []).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        {/* Add button */}
        <View className="px-4 pb-4">
          <Pressable onPress={() => router.push('/feed-config/edit')}>
            <View className="bg-brand-500 rounded-2xl py-4 items-center flex-row justify-center">
              <Ionicons name="add" size={22} color="#fff" />
              <Text className="text-white text-base font-semibold ml-2">Create Feed</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
