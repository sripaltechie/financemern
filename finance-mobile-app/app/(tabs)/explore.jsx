import { StyleSheet, Text, View } from 'react-native';

/**
 * EXPLORE
 * A page for searching customers or loans.
 */
export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Look up customers and loan details.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#666', marginTop: 10 }
});