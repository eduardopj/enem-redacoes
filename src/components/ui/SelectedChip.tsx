import { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  onClear: () => void;
  colors: AppColors;
};

export const SelectedChip = React.memo(function SelectedChip({ label, onClear, colors }: Props) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors.accent + '14', borderWidth: 1, borderColor: colors.accent + '30' },
      ]}
    >
      <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
      <Text style={[styles.chipText, { color: colors.accent }]} numberOfLines={1}>
        {label}
      </Text>
      <Pressable onPress={onClear} hitSlop={10}>
        <Ionicons name="close-circle" size={16} color={colors.accent + '80'} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: { flex: 1, fontSize: 14, fontWeight: '600' },
});
