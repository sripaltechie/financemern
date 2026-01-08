import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { 
  ChevronLeft, Save, MapPin, User, ShieldCheck, 
  Users, FileText, Check, Plus, Trash2, Search, Briefcase 
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { Config } from '../../constants/Config';

// IMPORTANT: Replace with your actual computer IP
// const API_URL = 'http://192.168.1.10:5000/api'; 

export default function ManageCustomer() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [collectionBoys, setCollectionBoys] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); // For Referrer search

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    locations: {
      residence: { addressText: '' },
      collectionPoint: { 
        addressText: '', 
        placeType: 'Home', 
        geo: { lat: null, lng: null } 
      }
    },
    kyc: {
      aadhaarNumber: '',
      panCardNumber: '',
      rationCardNumber: ''
    },
    familyMembers: [],
    incomeSource: 'Daily Wage',
    incomeAmount: '',
    proofs: [],
    referredBy: '',
    collectionBoyId: ''
  });

  const [newFamily, setNewFamily] = useState({ name: '', relation: '', mobile: '' });

  useEffect(() => {
    fetchInitialData();
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [boysRes, custRes] = await Promise.all([
        axios.get(`${Config.API_URL}/users?role=collection_boy`),
        axios.get(`${Config.API_URL}/customers`)
      ]);
      setCollectionBoys(boysRes.data);
      setAllCustomers(custRes.data);
    } catch (err) {
      console.log("Error fetching staff/customers:", err);
    }
  };

  const fetchCustomerDetails = async () => {
    setFetching(true);
    try {
      const { data } = await axios.get(`${Config.API_URL}/customers/${id}`);
      setFormData({
        ...data,
        incomeAmount: data.incomeAmount?.toString() || '',
        referredBy: data.referredBy?._id || data.referredBy || '',
        collectionBoyId: data.collectionBoyId?._id || data.collectionBoyId || ''
      });
    } catch (err) {
      Alert.alert("Error", "Could not load customer data. Check your connection.");
    } finally {
      setFetching(false);
    }
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setFormData(prev => ({
      ...prev,
      locations: {
        ...prev.locations,
        collectionPoint: {
          ...prev.locations.collectionPoint,
          geo: { lat: location.coords.latitude, lng: location.coords.longitude }
        }
      }
    }));
    Alert.alert("Location Saved", "Current coordinates captured.");
  };

  const handleAddFamily = () => {
    if (!newFamily.name || !newFamily.relation) return;
    setFormData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { ...newFamily }]
    }));
    setNewFamily({ name: '', relation: '', mobile: '' });
  };

  const removeFamily = (index) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const toggleProof = (proof) => {
    const exists = formData.proofs.includes(proof);
    setFormData(prev => ({
      ...prev,
      proofs: exists ? prev.proofs.filter(p => p !== proof) : [...prev.proofs, proof]
    }));
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.mobile) {
      Alert.alert("Required Fields", "Name and Mobile are mandatory.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        incomeAmount: Number(formData.incomeAmount) || 0
      };

      if (id) {
        await axios.put(`${Config.API_URL}/customers/${id}`, payload);
        Alert.alert("Success", "Customer updated successfully.");
      } else {
        await axios.post(`${Config.API_URL}/customers`, payload);
        Alert.alert("Success", "Customer created successfully.");
      }
      router.back();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save customer. Is server running?";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Fetching details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{id ? 'Edit Profile' : 'New Customer'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Personal & Income */}
        <SectionHeader icon={<User size={18} color="#2563eb" />} title="Basic Info" />
        <View style={styles.formCard}>
          <CustomInput 
            label="Full Name *" 
            value={formData.fullName}
            onChangeText={(val) => setFormData({...formData, fullName: val})}
          />
          <CustomInput 
            label="Mobile Number *" 
            keyboardType="phone-pad"
            value={formData.mobile}
            onChangeText={(val) => setFormData({...formData, mobile: val})}
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Income Source</Text>
              <View style={styles.pickerContainer}>
                <TextInput 
                  style={styles.input}
                  value={formData.incomeSource}
                  placeholder="e.g. Salary"
                  onChangeText={(val) => setFormData({...formData, incomeSource: val})}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput 
                label="Monthly Income" 
                keyboardType="numeric"
                value={formData.incomeAmount}
                onChangeText={(val) => setFormData({...formData, incomeAmount: val})}
              />
            </View>
          </View>
        </View>

        {/* Locations */}
        <SectionHeader icon={<MapPin size={18} color="#2563eb" />} title="Location Details" />
        <View style={styles.formCard}>
          <CustomInput 
            label="Home Address" 
            multiline
            value={formData.locations.residence.addressText}
            onChangeText={(val) => setFormData({
              ...formData, 
              locations: { ...formData.locations, residence: { addressText: val } }
            })}
          />
          
          <View style={styles.divider} />
          
          <View style={styles.collectionHeader}>
            <Text style={styles.label}>Collection Point Type</Text>
            <TouchableOpacity onPress={getCurrentLocation} style={styles.locBtn}>
              <MapPin size={14} color="#2563eb" />
              <Text style={styles.locBtnText}>Get GPS</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.chipRow}>
            {['Home', 'Shop', 'Other'].map(type => (
              <TouchableOpacity 
                key={type}
                style={[styles.chip, formData.locations.collectionPoint.placeType === type && styles.chipActive]}
                onPress={() => setFormData({
                  ...formData,
                  locations: { ...formData.locations, collectionPoint: { ...formData.locations.collectionPoint, placeType: type } }
                })}
              >
                <Text style={[styles.chipText, formData.locations.collectionPoint.placeType === type && styles.chipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* KYC */}
        <SectionHeader icon={<ShieldCheck size={18} color="#2563eb" />} title="KYC Records" />
        <View style={styles.formCard}>
          <CustomInput 
            label="Aadhaar Number" 
            keyboardType="numeric"
            value={formData.kyc.aadhaarNumber}
            onChangeText={(val) => setFormData({ ...formData, kyc: { ...formData.kyc, aadhaarNumber: val } })}
          />
          <CustomInput 
            label="PAN Card Number" 
            autoCapitalize="characters"
            value={formData.kyc.panCardNumber}
            onChangeText={(val) => setFormData({ ...formData, kyc: { ...formData.kyc, panCardNumber: val } })}
          />
          <CustomInput 
            label="Ration Card Number" 
            value={formData.kyc.rationCardNumber}
            onChangeText={(val) => setFormData({ ...formData, kyc: { ...formData.kyc, rationCardNumber: val } })}
          />
        </View>

        {/* Proofs */}
        <SectionHeader icon={<FileText size={18} color="#2563eb" />} title="Proofs Submitted" />
        <View style={styles.formCard}>
          <View style={styles.proofGrid}>
            {['Aadhaar Card', 'Ration Card', 'Green Sheet', 'Promissory Note', 'Cheque'].map(proof => (
              <TouchableOpacity 
                key={proof} 
                style={[styles.proofItem, formData.proofs.includes(proof) && styles.proofActive]}
                onPress={() => toggleProof(proof)}
              >
                {formData.proofs.includes(proof) ? <Check size={14} color="#fff" /> : <Plus size={14} color="#64748b" />}
                <Text style={[styles.proofText, formData.proofs.includes(proof) && styles.proofTextActive]}>{proof}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Family Members */}
        <SectionHeader icon={<Users size={18} color="#2563eb" />} title="Family / Nominees" />
        <View style={styles.formCard}>
          {formData.familyMembers.map((member, idx) => (
            <View key={idx} style={styles.familyItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.familyName}>{member.name} ({member.relation})</Text>
                <Text style={styles.familyMobile}>{member.mobile || 'No mobile'}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFamily(idx)}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          
          <View style={styles.addFamilyRow}>
            <TextInput 
              style={[styles.input, { flex: 2, marginRight: 4 }]} 
              placeholder="Name" 
              value={newFamily.name}
              onChangeText={v => setNewFamily({...newFamily, name: v})}
            />
            <TextInput 
              style={[styles.input, { flex: 1, marginRight: 4 }]} 
              placeholder="Rel." 
              value={newFamily.relation}
              onChangeText={v => setNewFamily({...newFamily, relation: v})}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddFamily}>
              <Plus color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Assignment */}
        <SectionHeader icon={<Briefcase size={18} color="#2563eb" />} title="Assignments" />
        <View style={styles.formCard}>
          <Text style={styles.label}>Assign Collection Boy</Text>
          <View style={styles.pickerContainer}>
            <TextInput 
              style={styles.input}
              placeholder="Select Staff..."
              value={collectionBoys.find(b => b._id === formData.collectionBoyId)?.name || ''}
              onTouchStart={() => {
                // In a real app, open a picker modal
                // For now, let's just cycle through for demo or alert
                if (collectionBoys.length > 0) {
                  const currentIndex = collectionBoys.findIndex(b => b._id === formData.collectionBoyId);
                  const nextIndex = (currentIndex + 1) % collectionBoys.length;
                  setFormData({...formData, collectionBoyId: collectionBoys[nextIndex]._id});
                }
              }}
            />
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Referred By</Text>
          <View style={styles.pickerContainer}>
             <TextInput 
              style={styles.input}
              placeholder="Search Customer..."
              value={allCustomers.find(c => c._id === formData.referredBy)?.fullName || ''}
              onChangeText={() => {}} // Handle search logic
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save color="#fff" size={20} />
              <Text style={styles.submitText}>{id ? 'UPDATE CUSTOMER' : 'CREATE CUSTOMER'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const SectionHeader = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    {icon}
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const CustomInput = ({ label, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput 
      style={[styles.input, props.multiline && { height: 80, textAlignVertical: 'top' }]} 
      placeholderTextColor="#94a3b8"
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16, color: '#0f172a' },
  scroll: { padding: 16, paddingBottom: 60 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 10, marginLeft: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  input: { 
    backgroundColor: '#f1f5f9', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 15,
    color: '#1e293b'
  },
  row: { flexDirection: 'row' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  collectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', padding: 6, borderRadius: 8 },
  locBtnText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  chipText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  chipTextActive: { color: '#2563eb' },
  proofGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  proofItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f1f5f9', borderWhidht: 1, borderColor: '#e2e8f0' },
  proofActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  proofText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  proofTextActive: { color: '#fff' },
  familyItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 8 },
  familyName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  familyMobile: { fontSize: 12, color: '#64748b' },
  addFamilyRow: { flexDirection: 'row', marginTop: 8 },
  addBtn: { backgroundColor: '#0f172a', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pickerContainer: { marginBottom: 4 },
  submitBtn: { 
    backgroundColor: '#2563eb', 
    padding: 18, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    marginTop: 20,
    elevation: 4
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' }
});