import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useAppStore } from '@/lib/store';

export default function InterestsScreen() {
  const router = useRouter();
  const { interests, subInterests, removeInterest } = useAppStore();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Interest',
      `Remove "${name}" and all its sub-interests?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeInterest(id),
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Interests',
          headerShown: true,
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
        }}
      />
      <SafeAreaView className="flex-1 bg-surface-dark" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {interests.length === 0 ? (
            <View className="items-center py-16">
              <Ionicons name="compass-outline" size={48} color="#4b5563" />
              <Text className="text-gray-500 text-lg mt-4">No interests yet</Text>
              <Text className="text-gray-600 text-sm mt-1">Add your first interest to get started</Text>
            </View>
          ) : (
            interests.map((interest) => {
              const subs = subInterests.filter((s) => s.interestId === interest.id);
              return (
                <Pressable
                  key={interest.id}
                  onPress={() => router.push(`/interests/${interest.id}`)}
                >
                  <View className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: `${interest.color}22` }}
                        >
                          <Ionicons
                            name={(interest.icon as any) || 'star'}
                            size={20}
                            color={interest.color}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-base font-semibold">{interest.name}</Text>
                          {interest.description ? (
                            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                              {interest.description}
                            </Text>
                          ) : null}
                          {subs.length > 0 && (
                            <Text className="text-gray-600 text-xs mt-1">
                              {subs.length} sub-interest{subs.length !== 1 ? 's' : ''}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => router.push(`/interests/edit?id=${interest.id}`)}
                          hitSlop={8}
                        >
                          <Ionicons name="pencil" size={18} color="#6b7280" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(interest.id, interest.name)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </Pressable>
                        <Ionicons name="chevron-forward" size={18} color="#4b5563" />
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        {/* Add button */}
        <View className="px-4 pb-4">
          <Pressable onPress={() => router.push('/interests/edit')}>
            <View className="bg-brand-500 rounded-2xl py-4 items-center flex-row justify-center">
              <Ionicons name="add" size={22} color="#fff" />
              <Text className="text-white text-base font-semibold ml-2">Add Interest</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
