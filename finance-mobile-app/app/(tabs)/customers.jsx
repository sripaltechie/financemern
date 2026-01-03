import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { Search, Plus, User, Phone, MapPin, Trash2, Edit3, ChevronRight } from 'lucide-react-native';

// Update with your local IP
const API_URL = 'http://192.168.1.10:5000/api'; 

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/customers`);
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load customers. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  useEffect(() => {
    const filtered = customers.filter(c => 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery)
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const handleDelete = (id, name) => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${name}? This will remove all associated data.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Assuming your backend has a DELETE route or using PUT to deactivate
              // For now, we'll simulate the UI update
              await axios.delete(`${API_URL}/customers/${id}`);
              setCustomers(prev => prev.filter(c => c._id !== id));
              Alert.alert("Success", "Customer removed.");
            } catch (err) {
              Alert.alert("Error", "Could not delete customer.");
            }
          } 
        }
      ]
    );
  };

  const renderCustomerCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <User color="#2563eb" size={24} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.fullName}</Text>
          <View style={styles.row}>
            <Phone size={12} color="#64748b" />
            <Text style={styles.mobile}>{item.mobile}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.level || 'Level 1'}</Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <MapPin size={14} color="#94a3b8" />
        <Text style={styles.address} numberOfLines={1}>
          {item.locations?.residence?.addressText || 'No address provided'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push(`/customer/manage?id=${item._id}`)}
        >
          <Edit3 size={18} color="#2563eb" />
          <Text style={[styles.actionText, { color: '#2563eb' }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleDelete(item._id, item.fullName)}
        >
          <Trash2 size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.viewBtn]}
          onPress={() => router.push(`/customer/details?id=${item._id}`)}
        >
          <Text style={styles.viewBtnText}>View Details</Text>
          <ChevronRight size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by name or mobile..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Customers...</Text>
        </View>
      ) : (
        <FlatList 
          data={filteredCustomers}
          keyExtractor={item => item._id}
          renderItem={renderCustomerCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchCustomers} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/customer/manage')}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchContainer: { 
    margin: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 16, color: '#1e293b' },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: '#dbeafe', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  mobile: { fontSize: 14, color: '#64748b' },
  statusBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  address: { flex: 1, fontSize: 13, color: '#94a3b8' },
  actions: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9', 
    paddingTop: 12,
    gap: 8
  },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingVertical: 8, 
    paddingHorizontal: 12,
    borderRadius: 10
  },
  actionText: { fontSize: 12, fontWeight: 'bold' },
  viewBtn: { backgroundColor: '#0f172a', marginLeft: 'auto' },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  fab: { 
    position: 'absolute', 
    bottom: 130, // Above the 110 height tab bar
    right: 20, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#2563eb', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8' }
});