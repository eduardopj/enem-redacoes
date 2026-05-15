import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  number: string;
  title: string;
  desc: string;
  onPress: () => void;
  done: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  isLast: boolean;
};

export const OnboardingStep = React.memo(function OnboardingStep({
  number, title, desc, onPress, done, icon, isLast,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={done ? undefined : onPress}
      style={[styles.step, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
    >
      <View
        style={[
          styles.stepNum,
          done ? { backgroundColor: colors.success } : { backgroundColor: colors.accent },
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={14} color="#fff" />
        ) : (
          <Text style={[styles.stepNumText, { color: '#fff' }]}>{number}</Text>
        )}
      </View>

      <View style={styles.stepText}>
        <Text
          style={[
            styles.stepTitle,
            { color: done ? colors.mutedText : colors.text },
            done && { textDecorationLine: 'line-through' },
          ]}
        >
          {title}
        </Text>
        {!done ? (
          <Text style={[styles.stepDesc, { color: colors.mutedText }]}>{desc}</Text>
        ) : null}
      </View>

      {done ? (
        <View style={[styles.doneTag, { backgroundColor: colors.successSoft }]}>
          <Text style={[styles.doneTagText, { color: colors.success }]}>Feito</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  stepNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontSize: 14, fontWeight: '800' },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  stepDesc: { fontSize: 14, lineHeight: 20 },
  doneTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  doneTagText: { fontSize: 12, fontWeight: '700' },
});
