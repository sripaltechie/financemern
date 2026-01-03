import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, ArrowDownLeft, Clock, Wallet, Users, ChevronRight, TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * DASHBOARD SCREEN
 * Path: app/(tabs)/index.jsx
 */
export default function Dashboard() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of the session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: () => {
            // Future: Clear AsyncStorage or SecureStore here
            router.replace('/auth');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Area with Greeting & Logout */}
      <View style={styles.topSection}>
        <View>
          <Text style={styles.greeting}>Welcome Back,</Text>
          <Text style={styles.collectorName}>Collector Agent</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#ef4444" size={20} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Primary Collection Target Card */}
      <View style={styles.targetCard}>
        <View style={styles.targetHeader}>
          <Text style={styles.targetLabel}>TODAY'S GOAL</Text>
          <View style={styles.targetBadge}>
            <TrendingUp color="#fff" size={12} />
            <Text style={styles.badgeText}>Active</Text>
          </View>
        </View>
        
        <Text style={styles.targetAmount}>₹ 12,450.00</Text>
        
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '35%' }]} />
          </View>
          <View style={styles.progressDetails}>
            <Text style={styles.progressPercent}>35% Completed</Text>
            <Text style={styles.progressRemaining}>₹ 8,092 left</Text>
          </View>
        </View>
      </View>

      {/* 3. Secondary Stats Row */}
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: '#ecfdf5' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#10b981' }]}>
            <ArrowDownLeft color="#fff" size={16} />
          </View>
          <Text style={styles.statSmallLabel}>Collected</Text>
          <Text style={[styles.statSmallVal, { color: '#065f46' }]}>₹ 4,358</Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: '#fff7ed' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#f59e0b' }]}>
            <Clock color="#fff" size={16} />
          </View>
          <Text style={styles.statSmallLabel}>Overdue</Text>
          <Text style={[styles.statSmallVal, { color: '#9a3412' }]}>12 Dues</Text>
        </View>
      </View>

      {/* 4. Quick Navigation Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Main Operations</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: '#eff6ff' }]}>
            <Wallet color="#2563eb" size={24} />
          </View>
          <Text style={styles.gridLabel}>New Collection</Text>
          <ChevronRight color="#cbd5e1" size={16} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <View style={[styles.gridIcon, { backgroundColor: '#f5f3ff' }]}>
            <Users color="#7c3aed" size={24} />
          </View>
          <Text style={styles.gridLabel}>Assigned List</Text>
          <ChevronRight color="#cbd5e1" size={16} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 20,
    marginBottom: 20
  },
  greeting: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  collectorName: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 6
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  targetCard: { 
    backgroundColor: '#1e293b', 
    marginHorizontal: 20, 
    borderRadius: 24, 
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  targetBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  targetAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 12 },
  progressSection: { marginTop: 8 },
  progressTrack: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6' },
  progressDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  progressPercent: { color: '#fff', fontSize: 12, fontWeight: '600' },
  progressRemaining: { color: '#94a3b8', fontSize: 12 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 20 },
  statItem: { flex: 1, padding: 16, borderRadius: 20, elevation: 1 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statSmallLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  statSmallVal: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  sectionHeader: { paddingHorizontal: 24, marginTop: 30, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  grid: { paddingHorizontal: 20, gap: 12 },
  gridItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  gridIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  gridLabel: { flex: 1, marginLeft: 16, fontSize: 15, fontWeight: '600', color: '#1e293b' }
});