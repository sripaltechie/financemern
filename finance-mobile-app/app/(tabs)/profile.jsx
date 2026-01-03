import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { UserCircle, Settings, LogOut, ShieldCheck, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Sign out of your account?", [
      { text: "Cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => router.replace('/auth') }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UserCircle color="#2563eb" size={80} strokeWidth={1} />
        <Text style={styles.name}>Field Agent</Text>
        <Text style={styles.role}>Collection Boy</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <ShieldCheck color="#64748b" size={20} />
          <Text style={styles.menuText}>Security</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Bell color="#64748b" size={20} />
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
          <LogOut color="#ef4444" size={20} />
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 16, color: '#0f172a' },
  role: { color: '#64748b', fontSize: 14, marginTop: 4 },
  menu: { marginTop: 20, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  menuText: { fontSize: 16, color: '#1e293b', fontWeight: '500' }
});