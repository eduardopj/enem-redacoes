import { Button } from '@/components/ui';
import type { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  selectedStudent: { name: string; className: string } | undefined;
  selectedTheme: { title: string } | undefined;
  imageUri: string;
  imageName: string;
  autoCorrect: boolean;
  setAutoCorrect: (fn: (v: boolean) => boolean) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  colors: AppColors;
};

export function StepReview({
  selectedStudent, selectedTheme,
  imageUri, imageName,
  autoCorrect, setAutoCorrect,
  canSubmit, onSubmit, colors,
}: Props) {
  if (!canSubmit) {
    return (
      <View style={styles.lockedHint}>
        <Ionicons name="arrow-up-outline" size={13} color={colors.mutedText} />
        <Text style={[styles.lockedText, { color: colors.mutedText }]}>Complete aluno, tema e foto para revisar o envio.</Text>
      </View>
    );
  }

  return (
    <>
      {/* Resumo */}
      <View style={[styles.reviewPanel, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.accent + '14' }]}>
            <Ionicons name="person-outline" size={14} color={colors.accent} />
          </View>
          <Text style={[styles.summaryText, { color: colors.text }]}>{selectedStudent?.name}</Text>
          <Text style={[styles.summaryMeta, { color: colors.mutedText }]}>{selectedStudent?.className}</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.info + '14' }]}>
            <Ionicons name="book-outline" size={14} color={colors.info} />
          </View>
          <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={1}>{selectedTheme?.title}</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.success + '14' }]}>
            <Ionicons name="image-outline" size={14} color={colors.success} />
          </View>
          <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={1}>{imageName || 'Imagem anexada'}</Text>
        </View>
      </View>

      {/* Toggle correção automática */}
      {imageUri ? (
        <Pressable
          onPress={() => setAutoCorrect((v) => !v)}
          style={[
            styles.toggleRow,
            {
              backgroundColor: autoCorrect ? colors.accent + '0E' : colors.input,
              borderColor: autoCorrect ? colors.accent + '50' : colors.border,
            },
          ]}
        >
          <View style={[styles.toggleIcon, { backgroundColor: autoCorrect ? colors.accent + '20' : colors.input }]}>
            <Ionicons name="sparkles-outline" size={18} color={autoCorrect ? colors.accent : colors.mutedText} />
          </View>
          <View style={styles.toggleText}>
            <Text style={[styles.toggleTitle, { color: autoCorrect ? colors.text : colors.softText }]}>
              Corrigir com IA ao salvar
            </Text>
            <Text style={[styles.toggleDesc, { color: colors.mutedText }]}>
              {autoCorrect ? 'A IA inicia assim que o envio for salvo.' : 'Você poderá iniciar depois.'}
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: autoCorrect ? colors.accent : colors.border }]}>
            <View style={[styles.thumb, autoCorrect && styles.thumbOn]} />
          </View>
        </Pressable>
      ) : (
        <View style={[styles.docNotice, { backgroundColor: colors.infoSoft, borderRadius: 12 }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={[styles.docNoticeText, { color: colors.info }]}>
            Correção com IA requer uma imagem. Documentos são salvos para referência.
          </Text>
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        <Button
          title={autoCorrect && imageUri ? 'Salvar e corrigir com IA' : 'Salvar redação'}
          leftIcon={autoCorrect && imageUri ? 'sparkles-outline' : 'checkmark-outline'}
          onPress={onSubmit}
          disabled={!canSubmit}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lockedHint: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lockedText: { fontSize: 13, lineHeight: 18 },
  reviewPanel: { gap: 10, marginBottom: 14, borderWidth: 1, borderRadius: 14, padding: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  summaryMeta: { fontSize: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 0 },
  toggleIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  toggleText: { flex: 1, gap: 2 },
  toggleTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  toggleDesc: { fontSize: 12, lineHeight: 17 },
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  thumbOn: { alignSelf: 'flex-end' },
  docNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, marginBottom: 0 },
  docNoticeText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
