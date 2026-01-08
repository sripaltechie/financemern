import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api/client';
import { 
  ChevronLeft, Banknote, Calculator, Percent, 
  Plus, Trash2, Wallet, Info, CheckCircle2 
} from 'lucide-react-native';

/**
 * NEW LOAN (CHIT) SCREEN
 * Path: app/loan/create.jsx
 */
export default function CreateLoan() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [lenders, setLenders] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    loanType: 'Daily',
    financials: {
      principalAmount: '',
      interestRate: '2', // Default 2%
      duration: '100',  // Default 100 days
      interestDurationMonths: '3', 
      deductionConfig: {
        interest: 'Upfront',
        adminCommission: 'End',
        staffCommission: 'End'
      },
      adminCommission: { type: 'Percentage', value: '', amount: '0' },
      staffCommission: { type: 'Percentage', value: '', amount: '0' }
    },
    lenderSplits: [], // Local state for UI, will be mapped to 'lenders' for API
    notes: ''
  });

  const [currentLender, setCurrentLender] = useState({ userId: '', amount: '' });

  useEffect(() => {
    fetchInitialData();
  }, [customerId]);

  const fetchInitialData = async () => {
    try {
      const [custRes, lendersRes] = await Promise.all([
        api.get(`/customers/${customerId}`),
        api.get('/users?role=lender')
      ]);
      setCustomer(custRes.data);
      setLenders(lendersRes.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load loan requirements.");
      router.back();
    } finally {
      setFetching(false);
    }
  };

  // --- CALCULATION LOGIC (Memoized) ---
  const calculations = useMemo(() => {
    const principal = Number(formData.financials.principalAmount) || 0;
    const rate = Number(formData.financials.interestRate) || 0;
    const months = Number(formData.financials.interestDurationMonths) || 0;
    const adminComm = Number(formData.financials.adminCommission.amount) || 0;
    const staffComm = Number(formData.financials.staffCommission.amount) || 0;

    let interestDed = 0;
    if (formData.financials.deductionConfig.interest === 'Upfront') {
      interestDed = (principal * rate * months) / 100;
    }

    const netDisbursement = principal - interestDed - 
      (formData.financials.deductionConfig.adminCommission === 'Upfront' ? adminComm : 0) -
      (formData.financials.deductionConfig.staffCommission === 'Upfront' ? staffComm : 0);

    const fundedAmount = formData.lenderSplits.reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      interestDed,
      netDisbursement,
      fundedAmount,
      remaining: netDisbursement - fundedAmount
    };
  }, [formData]);

  const addLenderSplit = () => {
    if (!currentLender.userId || !currentLender.amount) return;
    const lenderObj = lenders.find(l => l._id === currentLender.userId);
    
    if (Number(currentLender.amount) > calculations.remaining) {
      Alert.alert("Overfunded", "Amount exceeds the required funding.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      lenderSplits: [...prev.lenderSplits, { 
        userId: currentLender.userId, 
        name: lenderObj.name, 
        amount: currentLender.amount 
      }]
    }));
    setCurrentLender({ userId: '', amount: '' });
  };

  const removeLender = (index) => {
    setFormData(prev => ({
      ...prev,
      lenderSplits: prev.lenderSplits.filter((_, i) => i !== index)
    }));
  };

  const handleCreate = async () => {
    if (calculations.remaining !== 0) {
      Alert.alert("Incomplete Funding", "Please assign lenders for the full net amount.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId,
        loanType: formData.loanType,
        financials: {
          ...formData.financials,
          principalAmount: Number(formData.financials.principalAmount)
        },
        lenders: formData.lenderSplits.map((l, idx) => ({
          userId: l.userId,
          investedAmount: Number(l.amount),
          priority: idx + 1
        }))
      };

      await api.post('/loans', payload);
      Alert.alert("Success", "Loan disbursed successfully.");
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to create loan.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft color="#0f172a" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Loan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.customerName}>{customer?.fullName}</Text>
        <Text style={styles.customerDetail}>{customer?.mobile} • {customer?.level}</Text>

        {/* 1. Basic Config */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Loan Configuration</Text>
          <View style={styles.row}>
            {['Daily', 'Weekly', 'Monthly'].map(type => (
              <TouchableOpacity 
                key={type} 
                style={[styles.typeBtn, formData.loanType === type && styles.typeBtnActive]}
                onPress={() => setFormData({...formData, loanType: type})}
              >
                <Text style={[styles.typeText, formData.loanType === type && styles.typeTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Financials */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Principal Amount (₹)</Text>
            <TextInput 
              style={styles.mainInput} 
              keyboardType="numeric" 
              placeholder="0.00"
              value={formData.financials.principalAmount}
              onChangeText={val => setFormData({
                ...formData, financials: {...formData.financials, principalAmount: val}
              })}
            />
          </View>

          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 8}}>
              <Text style={styles.label}>Rate (%/Mo)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={formData.financials.interestRate}
                onChangeText={val => setFormData({
                  ...formData, financials: {...formData.financials, interestRate: val}
                })}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Interest Months</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={formData.financials.interestDurationMonths}
                onChangeText={val => setFormData({
                  ...formData, financials: {...formData.financials, interestDurationMonths: val}
                })}
              />
            </View>
          </View>
        </View>

        {/* 3. Calculations Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Interest ({formData.financials.deductionConfig.interest})</Text>
            <Text style={styles.sumVal}>- ₹ {calculations.interestDed}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.sumRow}>
            <Text style={styles.netLabel}>Net Disbursement</Text>
            <Text style={styles.netVal}>₹ {calculations.netDisbursement}</Text>
          </View>
        </View>

        {/* 4. Lender Assignment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Lender Funding</Text>
            <Text style={[styles.remText, calculations.remaining === 0 && {color: '#10b981'}]}>
              {calculations.remaining === 0 ? 'Fully Funded' : `Needed: ₹${calculations.remaining}`}
            </Text>
          </View>

          <View style={styles.lenderForm}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lenderChips}>
              {lenders.map(l => (
                <TouchableOpacity 
                  key={l._id} 
                  style={[styles.miniChip, currentLender.userId === l._id && styles.miniChipActive]}
                  onPress={() => setCurrentLender({...currentLender, userId: l._id})}
                >
                  <Text style={[styles.miniChipText, currentLender.userId === l._id && {color: '#fff'}]}>{l.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, {flex: 1, marginRight: 8}]} 
                placeholder="Amount" 
                keyboardType="numeric"
                value={currentLender.amount}
                onChangeText={val => setCurrentLender({...currentLender, amount: val})}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addLenderSplit}>
                <Plus color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {formData.lenderSplits.map((item, idx) => (
            <View key={idx} style={styles.lenderItem}>
              <Text style={styles.lenderName}>{item.name}</Text>
              <View style={styles.row}>
                <Text style={styles.lenderAmt}>₹ {item.amount}</Text>
                <TouchableOpacity onPress={() => removeLender(idx)}><Trash2 size={16} color="#ef4444" /></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, calculations.remaining !== 0 && {backgroundColor: '#94a3b8'}]} 
          onPress={handleCreate}
          disabled={loading || calculations.remaining !== 0}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>DISBURSE LOAN</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
  scroll: { padding: 20 },
  customerName: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  customerDetail: { color: '#64748b', marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
  remText: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  row: { flexDirection: 'row', alignItems: 'center' },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  typeBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { fontWeight: '600', color: '#64748b' },
  typeTextActive: { color: '#fff' },
  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  mainInput: { fontSize: 32, fontWeight: 'bold', color: '#2563eb', paddingVertical: 10 },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, marginBottom: 24 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumLabel: { color: '#94a3b8', fontSize: 13 },
  sumVal: { color: '#fff', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 12 },
  netLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  netVal: { color: '#10b981', fontSize: 20, fontWeight: 'bold' },
  lenderForm: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderDash: 1, borderColor: '#cbd5e1', marginBottom: 12 },
  lenderChips: { flexDirection: 'row', marginBottom: 12 },
  miniChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  miniChipActive: { backgroundColor: '#0f172a' },
  miniChipText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#2563eb', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  lenderItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, elevation: 1 },
  lenderName: { fontWeight: '600', color: '#1e293b' },
  lenderAmt: { fontWeight: 'bold', color: '#2563eb', marginRight: 10 },
  submitBtn: { backgroundColor: '#10b981', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});