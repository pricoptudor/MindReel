import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { InterestPill } from '@/components/InterestPill';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

export default function ExploreScreen() {
  const router = useRouter();
  const { interests, feedContent } = useAppStore();
  const allContent = feedContent['all'] || [];

  return (
    <SafeAreaView className="flex-1 bg-surface-dark" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-2 pb-4">
          <Text className="text-white text-2xl font-bold mb-1">Explore</Text>
          <Text className="text-gray-500 text-sm">Discover new topics and content</Text>
        </View>

        {/* Search bar */}
        <Pressable className="mx-4 mb-6" onPress={() => router.push('/search')}>
          <View className="flex-row items-center bg-surface-card border border-surface-border rounded-xl px-4 py-3">
            <Ionicons name="search" size={18} color="#6b7280" />
            <Text className="text-gray-500 ml-3 text-sm">Search topics, content, sources...</Text>
          </View>
        </Pressable>

        {/* Your Interests */}
        <View className="mb-6">
          <Text className="text-white text-lg font-bold px-4 mb-3">Your Interests</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {interests.map((interest) => (
              <Pressable key={interest.id} className="mr-3" onPress={() => router.push(`/interests/${interest.id}`)}>
                <View
                  className="rounded-2xl p-4 items-center justify-center"
                  style={{
                    width: 100,
                    height: 100,
                    backgroundColor: `${interest.color}22`,
                    borderWidth: 1,
                    borderColor: `${interest.color}44`,
                  }}
                >
                  <Ionicons name={(interest.icon as any) || 'star'} size={28} color={interest.color} />
                  <Text className="text-white text-xs font-semibold mt-2 text-center" numberOfLines={1}>
                    {interest.name}
                  </Text>
                </View>
              </Pressable>
            ))}

            {/* Add interest */}
            <Pressable onPress={() => router.push('/interests/edit')}>
              <View className="rounded-2xl p-4 items-center justify-center border border-dashed border-surface-border" style={{ width: 100, height: 100 }}>
                <Ionicons name="add-circle-outline" size={28} color="#6b7280" />
                <Text className="text-gray-500 text-xs mt-2">Add New</Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>

        {/* Trending content per interest */}
        {interests.slice(0, 3).map((interest) => {
          const interestContent = allContent.filter((c) => c.interestIds.includes(interest.id));
          if (interestContent.length === 0) return null;

          return (
            <View key={interest.id} className="mb-6">
              <View className="flex-row items-center justify-between px-4 mb-3">
                <View className="flex-row items-center">
                  <View
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: interest.color }}
                  />
                  <Text className="text-white text-lg font-bold">{interest.name}</Text>
                </View>
                <Pressable onPress={() => router.push(`/feed/${interest.id}`)}>
                  <Text className="text-brand-400 text-sm">See all</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {interestContent.map((item) => (
                  <Pressable key={item.id} className="mr-3" onPress={() => { if (item.url) Linking.openURL(item.url); }}>
                    <View className="rounded-xl overflow-hidden bg-surface-card border border-surface-border" style={{ width: CARD_WIDTH }}>
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={{ width: CARD_WIDTH, height: CARD_WIDTH * 1.2 }}
                        resizeMode="cover"
                      />
                      <View className="p-2.5">
                        <Text className="text-white text-xs font-semibold" numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1 capitalize">
                          {item.mediaType} · {item.level}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          );
        })}

        {/* Bottom spacing */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
