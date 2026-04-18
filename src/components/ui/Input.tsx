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
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const isPassword = useMemo(() => !!secureTextEntry, [secureTextEntry]);

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text style={[styles.label, { color: colors.softText }]}>{label}</Text>
        ) : null}

        <View
          style={[
            styles.field,
            { borderColor: colors.border, backgroundColor: colors.input },
            focused && { borderColor: colors.accent, backgroundColor: colors.surface },
            hasError && { borderColor: colors.danger },
          ]}
        >
          {leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={18}
              color={hasError ? colors.danger : focused ? colors.accent : colors.mutedText}
              style={styles.leftIcon}
            />
          ) : null}

          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }, style]}
            placeholderTextColor={colors.mutedText}
            secureTextEntry={isPassword ? !visible : false}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />

          {isPassword ? (
            <Pressable onPress={() => setVisible((v) => !v)} style={styles.eye}>
              <Ionicons
                name={visible ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.mutedText}
              />
            </Pressable>
          ) : null}
        </View>

        {errorText ? (
          <Text style={[styles.helper, { color: colors.danger }]}>{errorText}</Text>
        ) : null}
        {!errorText && helperText ? (
          <Text style={[styles.helper, { color: colors.mutedText }]}>{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  field: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
  },
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    minHeight: 54,
  },
  eye: {
    paddingLeft: theme.spacing.sm,
  },
  helper: {
    ...theme.typography.bodySmall,
  },
});
