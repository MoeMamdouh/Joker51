import React, { useEffect } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { colors, radii, shadows, zIndex } from '../../theme/tokens';

const DISMISS_THRESHOLD_Y = 80;
const DISMISS_VELOCITY = 500;

interface BottomSheetProps {
  visible: boolean;
  onDismiss(): void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onDismiss, children }: BottomSheetProps) {
  const translateY = useSharedValue(300);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(300, { damping: 20, stiffness: 200 });
    }
  }, [visible, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD_Y || e.velocityY > DISMISS_VELOCITY) {
        translateY.value = withSpring(300, { damping: 20 });
        // onDismiss is a JS callback — must use runOnJS from a worklet
        runOnJS(onDismiss)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      testID="bottom-sheet-modal"
    >
      {/* Modal renders in a new native root — needs its own GestureHandlerRootView */}
      <GestureHandlerRootView style={styles.rootView}>
        <Pressable style={styles.backdrop} onPress={onDismiss} testID="bottom-sheet-backdrop" />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, sheetStyle]} testID="bottom-sheet">
            <View style={styles.handle} />
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.backdrop,
    zIndex: zIndex.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: 32,
    zIndex: zIndex.modal,
    ...shadows.bottomSheet,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});
