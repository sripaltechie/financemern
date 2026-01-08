import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api/client';
import { 
  ChevronLeft, Banknote, Calculator, Percent, 
  Plus, Trash2, Wallet, Info, CheckCircle2, ShieldAlert,
  ArrowRight, Landmark
} from 'lucide-react-native';

export default function CreateLoan() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  
  const [customer, setCustomer] = useState(null);
  const [lenders, setLenders] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [collectionBoys, setCollectionBoys] = useState([]);
  
  // Link Collection Boy State
  const [missingLinkMode, setMissingLinkMode] = useState(false);
  const [selectedBoyId, setSelectedBoyId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    loanType: 'Daily',
    disbursementMode: 'Cash',
    financials: {
      principalAmount: '',
      interestRate: '', 
      duration: '100', 
      interestDurationMonths: '3',
      fixedInstallmentAmount: '', 
      deductionConfig: {
        interest: 'End',
        adminCommission: 'End', 
        staffCommission: 'End' 
      },
      adminCommission: { type: 'Percentage', value: '', amount: '' },
      staffCommission: { type: 'Percentage', value: '', amount: '' }
    },
    penaltyConfig: { method: 'None', value: 0, frequency: 'OneTime' },
    notes: '' 
  });

  const [currentLender, setCurrentLender] = useState({ userId: '', amount: '' });
  const [lenderSplits, setLenderSplits] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [customerId]);

  const fetchInitialData = async () => {
    try {
      const [custRes, lendersRes, settingsRes, staffRes] = await Promise.all([
        api.get(`/customers/${customerId}`),
        api.get('/users?role=lender'),
        api.get('/settings'),
        api.get('/users?role=collection_boy')
      ]);
      
      setCustomer(custRes.data);
      setLenders(lendersRes.data);
      setCollectionBoys(staffRes.data);
      if (settingsRes.data?.activePaymentModes) {
        setPaymentModes(settingsRes.data.activePaymentModes);
      }
      
      // Check for Collection Boy Link
      if (!custRes.data.collectionBoyId) {
        setMissingLinkMode(true);
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load data.");
    } finally {
      setFetching(false);
    }
  };

  const handleLinkBoy = async () => {
    if (!selectedBoyId) return;
    setLoading(true);
    try {
      await api.put(`/customers/${customerId}`, { collectionBoyId: selectedBoyId });
      setCustomer({ ...customer, collectionBoyId: selectedBoyId });
      setMissingLinkMode(false);
    } catch (err) {
      Alert.alert("Error", "Linking failed");
    } finally {
      setLoading(false);
    }
  };

  // --- CALCULATION LOGIC ---
  const calcs = useMemo(() => {
    const principal = Number(formData.financials.principalAmount) || 0;
    const rate = Number(formData.financials.interestRate) || 0;
    const intMonths = Number(formData.financials.interestDurationMonths) || 0;
    const adminCommVal = Number(formData.financials.adminCommission.amount) || 0;
    const staffCommVal = Number(formData.financials.staffCommission.amount) || 0;

    let interestDed = 0;
    if (formData.financials.deductionConfig.interest === 'Upfront') {
      interestDed = (principal * rate * intMonths) / 100;
    }

    const adminDed = formData.financials.deductionConfig.adminCommission === 'Upfront' ? adminCommVal : 0;
    const staffDed = formData.financials.deductionConfig.staffCommission === 'Upfront' ? staffCommVal : 0;

    const netDisbursement = principal - interestDed - adminDed - staffDed;
    const fundedTotal = lenderSplits.reduce((sum, item) => sum + Number(item.amount), 0);
    const remaining = netDisbursement - fundedTotal;

    return { interestDed, netDisbursement, fundedTotal, remaining };
  }, [formData, lenderSplits]);

  const handleCommissionChange = (who, field, value) => {
    const principal = Number(formData.financials.principalAmount) || 0;
    let newAmount = 0;
    let newPercent = 0;

    if (field === 'value') { 
        newPercent = Number(value);
        newAmount = (principal * newPercent) / 100;
        setFormData(prev => ({ 
          ...prev, 
          financials: { ...prev.financials, [who]: { ...prev.financials[who], value: value, amount: newAmount.toString() } } 
        }));
    } else { 
        newAmount = Number(value);
        newPercent = principal > 0 ? (newAmount / principal) * 100 : 0;
        setFormData(prev => ({ 
          ...prev, 
          financials: { ...prev.financials, [who]: { ...prev.financials[who], value: newPercent.toFixed(2), amount: value } } 
        }));
    }
  };

  const addLenderSplit = () => {
    if (!currentLender.userId || !currentLender.amount) return;
    const lenderObj = lenders.find(l => l._id === currentLender.userId);
    const balance = lenderObj?.lenderConfig?.currentBalanceWithAdmin || 0;

    if (Number(currentLender.amount) > balance) {
      Alert.alert("Insufficient Balance", `Lender only has ₹${balance}`);
      return;
    }
    if (Number(currentLender.amount) > calcs.remaining) {
      Alert.alert("Exceeds Funding", "Amount is more than required.");
      return;
    }

    setLenderSplits([...lenderSplits, { 
      userId: currentLender.userId, 
      name: lenderObj.name, 
      amount: currentLender.amount,
      priority: lenderSplits.length + 1 
    }]);
    setCurrentLender({ userId: '', amount: '' });
  };

  const handleSubmit = async () => {
    if (calcs.remaining !== 0) {
      Alert.alert("Funding Mismatch", "Lender splits must match net disbursement.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        customerId,
        financials: {
          ...formData.financials,
          principalAmount: Number(formData.financials.principalAmount)
        },
        lenders: lenderSplits.map(l => ({ 
          userId: l.userId, 
          investedAmount: Number(l.amount), 
          priority: l.priority 
        }))
      };

      await api.post('/loans', payload);
      Alert.alert("Disbursed", "Loan created successfully");
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.response?.data?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  if (missingLinkMode) {
    return (
      <View style={styles.linkContainer}>
        <ShieldAlert color="#f59e0b" size={60} />
        <Text style={styles.linkTitle}>Link Collection Boy</Text>
        <Text style={styles.linkSubtitle}>This customer needs an assigned staff member before issuing a loan.</Text>
        <View style={styles.pickerBox}>
          {collectionBoys.map(boy => (
            <TouchableOpacity 
              key={boy._id} 
              style={[styles.boyBtn, selectedBoyId === boy._id && styles.boyBtnActive]}
              onPress={() => setSelectedBoyId(boy._id)}
            >
              <Text style={[styles.boyText, selectedBoyId === boy._id && {color: '#fff'}]}>{boy.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.confirmLinkBtn} onPress={handleLinkBoy} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmLinkText}>Assign & Continue</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft color="#0f172a" size={24} /></TouchableOpacity>
        <View style={{marginLeft: 12}}>
          <Text style={styles.headerTitle}>New Loan</Text>
          <Text style={styles.customerSub}>{customer?.fullName}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Core Config */}
        <View style={styles.row}>
          <View style={{flex: 1, marginRight: 8}}>
            <Text style={styles.label}>Loan Type</Text>
            <View style={styles.typeRow}>
              {['Daily', 'Weekly', 'Monthly'].map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[styles.typeSmallBtn, formData.loanType === t && styles.typeSmallBtnActive]}
                  onPress={() => setFormData({...formData, loanType: t})}
                >
                  <Text style={[styles.typeSmallText, formData.loanType === t && {color: '#fff'}]}>{t[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{flex: 1.5}}>
             <Text style={styles.label}>Mode</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection: 'row'}}>
                {paymentModes.map(m => (
                  <TouchableOpacity 
                    key={m.name} 
                    style={[styles.modeChip, formData.disbursementMode === m.name && styles.modeChipActive]}
                    onPress={() => setFormData({...formData, disbursementMode: m.name})}
                  >
                    <Text style={[styles.modeText, formData.disbursementMode === m.name && {color: '#fff'}]}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>
        </View>

        {/* Primary Inputs */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Principal Amount (₹)</Text>
            <TextInput 
              style={styles.mainInput} 
              keyboardType="numeric" 
              placeholder="0"
              value={formData.financials.principalAmount}
              onChangeText={val => setFormData({
                ...formData, financials: {...formData.financials, principalAmount: val}
              })}
            />
          </View>

          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 8}}>
              <Text style={styles.label}>Rate (%/mo)</Text>
              <TextInput 
                style={styles.input} keyboardType="numeric"
                value={formData.financials.interestRate}
                onChangeText={val => setFormData({...formData, financials: {...formData.financials, interestRate: val}})}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Int. Calc (Months)</Text>
              <TextInput 
                style={[styles.input, {backgroundColor: '#eff6ff'}]} keyboardType="numeric"
                value={formData.financials.interestDurationMonths}
                onChangeText={val => setFormData({...formData, financials: {...formData.financials, interestDurationMonths: val}})}
              />
            </View>
          </View>

          <View style={[styles.row, {marginTop: 12}]}>
            <View style={{flex: 1}}>
              <Text style={styles.label}>{formData.loanType === 'Daily' ? 'Days' : formData.loanType === 'Weekly' ? 'Weeks' : 'Months'}</Text>
              <TextInput 
                style={styles.input} keyboardType="numeric"
                value={formData.financials.duration}
                onChangeText={val => setFormData({...formData, financials: {...formData.financials, duration: val}})}
              />
            </View>
            {formData.loanType === 'Weekly' && (
              <View style={{flex: 1.5, marginLeft: 8}}>
                <Text style={styles.label}>Fixed Installment (₹)</Text>
                <TextInput 
                  style={[styles.input, {borderColor: '#f59e0b'}]} keyboardType="numeric"
                  placeholder="Optional"
                  value={formData.financials.fixedInstallmentAmount}
                  onChangeText={val => setFormData({...formData, financials: {...formData.financials, fixedInstallmentAmount: val}})}
                />
              </View>
            )}
          </View>
        </View>

        {/* Deductions Section */}
        <Text style={styles.sectionLabel}>Deductions & Toggles</Text>
        <View style={styles.formCard}>
          <DeductionToggle 
            label="Interest" 
            value={formData.financials.deductionConfig.interest}
            onToggle={(val) => setFormData({
              ...formData, 
              financials: { ...formData.financials, deductionConfig: { ...formData.financials.deductionConfig, interest: val } }
            })}
          />
          
          <DeductionToggle 
            label="Admin Commission" 
            value={formData.financials.deductionConfig.adminCommission}
            onToggle={(val) => setFormData({
              ...formData, 
              financials: { ...formData.financials, deductionConfig: { ...formData.financials.deductionConfig, adminCommission: val } }
            })}
          />
          <View style={styles.commRow}>
            <TextInput style={[styles.input, {flex: 1}]} placeholder="%" value={formData.financials.adminCommission.value} onChangeText={v => handleCommissionChange('adminCommission', 'value', v)} />
            <TextInput style={[styles.input, {flex: 2, fontWeight: 'bold'}]} placeholder="₹ Amt" value={formData.financials.adminCommission.amount} onChangeText={v => handleCommissionChange('adminCommission', 'amount', v)} />
          </View>

          <DeductionToggle 
            label="Staff Commission" 
            value={formData.financials.deductionConfig.staffCommission}
            onToggle={(val) => setFormData({
              ...formData, 
              financials: { ...formData.financials, deductionConfig: { ...formData.financials.deductionConfig, staffCommission: val } }
            })}
          />
          <View style={styles.commRow}>
            <TextInput style={[styles.input, {flex: 1}]} placeholder="%" value={formData.financials.staffCommission.value} onChangeText={v => handleCommissionChange('staffCommission', 'value', v)} />
            <TextInput style={[styles.input, {flex: 2, fontWeight: 'bold'}]} placeholder="₹ Amt" value={formData.financials.staffCommission.amount} onChangeText={v => handleCommissionChange('staffCommission', 'amount', v)} />
          </View>
        </View>

        {/* Funding */}
        <View style={styles.summaryBox}>
           <View style={styles.sumLine}>
             <Text style={styles.sumText}>Total Deductions</Text>
             <Text style={styles.sumAmt}>₹ {calcs.interestDed + 
               (formData.financials.deductionConfig.adminCommission === 'Upfront' ? Number(formData.financials.adminCommission.amount) : 0) +
               (formData.financials.deductionConfig.staffCommission === 'Upfront' ? Number(formData.financials.staffCommission.amount) : 0)
             }</Text>
           </View>
           <View style={styles.netLine}>
             <Text style={styles.netLabel}>Net Disburse</Text>
             <Text style={styles.netAmt}>₹ {calcs.netDisbursement}</Text>
           </View>
        </View>

        <View style={styles.lenderSection}>
          <Text style={[styles.sectionLabel, {marginBottom: 8}]}>Lender Assignment</Text>
          <Text style={[styles.fundStatus, calcs.remaining === 0 && {color: '#10b981'}]}>
             {calcs.remaining === 0 ? '✓ Fully Funded' : `Need: ₹${calcs.remaining}`}
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {lenders.map(l => (
              <TouchableOpacity 
                key={l._id} 
                style={[styles.miniChip, currentLender.userId === l._id && styles.miniChipActive]}
                onPress={() => setCurrentLender({...currentLender, userId: l._id})}
              >
                <Text style={[styles.chipText, currentLender.userId === l._id && {color: '#fff'}]}>{l.name} (₹{l.lenderConfig?.currentBalanceWithAdmin || 0})</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.addLenderRow}>
            <TextInput 
              style={[styles.input, {flex: 1, marginRight: 8}]} 
              placeholder="Funding Amt" 
              keyboardType="numeric"
              value={currentLender.amount}
              onChangeText={v => setCurrentLender({...currentLender, amount: v})}
              onFocus={() => !currentLender.amount && calcs.remaining > 0 && setCurrentLender(p => ({...p, amount: calcs.remaining.toString()}))}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addLenderSplit}>
              <Plus color="#fff" size={20} />
            </TouchableOpacity>
          </View>

          {lenderSplits.map((item, idx) => (
            <View key={idx} style={styles.splitItem}>
               <Text style={styles.splitName}>{item.name}</Text>
               <View style={styles.row}>
                 <Text style={styles.splitAmt}>₹ {item.amount}</Text>
                 <TouchableOpacity onPress={() => setLenderSplits(lenderSplits.filter((_, i) => i !== idx))}>
                   <Trash2 size={16} color="#ef4444" />
                 </TouchableOpacity>
               </View>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.disburseBtn, (calcs.remaining !== 0 || loading) && {backgroundColor: '#94a3b8'}]}
          onPress={handleSubmit}
          disabled={loading || calcs.remaining !== 0}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.disburseText}>DISBURSE NOW</Text>}
        </TouchableOpacity>
        
        <View style={{height: 40}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const DeductionToggle = ({ label, value, onToggle }) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <View style={styles.toggleContainer}>
      {['Upfront', 'End'].map(t => (
        <TouchableOpacity 
          key={t} 
          onPress={() => onToggle(t)}
          style={[styles.toggleBtn, value === t && styles.toggleBtnActive]}
        >
          <Text style={[styles.toggleText, value === t && {color: '#fff'}]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  customerSub: { fontSize: 12, color: '#64748b' },
  scroll: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 20, elevation: 2, marginBottom: 16 },
  mainInput: { fontSize: 32, fontWeight: 'bold', color: '#2563eb', paddingVertical: 8 },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 14, color: '#1e293b' },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeSmallBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  typeSmallBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeSmallText: { fontWeight: 'bold', color: '#64748b', fontSize: 12 },
  modeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  modeChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  modeText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 12, marginTop: 4 },
  formCard: { backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWhidth: 1, borderColor: '#f1f5f9', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  toggleLabel: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#2563eb' },
  toggleText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  commRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryBox: { backgroundColor: '#0f172a', padding: 20, borderRadius: 20, marginBottom: 20 },
  sumLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumText: { color: '#94a3b8', fontSize: 13 },
  sumAmt: { color: '#fff', fontWeight: 'bold' },
  netLine: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 12 },
  netLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  netAmt: { color: '#10b981', fontSize: 22, fontWeight: 'bold' },
  fundStatus: { fontSize: 12, fontWeight: 'bold', color: '#ef4444', marginBottom: 10 },
  chipScroll: { marginBottom: 12 },
  miniChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  miniChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  addLenderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addBtn: { backgroundColor: '#2563eb', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  splitItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, elevation: 1 },
  splitName: { fontWeight: '600', color: '#1e293b' },
  splitAmt: { fontWeight: 'bold', color: '#2563eb', marginRight: 8 },
  disburseBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  disburseText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  linkContainer: { flex: 1, backgroundColor: '#fff', padding: 40, justifyContent: 'center', alignItems: 'center' },
  linkTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 20 },
  linkSubtitle: { color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  pickerBox: { width: '100%', marginTop: 30, gap: 10 },
  boyBtn: { padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  boyBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  boyText: { fontWeight: '600', color: '#1e293b' },
  confirmLinkBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, width: '100%', marginTop: 20, alignItems: 'center' },
  confirmLinkText: { color: '#fff', fontWeight: 'bold' }
});