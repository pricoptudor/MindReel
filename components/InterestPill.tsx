import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface InterestPillProps {
  name: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function InterestPill({ name, color, selected = false, onPress, size = 'md' }: InterestPillProps) {
  const paddingClass = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <Pressable onPress={onPress}>
      <View
        className={`rounded-full ${paddingClass} mr-2 mb-1`}
        style={{
          backgroundColor: selected ? color : `${color}22`,
          borderWidth: 1,
          borderColor: color,
        }}
      >
        <Text
          className={`${textSize} font-semibold`}
          style={{ color: selected ? '#fff' : color }}
        >
          {name}
        </Text>
      </View>
    </Pressable>
  );
}
