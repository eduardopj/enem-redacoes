import { Button } from '@/components/ui';
import type { AppColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  imageUri: string;
  hasFile: boolean;
  stepsDone: boolean[];
  onTakePhoto: () => void;
  onPickImage: () => void;
  onClearFile: () => void;
  colors: AppColors;
};

function PhotoQualityTips({ colors }: { colors: AppColors }) {
  const tips = [
    { icon: 'scan-outline' as const, text: 'Folha inteira' },
    { icon: 'sunny-outline' as const, text: 'Boa luz' },
    { icon: 'resize-outline' as const, text: 'Sem cortes' },
    { icon: 'create-outline' as const, text: 'Texto nítido' },
  ];

  return (
    <View style={styles.qualityGrid}>
      {tips.map((tip) => (
        <View key={tip.text} style={[styles.qualityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={tip.icon} size={15} color={colors.accent} />
          <Text style={[styles.qualityText, { color: colors.softText }]}>{tip.text}</Text>
        </View>
      ))}
    </View>
  );
}

export function StepFile({
  imageUri, hasFile, stepsDone,
  onTakePhoto, onPickImage, onClearFile, colors,
}: Props) {
  if (!stepsDone[1]) {
    return (
      <View style={styles.lockedHint}>
        <Ionicons name="arrow-up-outline" size={13} color={colors.mutedText} />
        <Text style={[styles.lockedText, { color: colors.mutedText }]}>Selecione um tema na etapa anterior.</Text>
      </View>
    );
  }

  if (hasFile) {
    return (
      <View style={styles.filePreview}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.previewImage, { borderRadius: 12 }]}
          contentFit="contain"
        />
        <Button
          title="Usar outro arquivo"
          variant="secondary"
          leftIcon="refresh-outline"
          onPress={onClearFile}
          size="sm"
        />
      </View>
    );
  }

  return (
    <View style={styles.uploadZone}>
      {/* Câmera — ação principal */}
      <Pressable
        onPress={onTakePhoto}
        style={[styles.cameraBtn, { backgroundColor: colors.text }]}
      >
        <View style={[styles.cameraIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Ionicons name="camera" size={24} color="#fff" />
        </View>
        <Text style={styles.cameraBtnText}>Fotografar redação</Text>
        <Text style={styles.cameraBtnSub}>Recomendado — melhor para a IA</Text>
      </Pressable>

      {/* Opções secundárias */}
      <View style={styles.secondaryUploads}>
        <Pressable
          onPress={onPickImage}
          style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <View style={[styles.secIcon, { backgroundColor: colors.input }]}>
            <Ionicons name="images-outline" size={18} color={colors.softText} />
          </View>
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Galeria</Text>
        </Pressable>
      </View>
      <View style={[styles.docNotice, { backgroundColor: colors.infoSoft, borderRadius: 12 }]}>
        <Ionicons name="information-circle-outline" size={16} color={colors.info} />
        <Text style={[styles.docNoticeText, { color: colors.info }]}>
          Por enquanto, a IA corrige imagens. Use foto nítida, folha inteira e boa iluminação.
        </Text>
      </View>
      <PhotoQualityTips colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  lockedHint: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lockedText: { fontSize: 13, lineHeight: 18 },
  uploadZone: { gap: 12 },
  cameraBtn: { borderRadius: 16, padding: 18, alignItems: 'center', gap: 6 },
  cameraIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  cameraBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  cameraBtnSub: { color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 16 },
  secondaryUploads: { flexDirection: 'row', gap: 10 },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14 },
  secIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 13, fontWeight: '600' },
  qualityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  qualityText: { fontSize: 11, fontWeight: '700' },
  filePreview: { gap: 10 },
  previewImage: { width: '100%', height: 260 },
  docNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, marginBottom: 0 },
  docNoticeText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
