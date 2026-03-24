import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAppStore } from '@/lib/store';

export default function InterestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { interests, subInterests, addSubInterest, removeSubInterest } = useAppStore();

  const interest = interests.find((i) => i.id === id);
  const subs = subInterests.filter((s) => s.interestId === id);

  const [showAdd, setShowAdd] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');

  if (!interest) {
    return (
      <View className="flex-1 bg-surface-dark items-center justify-center">
        <Text className="text-gray-500 text-lg">Interest not found</Text>
      </View>
    );
  }

  const handleAddSub = () => {
    if (!newSubName.trim()) return;

    const subId = `${id}-${newSubName.trim().toLowerCase().replace(/\s+/g, '-')}`;
    if (subInterests.some((s) => s.id === subId)) {
      Alert.alert('Error', 'A sub-interest with this name already exists');
      return;
    }

    addSubInterest({
      id: subId,
      interestId: id!,
      name: newSubName.trim(),
      description: newSubDesc.trim() || undefined,
    });

    setNewSubName('');
    setNewSubDesc('');
    setShowAdd(false);
  };

  const handleDeleteSub = (subId: string, name: string) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSubInterest(subId) },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: interest.name,
          headerShown: true,
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
          headerRight: () => (
            <Pressable onPress={() => router.push(`/interests/edit?id=${id}`)}>
              <Ionicons name="pencil" size={20} color="#818cf8" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-surface-dark" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Interest header card */}
          <View className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-6 items-center">
            <View
              className="w-14 h-14 rounded-xl items-center justify-center mb-3"
              style={{ backgroundColor: `${interest.color}22` }}
            >
              <Ionicons name={(interest.icon as any) || 'star'} size={28} color={interest.color} />
            </View>
            <Text className="text-white text-xl font-bold">{interest.name}</Text>
            {interest.description && (
              <Text className="text-gray-400 text-sm text-center mt-1">{interest.description}</Text>
            )}
            <View className="flex-row mt-3">
              <View className="px-3 py-1 rounded-full bg-surface-elevated">
                <Text className="text-gray-400 text-xs">
                  {subs.length} sub-interest{subs.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Sub-interests */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-bold">Sub-Interests</Text>
            <Text className="text-gray-500 text-xs">
              Refine what you see in this topic
            </Text>
          </View>

          {subs.length === 0 && !showAdd && (
            <View className="bg-surface-card border border-surface-border rounded-xl p-6 items-center mb-4">
              <Ionicons name="layers-outline" size={32} color="#4b5563" />
              <Text className="text-gray-500 text-sm mt-2 text-center">
                Add sub-interests to fine-tune your feeds
              </Text>
              <Text className="text-gray-600 text-xs mt-1 text-center">
                e.g. "Quantum Computing", "Quantum Physics"
              </Text>
            </View>
          )}

          {subs.map((sub) => (
            <View
              key={sub.id}
              className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 mb-2 flex-row items-center"
            >
              <View
                className="w-2 h-2 rounded-full mr-3"
                style={{ backgroundColor: interest.color }}
              />
              <View className="flex-1">
                <Text className="text-white text-sm font-medium">{sub.name}</Text>
                {sub.description && (
                  <Text className="text-gray-500 text-xs mt-0.5">{sub.description}</Text>
                )}
              </View>
              <Pressable onPress={() => handleDeleteSub(sub.id, sub.name)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="#4b5563" />
              </Pressable>
            </View>
          ))}

          {/* Add sub-interest form */}
          {showAdd ? (
            <View className="bg-surface-card border border-brand-500/30 rounded-xl p-4 mb-4">
              <TextInput
                className="border border-surface-border rounded-lg px-3 py-2 text-white text-sm mb-2"
                placeholder="Sub-interest name"
                placeholderTextColor="#4b5563"
                value={newSubName}
                onChangeText={setNewSubName}
                autoFocus
              />
              <TextInput
                className="border border-surface-border rounded-lg px-3 py-2 text-white text-sm mb-3"
                placeholder="Description (optional)"
                placeholderTextColor="#4b5563"
                value={newSubDesc}
                onChangeText={setNewSubDesc}
              />
              <View className="flex-row gap-2">
                <Pressable onPress={() => setShowAdd(false)} className="flex-1">
                  <View className="border border-surface-border rounded-lg py-2 items-center">
                    <Text className="text-gray-400 text-sm">Cancel</Text>
                  </View>
                </Pressable>
                <Pressable onPress={handleAddSub} className="flex-1">
                  <View className="bg-brand-500 rounded-lg py-2 items-center">
                    <Text className="text-white text-sm font-semibold">Add</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Add sub-interest button */}
        {!showAdd && (
          <View className="px-4 pb-4">
            <Pressable onPress={() => setShowAdd(true)}>
              <View className="bg-surface-card border border-dashed border-brand-500/40 rounded-2xl py-3.5 items-center flex-row justify-center">
                <Ionicons name="add" size={20} color="#818cf8" />
                <Text className="text-brand-400 text-sm font-semibold ml-1.5">Add Sub-Interest</Text>
              </View>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}
