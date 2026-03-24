import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { INTEREST_ICONS, INTEREST_COLORS } from '@/lib/types';

export default function EditInterestScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { interests, addInterest, updateInterest } = useAppStore();

  const existing = id ? interests.find((i) => i.id === id) : null;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [icon, setIcon] = useState(existing?.icon || 'star');
  const [color, setColor] = useState(existing?.color || '#818cf8');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Interest name is required');
      return;
    }

    const interestId = existing?.id || name.trim().toLowerCase().replace(/\s+/g, '-');

    if (!isEditing && interests.some((i) => i.id === interestId)) {
      Alert.alert('Error', 'An interest with this name already exists');
      return;
    }

    const interest = {
      id: interestId,
      name: name.trim(),
      icon,
      color,
      description: description.trim() || undefined,
    };

    if (isEditing) {
      updateInterest(interest);
    } else {
      addInterest(interest);
    }

    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Interest' : 'New Interest',
          headerShown: true,
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
        }}
      />
      <SafeAreaView className="flex-1 bg-surface-dark" edges={['bottom']}>
        <ScrollView className="flex-1 px-4 pt-4">
          {/* Preview */}
          <View className="items-center mb-8 py-6">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
              style={{ backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}44` }}
            >
              <Ionicons name={icon as any} size={32} color={color} />
            </View>
            <Text className="text-white text-lg font-bold">
              {name || 'New Interest'}
            </Text>
          </View>

          {/* Name */}
          <Text className="text-gray-400 text-sm font-semibold mb-2 ml-1">NAME</Text>
          <TextInput
            className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-white text-base mb-6"
            placeholder="e.g. Quantum Computing"
            placeholderTextColor="#4b5563"
            value={name}
            onChangeText={setName}
            autoFocus={!isEditing}
          />

          {/* Description */}
          <Text className="text-gray-400 text-sm font-semibold mb-2 ml-1">DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-white text-base mb-6"
            placeholder="Brief description of this interest"
            placeholderTextColor="#4b5563"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />

          {/* Icon picker */}
          <Text className="text-gray-400 text-sm font-semibold mb-2 ml-1">ICON</Text>
          <View className="flex-row flex-wrap bg-surface-card border border-surface-border rounded-xl p-3 mb-6">
            {INTEREST_ICONS.map((ic) => (
              <Pressable key={ic} onPress={() => setIcon(ic)} className="p-2">
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    icon === ic ? 'border-2' : ''
                  }`}
                  style={{
                    backgroundColor: icon === ic ? `${color}22` : 'transparent',
                    borderColor: icon === ic ? color : 'transparent',
                  }}
                >
                  <Ionicons
                    name={ic as any}
                    size={20}
                    color={icon === ic ? color : '#6b7280'}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Color picker */}
          <Text className="text-gray-400 text-sm font-semibold mb-2 ml-1">COLOR</Text>
          <View className="flex-row flex-wrap bg-surface-card border border-surface-border rounded-xl p-3 mb-6">
            {INTEREST_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} className="p-2">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center`}
                  style={{
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: '#fff',
                  }}
                >
                  {color === c && <Ionicons name="checkmark" size={18} color="#fff" />}
                </View>
              </Pressable>
            ))}
          </View>

          <View className="h-8" />
        </ScrollView>

        {/* Save button */}
        <View className="px-4 pb-4">
          <Pressable onPress={handleSave}>
            <View className="bg-brand-500 rounded-2xl py-4 items-center">
              <Text className="text-white text-base font-semibold">
                {isEditing ? 'Save Changes' : 'Create Interest'}
              </Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
