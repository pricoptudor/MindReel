import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'About MindReel',
          headerStyle: { backgroundColor: '#16161f' },
          headerTintColor: '#f1f5f9',
        }}
      />
      <View className="flex-1 bg-surface-dark px-6 pt-8">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-brand-500/20 items-center justify-center mb-4">
            <Ionicons name="sparkles" size={32} color="#818cf8" />
          </View>
          <Text className="text-white text-2xl font-bold">MindReel</Text>
          <Text className="text-gray-500 text-sm mt-1">v1.0.0</Text>
        </View>

        <Text className="text-gray-400 text-sm text-center leading-6">
          Your personal knowledge feed — aggregating the best content from across the web,
          tailored to your interests and learning goals.
        </Text>

        <View className="mt-8 bg-surface-card rounded-2xl border border-surface-border p-4">
          <Text className="text-white text-sm font-semibold mb-2">Features</Text>
          <Text className="text-gray-400 text-sm leading-6">
            • Interest-based feeds with refinement levels{'\n'}
            • TikTok-style reels for quick learning{'\n'}
            • Content from YouTube, Reddit, arXiv, RSS & more{'\n'}
            • Smart feed mixing and discovery{'\n'}
            • Offline caching for reading anywhere
          </Text>
        </View>
      </View>
    </>
  );
}
