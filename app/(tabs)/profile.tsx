import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { InterestPill } from '@/components/InterestPill';

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View className="bg-surface-card border border-surface-border rounded-2xl p-4 flex-1 mx-1.5">
      <Ionicons name={icon as any} size={22} color={color} />
      <Text className="text-white text-xl font-bold mt-2">{value}</Text>
      <Text className="text-gray-500 text-xs mt-0.5">{label}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, subtitle }: { icon: string; label: string; subtitle?: string }) {
  return (
    <Pressable>
      <View className="flex-row items-center px-4 py-3.5 border-b border-surface-border">
        <View className="w-9 h-9 rounded-xl bg-surface-elevated items-center justify-center mr-3">
          <Ionicons name={icon as any} size={18} color="#818cf8" />
        </View>
        <View className="flex-1">
          <Text className="text-white text-sm font-medium">{label}</Text>
          {subtitle && <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#4b5563" />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { interests, feeds, likedIds, savedIds } = useAppStore();

  return (
    <SafeAreaView className="flex-1 bg-surface-dark" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-2 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-2xl font-bold">Profile</Text>
            <Pressable>
              <Ionicons name="settings-outline" size={24} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Avatar & name */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-brand-500/20 border-2 border-brand-500 items-center justify-center mb-3">
              <Ionicons name="person" size={36} color="#818cf8" />
            </View>
            <Text className="text-white text-xl font-bold">Tudor</Text>
            <Text className="text-gray-500 text-sm mt-0.5">PhD Researcher · Lifelong Learner</Text>
          </View>

          {/* Stats */}
          <View className="flex-row mb-6">
            <StatCard label="Liked" value={String(likedIds.size)} icon="heart" color="#ef4444" />
            <StatCard label="Saved" value={String(savedIds.size)} icon="bookmark" color="#f59e0b" />
            <StatCard label="Feeds" value={String(feeds.length)} icon="layers" color="#818cf8" />
          </View>
        </View>

        {/* Interests section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-white text-lg font-bold">My Interests</Text>
            <Pressable onPress={() => router.push('/interests/')}>
              <Text className="text-brand-400 text-sm">Edit</Text>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap px-4">
            {interests.map((interest) => (
              <InterestPill
                key={interest.id}
                name={interest.name}
                color={interest.color}
                selected
                onPress={() => router.push(`/interests/${interest.id}`)}
              />
            ))}
          </View>
        </View>

        {/* My Feeds */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-white text-lg font-bold">My Feeds</Text>
            <Pressable onPress={() => router.push('/feed-config/')}>
              <Text className="text-brand-400 text-sm">Manage</Text>
            </Pressable>
          </View>
          {feeds.map((feed) => (
            <Pressable key={feed.id}>
              <View className="flex-row items-center px-4 py-3 border-b border-surface-border">
                <View className="w-9 h-9 rounded-xl bg-surface-elevated items-center justify-center mr-3">
                  <Ionicons name={(feed.icon as any) || 'layers'} size={18} color="#818cf8" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-medium">{feed.name}</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {feed.filters.length} interest{feed.filters.length !== 1 ? 's' : ''} ·{' '}
                    {feed.isCombined ? 'Combined' : 'Single'}{' '}
                    {feed.shuffleMode ? '· Shuffle' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#4b5563" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Settings */}
        <View className="mb-6">
          <Text className="text-white text-lg font-bold px-4 mb-3">Settings</Text>
          <SettingsRow icon="color-palette-outline" label="Appearance" subtitle="Dark mode, theme" />
          <SettingsRow icon="notifications-outline" label="Notifications" subtitle="Push, content alerts" />
          <SettingsRow icon="cloud-outline" label="Content Sources" subtitle="Manage APIs and feeds" />
          <SettingsRow icon="download-outline" label="Offline Content" subtitle="Cached for reading" />
          <SettingsRow icon="information-circle-outline" label="About MindReel" subtitle="v1.0.0" />
        </View>

        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
