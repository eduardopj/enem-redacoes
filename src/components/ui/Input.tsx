import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

type InputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
};

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      helperText,
      errorText,
      style,
      leftIcon,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    const { colors } = useAppTheme();
    const hasError = !!errorText;
    const [visible, setVisible] = useState(false);
    const isPassword = useMemo(() => !!secureTextEntry, [secureTextEntry]);

    return (
      <View style={styles.wrapper}>
        {label ? <Text style={[styles.label, { color: colors.softText }]}>{label}</Text> : null}

        <View style={[
          styles.field,
          { borderColor: colors.border, backgroundColor: colors.input },
          hasError && { borderColor: colors.danger },
        ]}>
          {leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={18}
              color={hasError ? colors.danger : colors.softText}
              style={styles.leftIcon}
            />
          ) : null}

          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }, style]}
            placeholderTextColor={colors.mutedText}
            secureTextEntry={isPassword ? !visible : false}
            {...props}
          />

          {isPassword ? (
            <Pressable onPress={() => setVisible((v) => !v)} style={styles.eye}>
              <Ionicons
                name={visible ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.softText}
              />
            </Pressable>
          ) : null}
        </View>

        {errorText ? <Text style={[styles.error, { color: colors.danger }]}>{errorText}</Text> : null}
        {!errorText && helperText ? <Text style={[styles.helper, { color: colors.mutedText }]}>{helperText}</Text> : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.monoLabel,
  },
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    minHeight: 56,
  },
  eye: {
    paddingLeft: theme.spacing.sm,
  },
  helper: {
    ...theme.typography.bodySmall,
  },
  error: {
    ...theme.typography.bodySmall,
  },
});