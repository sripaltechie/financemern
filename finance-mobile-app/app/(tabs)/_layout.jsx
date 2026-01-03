import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { 
  TouchableOpacity, 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  Pressable, 
  Animated,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Menu, 
  X, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  Bell,
  Search // standard icon for Explore
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * TABS LAYOUT
 * Path: app/(tabs)/_layout.jsx
 */
export default function TabLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    setSidebarVisible(false);
    router.replace('/auth');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
          tabBarHideOnKeyboard: true,
          headerStyle: { 
            backgroundColor: '#fff', 
            elevation: 0, 
            shadowOpacity: 0, 
            borderBottomWidth: 1, 
            borderBottomColor: '#f1f5f9' 
          },
          headerTitleStyle: { 
            fontWeight: 'bold', 
            color: '#0f172a',
            fontSize: 18
          },
          tabBarStyle: {
            height: 110, // Increased as requested to clear system buttons
            paddingBottom: 40, // Increased padding to push icons higher up
            paddingTop: 12,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
            headerLeft: () => (
              <TouchableOpacity 
                style={styles.headerIconLeft}
                onPress={() => setSidebarVisible(true)}
              >
                <Menu color="#0f172a" size={24} />
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="explore" // Fixed Explore Tab
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="customers"
          options={{
            title: 'Customers',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'My Profile',
            tabBarIcon: ({ color, size }) => <UserCircle color={color} size={size} />,
          }}
        />
      </Tabs>

      {/* --- CUSTOM SIDEBAR MODAL --- */}
      <Modal
        animationType="none"
        transparent={true}
        visible={sidebarVisible}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalCloseArea} 
            onPress={() => setSidebarVisible(false)} 
          />
          
          <Animated.View style={styles.sidebarContent}>
            {/* Replaced deprecated SafeAreaView with View + Platform specific padding */}
            <View style={[styles.sidebarInner, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) : 60 }]}>
              <View style={styles.sidebarHeader}>
                <View style={styles.brandContainer}>
                  <View style={styles.logoSmall}><Text style={styles.logoText}>$</Text></View>
                  <Text style={styles.brandName}>Finance App</Text>
                </View>
                <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.sidebarNav}>
                <SidebarItem 
                  icon={<ShieldCheck size={20} color="#64748b" />} 
                  label="Security" 
                  onPress={() => {}}
                />
                <SidebarItem 
                  icon={<Bell size={20} color="#64748b" />} 
                  label="Notifications" 
                  onPress={() => {}}
                />
                <View style={styles.divider} />
                <SidebarItem 
                  icon={<LogOut size={20} color="#ef4444" />} 
                  label="Logout" 
                  onPress={handleLogout}
                  isDestructive
                />
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
        <Text style={[styles.sidebarItemLabel, isDestructive && { color: '#ef4444' }]}>
          {label}
        </Text>
      </View>
      <ChevronRight size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerIconLeft: {
    marginLeft: 18,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  modalCloseArea: {
    flex: 1,
  },
  sidebarContent: {
    width: width * 0.75,
    backgroundColor: '#fff',
    height: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  sidebarInner: {
    flex: 1,
  },
  sidebarHeader: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sidebarNav: {
    padding: 12,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  sidebarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sidebarItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
    marginHorizontal: 16,
  },
  sidebarFooter: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
  }
});