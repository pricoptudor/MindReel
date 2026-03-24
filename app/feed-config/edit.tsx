import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAppStore } from '@/lib/store';
import type { Feed, FeedFilter, ContentLevel, ContentFocus, MediaType } from '@/lib/types';
import {
  ALL_LEVELS,
  ALL_FOCUSES,
  ALL_MEDIA_TYPES,
  LEVEL_COLORS,
  FOCUS_COLORS,
  MEDIA_ICONS,
  INTEREST_ICONS,
} from '@/lib/types';

function ToggleChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        className="px-3 py-1.5 rounded-full mr-2 mb-2"
        style={{
          backgroundColor: active ? `${color}22` : 'transparent',
          borderWidth: 1,
          borderColor: active ? color : '#2a2a3d',
        }}
      >
        <Text
          className="text-xs font-semibold capitalize"
          style={{ color: active ? color : '#6b7280' }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function EditFeedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { feeds, interests, addFeed, updateFeed } = useAppStore();

  const existing = id ? feeds.find((f) => f.id === id) : null;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [icon, setIcon] = useState(existing?.icon || 'layers');
  const [shuffleMode, setShuffleMode] = useState(existing?.shuffleMode ?? true);

  // Selected interest IDs
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    existing?.filters.map((f) => f.interestId) || []
  );

  // Per-interest filter settings
  const [filterSettings, setFilterSettings] = useState<Record<string, {
    levels: ContentLevel[];
    focuses: ContentFocus[];
    mediaTypes: MediaType[];
    weight: number;
  }>>(() => {
    const map: any = {};
    if (existing) {
      for (const f of existing.filters) {
        map[f.interestId] = {
          levels: f.levels || [...ALL_LEVELS],
          focuses: f.focuses || [...ALL_FOCUSES],
          mediaTypes: f.mediaTypes || [...ALL_MEDIA_TYPES],
          weight: f.weight,
        };
      }
    }
    return map;
  });

  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interestId));
      const next = { ...filterSettings };
      delete next[interestId];
      setFilterSettings(next);
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
      setFilterSettings({
        ...filterSettings,
        [interestId]: {
          levels: [...ALL_LEVELS],
          focuses: [...ALL_FOCUSES],
          mediaTypes: [...ALL_MEDIA_TYPES],
          weight: 1,
        },
      });
    }
  };

  const toggleFilterValue = <T extends string>(
    interestId: string,
    field: 'levels' | 'focuses' | 'mediaTypes',
    value: T
  ) => {
    setFilterSettings((prev) => {
      const current = prev[interestId];
      if (!current) return prev;
      const arr = current[field] as T[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [interestId]: { ...current, [field]: next } };
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Feed name is required');
      return;
    }
    if (selectedInterests.length === 0) {
      Alert.alert('Error', 'Select at least one interest');
      return;
    }

    const feedId = existing?.id || name.trim().toLowerCase().replace(/\s+/g, '-');

    const filters: FeedFilter[] = selectedInterests.map((interestId) => ({
      interestId,
      levels: filterSettings[interestId]?.levels || [...ALL_LEVELS],
      focuses: filterSettings[interestId]?.focuses || [...ALL_FOCUSES],
      mediaTypes: filterSettings[interestId]?.mediaTypes || [...ALL_MEDIA_TYPES],
      weight: filterSettings[interestId]?.weight || 1,
    }));

    const feed: Feed = {
      id: feedId,
      userId: 'demo',
      name: name.trim(),
      icon,
      isCombined: selectedInterests.length > 1,
      shuffleMode,
      filters,
    };

    if (isEditing) {
      updateFeed(feed);
    } else {
      addFeed(feed);
    }

    router.back();
  };

  // Subset of icons suitable for feeds
  const feedIcons = ['layers', 'apps', 'school', 'heart', 'rocket', 'flame', 'star', 'diamond', 'bulb', 'newspaper', 'globe', 'code-slash', 'flask', 'book'];

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Feed' : 'New Feed',
          headerShown: true,
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
        }}
      />
      <SafeAreaView className="flex-1 bg-surface-dark" edges={['bottom']}>
        <ScrollView className="flex-1 px-4 pt-4">
          {/* Name */}
          <Text className="text-gray-400 text-sm font-semibold mb-2 ml-1">FEED NAME</Text>
          <TextInput
            className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-white text-base mb-5"
            placeholder="e.g. PhD Research, Weekend Learning"
            placeholderTextColor="#4b5563"
            value={name}
            onChangeText={setName}
            autoFocus={!isEditing}
          />

          {/* Icon */}
          <Text className="text-gray-400 text-sm font-semibold mb-2 ml-1">ICON</Text>
          <View className="flex-row flex-wrap bg-surface-card border border-surface-border rounded-xl p-2 mb-5">
            {feedIcons.map((ic) => (
              <Pressable key={ic} onPress={() => setIcon(ic)} className="p-1.5">
                <View
                  className="w-9 h-9 rounded-lg items-center justify-center"
                  style={{
                    backgroundColor: icon === ic ? '#818cf822' : 'transparent',
                    borderWidth: icon === ic ? 1 : 0,
                    borderColor: '#818cf8',
                  }}
                >
                  <Ionicons name={ic as any} size={18} color={icon === ic ? '#818cf8' : '#6b7280'} />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Shuffle toggle */}
          <View className="flex-row items-center justify-between bg-surface-card border border-surface-border rounded-xl px-4 py-3 mb-5">
            <View className="flex-1">
              <Text className="text-white text-sm font-medium">Shuffle Mode</Text>
              <Text className="text-gray-500 text-xs mt-0.5">
                Randomize content order in this feed
              </Text>
            </View>
            <Switch
              value={shuffleMode}
              onValueChange={setShuffleMode}
              trackColor={{ false: '#2a2a3d', true: '#818cf844' }}
              thumbColor={shuffleMode ? '#818cf8' : '#6b7280'}
            />
          </View>

          {/* Interest selection */}
          <Text className="text-gray-400 text-sm font-semibold mb-2 ml-1">
            INTERESTS ({selectedInterests.length} selected)
          </Text>
          <View className="flex-row flex-wrap mb-4">
            {interests.map((interest) => {
              const selected = selectedInterests.includes(interest.id);
              return (
                <Pressable key={interest.id} onPress={() => toggleInterest(interest.id)}>
                  <View
                    className="px-3 py-2 rounded-xl mr-2 mb-2 flex-row items-center"
                    style={{
                      backgroundColor: selected ? `${interest.color}22` : '#16161f',
                      borderWidth: 1,
                      borderColor: selected ? interest.color : '#2a2a3d',
                    }}
                  >
                    <Ionicons
                      name={(interest.icon as any) || 'star'}
                      size={16}
                      color={selected ? interest.color : '#6b7280'}
                    />
                    <Text
                      className="text-sm font-medium ml-1.5"
                      style={{ color: selected ? interest.color : '#6b7280' }}
                    >
                      {interest.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Per-interest refinement filters */}
          {selectedInterests.map((interestId) => {
            const interest = interests.find((i) => i.id === interestId);
            if (!interest) return null;
            const settings = filterSettings[interestId];
            if (!settings) return null;

            return (
              <View
                key={interestId}
                className="bg-surface-card border rounded-2xl p-4 mb-4"
                style={{ borderColor: `${interest.color}33` }}
              >
                <View className="flex-row items-center mb-3">
                  <Ionicons name={(interest.icon as any) || 'star'} size={16} color={interest.color} />
                  <Text className="text-white text-sm font-semibold ml-2">{interest.name} Filters</Text>
                </View>

                {/* Levels */}
                <Text className="text-gray-500 text-xs font-semibold mb-1.5">LEVEL</Text>
                <View className="flex-row flex-wrap mb-3">
                  {ALL_LEVELS.map((level) => (
                    <ToggleChip
                      key={level}
                      label={level}
                      active={settings.levels.includes(level)}
                      color={LEVEL_COLORS[level]}
                      onPress={() => toggleFilterValue(interestId, 'levels', level)}
                    />
                  ))}
                </View>

                {/* Focus */}
                <Text className="text-gray-500 text-xs font-semibold mb-1.5">FOCUS</Text>
                <View className="flex-row flex-wrap mb-3">
                  {ALL_FOCUSES.map((focus) => (
                    <ToggleChip
                      key={focus}
                      label={focus}
                      active={settings.focuses.includes(focus)}
                      color={FOCUS_COLORS[focus]}
                      onPress={() => toggleFilterValue(interestId, 'focuses', focus)}
                    />
                  ))}
                </View>

                {/* Media types */}
                <Text className="text-gray-500 text-xs font-semibold mb-1.5">CONTENT TYPE</Text>
                <View className="flex-row flex-wrap">
                  {ALL_MEDIA_TYPES.map((mt) => (
                    <ToggleChip
                      key={mt}
                      label={mt}
                      active={settings.mediaTypes.includes(mt)}
                      color="#818cf8"
                      onPress={() => toggleFilterValue(interestId, 'mediaTypes', mt)}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          <View className="h-8" />
        </ScrollView>

        {/* Save button */}
        <View className="px-4 pb-4">
          <Pressable onPress={handleSave}>
            <View className="bg-brand-500 rounded-2xl py-4 items-center">
              <Text className="text-white text-base font-semibold">
                {isEditing ? 'Save Changes' : 'Create Feed'}
              </Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
