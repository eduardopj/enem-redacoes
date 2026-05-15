import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastConfig = {
  message: string;
  type?: ToastType;
  duration?: number;
};

type ToastContextValue = {
  showToast: (config: ToastConfig) => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Internal toast state ────────────────────────────────────────────────────

type ToastItem = ToastConfig & { id: string };

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((config: ToastConfig) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), { ...config, id }]); // max 3 toasts
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastLayer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Toast layer (renders all active toasts) ─────────────────────────────────

function ToastLayer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.layer, { bottom: Math.max(insets.bottom + 80, 100) }]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastBubble key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

// ─── Single toast bubble ─────────────────────────────────────────────────────

function ToastBubble({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { colors } = useAppTheme();
  const ty = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss(toast.id));
  }, [onDismiss, opacity, toast.id, ty]);

  React.useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.spring(ty, { toValue: 0, damping: 18, stiffness: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 200, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(dismiss, toast.duration ?? 3200);
    return () => clearTimeout(timer);
  }, []);

  const config = TOAST_CONFIG[toast.type ?? 'info'];
  const bg = config.bg(colors);
  const iconColor = config.iconColor(colors);

  return (
    <Pressable onPress={dismiss} accessibilityLabel="Fechar notificação">
      <Animated.View
        style={[
          styles.bubble,
          { backgroundColor: bg, transform: [{ translateY: ty }, { scale }], opacity },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
          <Ionicons name={config.icon} size={17} color={iconColor} />
        </View>
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {toast.message}
        </Text>
        <Ionicons name="close-outline" size={16} color={colors.mutedText} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Config by type ───────────────────────────────────────────────────────────

type Colors = Record<string, string>;

const TOAST_CONFIG: Record<
  ToastType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    bg: (c: Colors) => string;
    iconColor: (c: Colors) => string;
  }
> = {
  success: {
    icon: 'checkmark-circle',
    bg: (c) => c.surface,
    iconColor: (c) => c.success,
  },
  error: {
    icon: 'close-circle',
    bg: (c) => c.surface,
    iconColor: (c) => c.danger,
  },
  warning: {
    icon: 'warning',
    bg: (c) => c.surface,
    iconColor: (c) => c.warning,
  },
  info: {
    icon: 'information-circle',
    bg: (c) => c.surface,
    iconColor: (c) => c.accent,
  },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 9999,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
