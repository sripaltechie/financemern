import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/client';
import { 
  ChevronLeft, Wallet, User, Plus, 
  TrendingUp, TrendingDown, Lock, Search, Trash2, CreditCard
} from 'lucide-react-native';

/**
 * LENDER CASH ENTRY
 * Features: Type-ahead selection, Multi-payment splitting, Notes
 * Path: app/lender/cash.jsx
 */
export default function LenderCashEntry() {
  const router = useRouter();
  
  // Data States
  const [lenders, setLenders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Search & Selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedLender, setSelectedLender] = useState(null);

  // Form State
  const [type, setType] = useState('Deposit'); // Deposit or Withdrawal
  const [paymentSplits, setPaymentSplits] = useState([{ mode: 'Cash', amount: '' }]);
  const [notes, setNotes] = useState('');

  const totalAmount = useMemo(() => {
    return paymentSplits.reduce((sum, split) => sum + (Number(split.amount) || 0), 0);
  }, [paymentSplits]);

  useEffect(() => {
    checkAccessAndFetch();
  }, []);

  const checkAccessAndFetch = async () => {
    try {
      const userData = await AsyncStorage.getItem('finance_user');
      if (!userData) return;
      
      const parsedUser = JSON.parse(userData);

      const [lendersRes, settingsRes, historyRes] = await Promise.all([
        api.get('/users?role=lender'),
        api.get('/settings'),
        api.get('/lender-transactions')
      ]);

      const allowedBoys = settingsRes.data?.allowedLenderCashBoys || [];
      const hasAccess = parsedUser.role === 'admin' || allowedBoys.includes(parsedUser._id);

      if (!hasAccess) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);
      setLenders(lendersRes.data);
      setTransactions(historyRes.data);
      if (settingsRes.data?.activePaymentModes) {
        setPaymentModes(settingsRes.data.activePaymentModes);
      }
    } catch (err) {
      console.log("Access Fetch Error:", err);
      Alert.alert("Sync Error", "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLenders = useMemo(() => {
    if (!searchQuery) return [];
    return lenders.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.mobile?.includes(searchQuery)
    );
  }, [searchQuery, lenders]);

  const handleLenderSelect = (lender) => {
    setSelectedLender(lender);
    setSearchQuery(lender.name);
    setShowResults(false);
  };

  const addPaymentSplit = () => {
    setPaymentSplits([...paymentSplits, { mode: paymentModes[0]?.name || 'Cash', amount: '' }]);
  };

  const removePaymentSplit = (index) => {
    if (paymentSplits.length === 1) return;
    setPaymentSplits(paymentSplits.filter((_, i) => i !== index));
  };

  const updateSplit = (index, field, value) => {
    const newSplits = [...paymentSplits];
    newSplits[index][field] = value;
    setPaymentSplits(newSplits);
  };

  const handleSubmit = async () => {
    if (!selectedLender || totalAmount <= 0) {
      Alert.alert("Input Required", "Please select a lender and enter valid amounts.");
      return;
    }

    setSubmitting(true);
    try {
      // We send the array of payments to support multi-mode on the backend
      // Backend should handle iterating through payments to update balances
      const payload = {
        lenderId: selectedLender._id,
        type,
        amount: totalAmount, // Total for history
        payments: paymentSplits.map(s => ({ paymentMode: s.mode, amount: Number(s.amount) })),
        notes,
        date: new Date()
      };

      await api.post('/lender-transactions', payload);
      Alert.alert("Success", `${type} of ₹${totalAmount} recorded.`);
      
      // Reset form
      setPaymentSplits([{ mode: 'Cash', amount: '' }]);
      setNotes('');
      setSearchQuery('');
      setSelectedLender(null);
      checkAccessAndFetch();
    } catch (err) {
      Alert.alert("Failed", err.response?.data?.message || "Transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

  if (!isAuthorized) {
    return (
      <View style={styles.center}>
        <View style={styles.lockIcon}><Lock color="#ef4444" size={48} /></View>
        <Text style={styles.forbiddenText}>Access Restricted</Text>
        <TouchableOpacity style={styles.backBtnAction} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft color="#0f172a" size={24} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Lender Cash Entry</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* TYPE-AHEAD LENDER SELECTION */}
        <Text style={styles.labelHeader}>Investor Search</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search color="#94a3b8" size={20} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Type name or mobile..."
              value={searchQuery}
              onChangeText={(txt) => {
                setSearchQuery(txt);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />
            {selectedLender && (
              <TouchableOpacity onPress={() => {setSelectedLender(null); setSearchQuery('');}}>
                <Trash2 color="#ef4444" size={18} />
              </TouchableOpacity>
            )}
          </View>
          
          {showResults && filteredLenders.length > 0 && (
            <View style={styles.resultsDropdown}>
              {filteredLenders.map(l => (
                <TouchableOpacity 
                  key={l._id} 
                  style={styles.resultItem}
                  onPress={() => handleLenderSelect(l)}
                >
                  <Text style={styles.resultName}>{l.name}</Text>
                  <Text style={styles.resultMeta}>{l.mobile} • ₹{l.lenderConfig?.currentBalanceWithAdmin || 0}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selectedLender && (
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balLabel}>Current Pool Balance</Text>
              <Text style={styles.balVal}>₹ {selectedLender.lenderConfig?.currentBalanceWithAdmin?.toLocaleString() || '0'}</Text>
            </View>
            <Wallet color="#1e40af" size={32} opacity={0.2} />
          </View>
        )}

        <View style={styles.card}>
          {/* TRANSACTION TYPE */}
          <View style={styles.typeToggle}>
            {['Deposit', 'Withdrawal'].map(t => (
              <TouchableOpacity 
                key={t} 
                onPress={() => setType(t)} 
                style={[styles.toggle, type === t && { backgroundColor: t === 'Deposit' ? '#10b981' : '#ef4444' }]}
              >
                <Text style={[styles.toggleLabel, type === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* MULTI-PAYMENT SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.fieldLabel}>Payment Breakup</Text>
            <TouchableOpacity style={styles.addSplitBtn} onPress={addPaymentSplit}>
              <Plus size={14} color="#2563eb" />
              <Text style={styles.addSplitText}>Split Mode</Text>
            </TouchableOpacity>
          </View>

          {paymentSplits.map((split, index) => (
            <View key={index} style={styles.splitRow}>
              <View style={styles.splitModeContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(paymentModes.length > 0 ? paymentModes : [{name:'Cash'}]).map(m => (
                    <TouchableOpacity 
                      key={m.name} 
                      style={[styles.miniModeChip, split.mode === m.name && styles.miniModeActive]}
                      onPress={() => updateSplit(index, 'mode', m.name)}
                    >
                      <Text style={[styles.miniModeText, split.mode === m.name && {color: '#fff'}]}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.splitInputContainer}>
                <Text style={styles.splitCurrency}>₹</Text>
                <TextInput 
                  style={styles.splitInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={split.amount}
                  onChangeText={(v) => updateSplit(index, 'amount', v)}
                />
                {paymentSplits.length > 1 && (
                  <TouchableOpacity onPress={() => removePaymentSplit(index)} style={styles.removeSplit}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {/* TOTAL DISPLAY */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total {type} Amount:</Text>
            <Text style={styles.totalVal}>₹ {totalAmount.toLocaleString()}</Text>
          </View>

          {/* NOTES FIELD */}
          <Text style={styles.fieldLabel}>Notes / Reference</Text>
          <TextInput 
            style={styles.notesInput}
            placeholder="Enter bank ref, check number or details..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity 
            style={[styles.saveBtn, type === 'Withdrawal' && { backgroundColor: '#ef4444' }]} 
            onPress={handleSubmit} 
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Record {type} Transaction</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.labelHeader}>Recent Activity</Text>
        {transactions.slice(0, 5).map(item => (
          <View key={item._id} style={styles.txRow}>
            <View style={{flex: 1}}>
              <Text style={styles.txName}>{item.lenderId?.name || 'Investor'}</Text>
              <Text style={styles.txMeta}>{new Date(item.date).toLocaleDateString()} • {item.paymentMode || 'Split'}</Text>
            </View>
            <Text style={[styles.txAmt, { color: item.type === 'Deposit' ? '#10b981' : '#ef4444' }]}>
                {item.type === 'Deposit' ? '+' : '-'} ₹{item.amount}
            </Text>
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
  scroll: { padding: 20 },
  labelHeader: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  searchContainer: { marginBottom: 20, zIndex: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1e293b' },
  resultsDropdown: { backgroundColor: '#fff', position: 'absolute', top: 55, left: 0, right: 0, borderRadius: 12, elevation: 5, borderWhidth: 1, borderColor: '#f1f5f9', maxHeight: 200, overflow: 'hidden' },
  resultItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resultName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  resultMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  balanceCard: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 16, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balLabel: { fontSize: 10, color: '#60a5fa', fontWeight: 'bold', textTransform: 'uppercase' },
  balVal: { fontSize: 24, fontWeight: 'bold', color: '#1e40af' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 24, marginBottom: 24, elevation: 2 },
  typeToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20 },
  toggle: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addSplitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addSplitText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6 },
  splitRow: { marginBottom: 15, backgroundColor: '#f8fafc', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  splitModeContainer: { marginBottom: 8 },
  miniModeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#fff', marginRight: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  miniModeActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  miniModeText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  splitInputContainer: { flexDirection: 'row', alignItems: 'center' },
  splitCurrency: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8', marginRight: 8 },
  splitInput: { flex: 1, height: 40, fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  removeSplit: { marginLeft: 10, padding: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, marginTop: 5, marginBottom: 20 },
  totalLabel: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  totalVal: { fontSize: 20, color: '#1e293b', fontWeight: '900' },
  notesInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', height: 80, textAlignVertical: 'top', marginBottom: 20 },
  saveBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8 },
  txName: { fontWeight: 'bold', color: '#1e293b' },
  txMeta: { fontSize: 10, color: '#94a3b8' },
  txAmt: { fontWeight: 'bold' },
  lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  forbiddenText: { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  backBtnAction: { marginTop: 30, paddingHorizontal: 40, paddingVertical: 12, backgroundColor: '#0f172a', borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: 'bold' }
});