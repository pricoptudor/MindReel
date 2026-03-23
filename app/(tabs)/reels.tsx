import React from 'react';
import { View } from 'react-native';
import { ReelPlayer } from '@/components/ReelPlayer';
import { useAppStore } from '@/lib/store';

export default function ReelsScreen() {
  const reelsContent = useAppStore((s) => s.reelsContent);

  return (
    <View className="flex-1 bg-black">
      <ReelPlayer items={reelsContent} />
    </View>
  );
}
