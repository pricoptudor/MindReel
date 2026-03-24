import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useAppStore } from '@/lib/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_WIDTH = SCREEN_WIDTH - 160;

function StatBox({
  icon,
  color,
  value,
  label,
}: {
  icon: string;
  color: string;
  value: string | number;
  label: string;
}) {
  return (
    <View className="bg-surface-card border border-surface-border rounded-2xl p-4 flex-1 mx-1.5">
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon as any} size={18} color={color} />
        <Text className="text-gray-500 text-xs ml-1.5">{label}</Text>
      </View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
    </View>
  );
}

function InterestBar({
  name,
  color,
  count,
  maxCount,
}: {
  name: string;
  color: string;
  count: number;
  maxCount: number;
}) {
  const width = maxCount > 0 ? (count / maxCount) * BAR_MAX_WIDTH : 0;
  return (
    <View className="flex-row items-center mb-3">
      <View className="w-28">
        <Text className="text-gray-400 text-sm" numberOfLines={1}>{name}</Text>
      </View>
      <View className="flex-1 flex-row items-center">
        <View
          className="h-5 rounded-full"
          style={{ width: Math.max(width, 4), backgroundColor: color }}
        />
        <Text className="text-gray-500 text-xs ml-2">{count}</Text>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { interests, feedContent, feeds, likedIds, savedIds } = useAppStore();
  const allContent = feedContent['all'] || [];

  // Content per interest
  const interestCounts: { name: string; color: string; count: number }[] = interests.map((i) => ({
    name: i.name,
    color: i.color,
    count: allContent.filter((c) => c.interestIds.includes(i.id)).length,
  }));
  const maxInterestCount = Math.max(...interestCounts.map((ic) => ic.count), 1);

  // Content by level
  const levelCounts = {
    beginner: allContent.filter((c) => c.level === 'beginner').length,
    intermediate: allContent.filter((c) => c.level === 'intermediate').length,
    advanced: allContent.filter((c) => c.level === 'advanced').length,
    research: allContent.filter((c) => c.level === 'research').length,
  };

  // Content by media type
  const mediaCounts = {
    video: allContent.filter((c) => c.mediaType === 'video').length,
    short: allContent.filter((c) => c.mediaType === 'short').length,
    article: allContent.filter((c) => c.mediaType === 'article').length,
    paper: allContent.filter((c) => c.mediaType === 'paper').length,
    discussion: allContent.filter((c) => c.mediaType === 'discussion').length,
    podcast: allContent.filter((c) => c.mediaType === 'podcast').length,
  };

  // Engagement score
  const engagementScore = likedIds.size + savedIds.size * 2;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Knowledge Stats',
          headerShown: true,
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
        }}
      />
      <SafeAreaView className="flex-1 bg-surface-dark" edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          {/* Top stats */}
          <View className="flex-row mb-6">
            <StatBox icon="layers" color="#818cf8" value={allContent.length} label="Total Items" />
            <StatBox icon="heart" color="#ef4444" value={likedIds.size} label="Liked" />
            <StatBox icon="bookmark" color="#f59e0b" value={savedIds.size} label="Saved" />
          </View>

          <View className="flex-row mb-6">
            <StatBox icon="compass" color="#06b6d4" value={interests.length} label="Interests" />
            <StatBox icon="apps" color="#10b981" value={feeds.length} label="Feeds" />
            <StatBox icon="trophy" color="#f97316" value={engagementScore} label="Engagement" />
          </View>

          {/* Content by interest */}
          <View className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6">
            <Text className="text-white text-base font-bold mb-4">Content by Interest</Text>
            {interestCounts.sort((a, b) => b.count - a.count).map((ic) => (
              <InterestBar
                key={ic.name}
                name={ic.name}
                color={ic.color}
                count={ic.count}
                maxCount={maxInterestCount}
              />
            ))}
            {interestCounts.length === 0 && (
              <Text className="text-gray-600 text-sm">No interests configured yet</Text>
            )}
          </View>

          {/* Content by level */}
          <View className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6">
            <Text className="text-white text-base font-bold mb-4">Content by Level</Text>
            <InterestBar name="Beginner" color="#10b981" count={levelCounts.beginner} maxCount={Math.max(...Object.values(levelCounts), 1)} />
            <InterestBar name="Intermediate" color="#3b82f6" count={levelCounts.intermediate} maxCount={Math.max(...Object.values(levelCounts), 1)} />
            <InterestBar name="Advanced" color="#f59e0b" count={levelCounts.advanced} maxCount={Math.max(...Object.values(levelCounts), 1)} />
            <InterestBar name="Research" color="#ef4444" count={levelCounts.research} maxCount={Math.max(...Object.values(levelCounts), 1)} />
          </View>

          {/* Content by type */}
          <View className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6">
            <Text className="text-white text-base font-bold mb-4">Content by Type</Text>
            {Object.entries(mediaCounts)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <InterestBar
                  key={type}
                  name={type.charAt(0).toUpperCase() + type.slice(1)}
                  color="#818cf8"
                  count={count}
                  maxCount={Math.max(...Object.values(mediaCounts), 1)}
                />
              ))}
          </View>

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
