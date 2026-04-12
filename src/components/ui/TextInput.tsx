import React from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TextInputProps as RNTextInputProps } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  value: string;
  onChangeText(text: string): void;
  placeholder?: string;
  maxLength?: number;
  error?: string | null;
  testID?: string;
}

export function TextInput({
  value,
  onChangeText,
  placeholder,
  maxLength,
  error,
  testID,
  ...rest
}: TextInputProps) {
  return (
    <View>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.placeholder}
        maxLength={maxLength}
        testID={testID}
        style={[styles.input, !!error && styles.inputError]}
        {...rest}
      />
      {!!error && (
        <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    ...typography.body,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
