import React from 'react';
import { Modal as RNModal, View, Pressable, StyleSheet } from 'react-native';
import { colors, radii, shadows, spacing, zIndex } from '../../theme/tokens';

interface ModalProps {
  visible: boolean;
  onClose(): void;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="modal"
    >
      <Pressable style={styles.backdrop} onPress={onClose} testID="modal-backdrop">
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          {children}
        </View>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.overlay,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    zIndex: zIndex.modal,
    ...shadows.bottomSheet,
    maxWidth: 400,
    width: '90%',
  },
});
