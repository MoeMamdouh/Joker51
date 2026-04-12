import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/src/theme/tokens';

export default function GameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Game Board — Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.heading,
    color: colors.text.primary,
  },
});
