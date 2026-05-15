import { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type StepIndicatorProps = {
  steps: boolean[];
  labels: string[];
  colors: AppColors;
};

/**
 * Indicador de progresso em etapas — usado em fluxos multi-step como nova-redacao.
 */
export function StepIndicator({ steps, labels, colors }: StepIndicatorProps) {
  const done = steps.filter(Boolean).length;
  return (
    <View style={styles.wrap}>
      {steps.map((complete, i) => {
        const isActive = !complete && done >= i;
        return (
          <React.Fragment key={i}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.dot,
                  complete
                    ? { backgroundColor: colors.success }
                    : isActive
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border },
                ]}
              >
                {complete ? (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                ) : (
                  <Text style={[styles.dotNum, { color: isActive ? '#fff' : colors.mutedText }]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: complete ? colors.success : isActive ? colors.accent : colors.mutedText,
                    fontWeight: complete || isActive ? '700' : '400',
                  },
                ]}
              >
                {labels[i]}
              </Text>
            </View>
            {i < steps.length - 1 ? (
              <View
                style={[styles.line, { backgroundColor: complete ? colors.success : colors.border }]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 6 },
  stepCol: { alignItems: 'center', gap: 4, minWidth: 52 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotNum: { fontSize: 10, fontWeight: '700' },
  stepLabel: { fontSize: 10, letterSpacing: 0.1, lineHeight: 13 },
  line: { flex: 1, height: 1.5, borderRadius: 1, marginTop: 11 },
});
