import { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SectionBlockProps = {
  number: string;
  label: string;
  done: boolean;
  locked?: boolean;
  colors: AppColors;
  children: React.ReactNode;
};

/**
 * Bloco de seção numerado para fluxos de formulário progressivo.
 * Suporta estados: ativo, concluído e bloqueado.
 */
export function SectionBlock({ number, label, done, locked = false, colors, children }: SectionBlockProps) {
  return (
    <View
      style={[
        styles.block,
        {
          backgroundColor: colors.surface,
          borderWidth: locked ? 1 : 0,
          borderColor: locked ? colors.border : 'transparent',
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.numBadge,
            {
              backgroundColor: done ? colors.success : locked ? colors.input : colors.accent,
              borderWidth: locked ? 1.5 : 0,
              borderColor: locked ? colors.border : 'transparent',
            },
          ]}
        >
          {done ? (
            <Ionicons name="checkmark" size={13} color="#fff" />
          ) : locked ? (
            <Ionicons name="lock-closed-outline" size={12} color={colors.mutedText} />
          ) : (
            <Text style={styles.num}>{number}</Text>
          )}
        </View>
        <Text style={[styles.label, { color: locked ? colors.mutedText : colors.text }]}>
          {label}
        </Text>
        {done ? (
          <View style={[styles.doneTag, { backgroundColor: colors.successSoft }]}>
            <Text style={[styles.doneText, { color: colors.success }]}>Pronto</Text>
          </View>
        ) : locked ? (
          <View style={[styles.lockedTag, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={9} color={colors.mutedText} />
            <Text style={[styles.lockedTagText, { color: colors.mutedText }]}>Bloqueado</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.body, locked && styles.bodyLocked]} pointerEvents={locked ? 'none' : 'auto'}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 16, overflow: 'hidden', shadowColor: '#101828', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 12 },
  numBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 12, fontWeight: '700', color: '#fff' },
  label: { flex: 1, fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  doneTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  doneText: { fontSize: 11, fontWeight: '700' },
  lockedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  lockedTagText: { fontSize: 10, fontWeight: '600' },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  bodyLocked: { opacity: 0.45 },
});
