import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AccordionProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
}>;

export function Accordion({ title, subtitle, defaultOpen = false, children }: AccordionProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text> : null}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedText} />
      </Pressable>
      {open ? <View style={[styles.body, { borderTopColor: colors.border }]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  titleWrap: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  subtitle: { fontSize: 12, lineHeight: 17 },
  body: {
    borderTopWidth: 1,
    padding: theme.spacing.md,
  },
});
