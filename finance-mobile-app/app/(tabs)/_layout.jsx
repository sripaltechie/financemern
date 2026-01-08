import React, { useState, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  TouchableOpacity, StyleSheet, View, Text, Modal, 
  Pressable, Animated, Dimensions, Platform, StatusBar 
} from 'react-native';
import { 
  LayoutDashboard, Users, UserCircle, Menu, X, LogOut, 
  ChevronRight, ShieldCheck, Bell, Banknote, Search, Wallet 
} from 'lucide-react-native';
import api from '../../api/client';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [canAccessLenderCash, setCanAccessLenderCash] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkPermissions();
  }, [sidebarVisible]);

  const checkPermissions = async () => {
    try {
      const userData = await AsyncStorage.getItem('finance_user');
      if (!userData) {
        setCanAccessLenderCash(false);
        setUser(null);
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (parsedUser.role === 'admin') {
        setCanAccessLenderCash(true);
        return;
      }

      if (parsedUser.role === 'collection_boy') {
        const { data } = await api.get('/settings');
        const allowedBoys = data?.allowedLenderCashBoys || []; 
        const isAllowed = allowedBoys.includes(parsedUser._id);
        setCanAccessLenderCash(isAllowed);
      }
    } catch (err) {
      console.log("Permission check failed", err);
    }
  };

  const handleLogout = async () => {
    setSidebarVisible(false);
    await AsyncStorage.removeItem('finance_user');
    router.replace('/auth');
  };

  const navigateTo = (path) => {
    setSidebarVisible(false);
    router.push(path);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
          tabBarHideOnKeyboard: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: 'bold', color: '#0f172a' },
          tabBarStyle: { height: 110, paddingBottom: 40, paddingTop: 12 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />, headerLeft: () => (<TouchableOpacity style={styles.headerIconLeft} onPress={() => setSidebarVisible(true)}><Menu color="#0f172a" size={24} /></TouchableOpacity>) }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }} />
        <Tabs.Screen name="customers" options={{ title: 'Customers', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'My Profile', tabBarIcon: ({ color, size }) => <UserCircle color={color} size={size} /> }} />
      </Tabs>

      <Modal animationType="none" transparent={true} visible={sidebarVisible} onRequestClose={() => setSidebarVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalCloseArea} onPress={() => setSidebarVisible(false)} />
          <Animated.View style={styles.sidebarContent}>
            <View style={[styles.sidebarInner, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) : 60 }]}>
              <View style={styles.sidebarHeader}>
                <View style={styles.brandContainer}>
                  <View style={styles.logoSmall}><Text style={styles.logoText}>$</Text></View>
                  <Text style={styles.brandName}>Finance App</Text>
                </View>
                <TouchableOpacity onPress={() => setSidebarVisible(false)}><X color="#64748b" size={24} /></TouchableOpacity>
              </View>

              <View style={styles.sidebarNav}>
                <SidebarItem icon={<LayoutDashboard size={20} color="#64748b" />} label="Main Dashboard" onPress={() => navigateTo('/(tabs)')} />
                {canAccessLenderCash && (
                  <SidebarItem icon={<Wallet size={20} color="#2563eb" />} label="Lender Cash Entry" onPress={() => navigateTo('/lender/cash')} />
                )}               
                <SidebarItem icon={<ShieldCheck size={20} color="#64748b" />} label="Security" onPress={() => {}} />
                <SidebarItem icon={<Bell size={20} color="#64748b" />} label="Notifications" onPress={() => {}} />
                
                <View style={styles.divider} />
                
                <SidebarItem icon={<LogOut size={20} color="#ef4444" />} label="Logout" onPress={handleLogout} isDestructive />
              </View>

              <View style={styles.sidebarFooter}>
                <Text style={styles.versionText}>Version 1.0.0 (JS)</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function SidebarItem({ icon, label, onPress, isDestructive }) {
  return (
    <TouchableOpacity style={styles.sidebarItem} onPress={onPress}>
      <View style={styles.sidebarItemLeft}>
        {icon}
        <Text style={[styles.sidebarItemLabel, isDestructive && { color: '#ef4444' }]}>{label}</Text>
      </View>
      <ChevronRight size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerIconLeft: { marginLeft: 18, padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  modalCloseArea: { flex: 1 },
  sidebarContent: { width: width * 0.75, backgroundColor: '#fff', height: '100%', elevation: 20 },
  sidebarInner: { flex: 1 },
  sidebarHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoSmall: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  brandName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  sidebarNav: { padding: 12 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12 },
  sidebarItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sidebarItemLabel: { fontSize: 15, fontWeight: '500', color: '#334155' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  sidebarFooter: { position: 'absolute', bottom: 24, left: 24 },
  versionText: { fontSize: 12, color: '#94a3b8' }
});