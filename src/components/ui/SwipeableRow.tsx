/**
 * SwipeableRow — deslize para a esquerda para revelar o botão de deletar.
 *
 * Comportamento:
 *  - Arrasta < THRESHOLD → mola de volta (spring back)
 *  - Arrasta ≥ THRESHOLD → snap para posição aberta (mostra botão delete)
 *  - Toca em delete       → animação de colapso vertical + callback
 *  - Toca fora            → spring back
 *
 * Uso:
 *  <SwipeableRow onDelete={() => deleteStudent(id)} label="aluno">
 *    <StudentCard ... />
 *  </SwipeableRow>
 */
import * as Haptics from 'expo-haptics';
import React, { PropsWithChildren, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/ThemeContext';

// Quanto precisa arrastar para abrir o painel de delete
const OPEN_THRESHOLD = 60;
// Largura do painel de delete revelado
const DELETE_WIDTH = 76;

type Props = PropsWithChildren<{
  onDelete: () => void;
  /** Texto opcional no botão delete (default: "Excluir") */
  label?: string;
  /** Se false, desativa o swipe (ex: durante loading) */
  enabled?: boolean;
}>;

export function SwipeableRow({ children, onDelete, label = 'Excluir', enabled = true }: Props) {
  const { colors } = useAppTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(new Animated.Value(1)).current; // usado como scaleY no colapso
  const [isOpen, setIsOpen] = useState(false);
  const [rowH, setRowH] = useState(0);
  const lastX = useRef(0);

  // ── PanResponder ────────────────────────────────────────────────────────────
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        if (!enabled) return false;
        // Só captura movimentos claramente horizontais (dx > dy)
        return Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation((v) => {
          lastX.current = v;
          translateX.setOffset(v);
          translateX.setValue(0);
        });
      },
      onPanResponderMove: (_, g) => {
        // Só permite arrastar para a esquerda (dx negativo)
        const next = Math.min(0, g.dx);
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        const finalX = lastX.current + g.dx;

        if (finalX < -OPEN_THRESHOLD) {
          snapOpen();
        } else {
          snapClose();
        }
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        snapClose();
      },
    })
  ).current;

  // ── Snap open (revelar botão) ────────────────────────────────────────────────
  function snapOpen() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(true);
    Animated.spring(translateX, {
      toValue: -DELETE_WIDTH,
      damping: 20,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }

  // ── Snap close (voltar) ──────────────────────────────────────────────────────
  function snapClose() {
    setIsOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      damping: 20,
      stiffness: 280,
      useNativeDriver: true,
    }).start();
  }

  // ── Delete: colapsar a linha e chamar callback ─────────────────────────────
  function handleDelete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // 1. Slide a linha para fora (continua para a esquerda)
    Animated.timing(translateX, {
      toValue: -360,
      duration: 240,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();

    // 2. Colapsa a altura da linha (margem inclusa)
    Animated.timing(rowHeight, {
      toValue: 0,
      duration: 300,
      delay: 120,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      onDelete();
    });
  }

  function onLayout(e: LayoutChangeEvent) {
    setRowH(e.nativeEvent.layout.height);
  }

  // ── Delete action button (revelado atrás do card) ──────────────────────────
  const deleteButton = (
    <View style={[styles.deleteAction, { width: DELETE_WIDTH, backgroundColor: colors.danger }]}>
      <Pressable
        onPress={handleDelete}
        style={styles.deleteBtn}
        accessibilityLabel={label}
        accessibilityRole="button"
      >
        <Ionicons name="trash" size={19} color="#fff" />
        <Text style={styles.deleteBtnLabel}>{label}</Text>
      </Pressable>
    </View>
  );

  return (
    // Animated.View para o colapso vertical
    <Animated.View
      style={{
        height: rowH > 0
          ? rowHeight.interpolate({ inputRange: [0, 1], outputRange: [0, rowH] })
          : undefined,
        overflow: 'hidden',
      }}
    >
      <View onLayout={onLayout} style={styles.container}>
        {/* Delete panel fixo atrás */}
        <View style={[styles.actionsRight]}>
          {deleteButton}
        </View>

        {/* Conteúdo arrastável */}
        <Animated.View
          style={{ transform: [{ translateX }], flex: 1 }}
          {...pan.panHandlers}
        >
          {/* Tap fora para fechar */}
          <Pressable onPress={isOpen ? snapClose : undefined}>
            {children}
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  actionsRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 18,
    overflow: 'hidden',
  },
  deleteAction: {
    width: DELETE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  deleteBtn: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  deleteBtnLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
});
