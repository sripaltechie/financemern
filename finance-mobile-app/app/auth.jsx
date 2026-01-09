import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
// Using the centralized API client and Config
import api from '../api/client';
import { Config } from '../constants/Config';
import { 
  User, Lock, Phone, Eye, EyeOff, CheckSquare, Square, ShieldCheck, Briefcase, Key 
} from 'lucide-react-native';

/**
 * Mobile Auth Screen
 * Features: Show/Hide Password, Remember Me, Confirm Password, Protected Admin Role
 * Path: app/auth.jsx
 */

// Define your secret admin key here (In a production app, this should be verified on the backend)
const ADMIN_REGISTRATION_KEY = "hithvi02122023"; 

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: 'collection_boy',
    adminSecret: '' // To verify admin registration
  });

  // Load remembered mobile number on startup
  useEffect(() => {
    const loadSavedMobile = async () => {
      try {
        const saved = await AsyncStorage.getItem('remembered_mobile');
        if (saved) {
          setFormData(prev => ({ ...prev, mobile: saved }));
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Error loading saved mobile", e);
      }
    };
    loadSavedMobile();
  }, []);

  const handleAuth = async () => {
    const { name, mobile, password, confirmPassword, role, adminSecret } = formData;

    // 1. Basic Validation
    if (!mobile || !password || (!isLogin && !name)) {
      Alert.alert("Required Fields", "Please fill in all fields.");
      return;
    }

    // 2. Signup Specific Validation
    if (!isLogin) {
      if (password !== confirmPassword) {
        Alert.alert("Password Error", "Passwords do not match.");
        return;
      }
      
      // Admin Protection Logic
      if (role === 'admin' && adminSecret !== ADMIN_REGISTRATION_KEY) {
        Alert.alert("Unauthorized", "Invalid Admin Secret Key. You cannot register as an admin.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { mobile, password }
        : { name, mobile, password, role };

      // API Call
      const response = await api.post(endpoint, payload);
      const { data } = response;

      // 3. Handle "Remember Me"
      if (rememberMe) {
        await AsyncStorage.setItem('remembered_mobile', mobile);
      } else {
        await AsyncStorage.removeItem('remembered_mobile');
      }

      // 4. Save Auth Data for the Interceptor
      await AsyncStorage.setItem('finance_user', JSON.stringify(data));
      
      Alert.alert("Welcome", `Logged in as ${data.name}`);
      
      // Redirect to dashboard
      router.replace('/(tabs)');

    } catch (err) {
      console.log("Auth Detail Error:", err);
      let errorMessage = "Something went wrong. Please try again.";
      
      if (!err.response) {
        errorMessage = `Network Error. Please verify your Server is running at ${Config.API_URL}`;
      } else {
        errorMessage = err.response.data?.message || errorMessage;
      }

      Alert.alert("Authentication Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>$</Text>
          </View>
          <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>Secure Finance Management</Text>
        </View>

        <View style={styles.card}>
          {/* FULL NAME - Signup Only */}
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User color="#94a3b8" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Full Name" 
                  placeholderTextColor="#cbd5e1"
                  value={formData.name}
                  onChangeText={val => setFormData({...formData, name: val})} 
                />
              </View>
            </View>
          )}
          
          {/* MOBILE NUMBER */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Phone color="#94a3b8" size={20} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Mobile Number" 
                placeholderTextColor="#cbd5e1"
                keyboardType="phone-pad"
                value={formData.mobile}
                onChangeText={val => setFormData({...formData, mobile: val})} 
              />
            </View>
          </View>
          
          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Password" 
                placeholderTextColor="#cbd5e1"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={val => setFormData({...formData, password: val})} 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff color="#94a3b8" size={20} /> : <Eye color="#94a3b8" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* CONFIRM PASSWORD - Signup Only */}
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <ShieldCheck color="#94a3b8" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Repeat Password" 
                  placeholderTextColor="#cbd5e1"
                  secureTextEntry={!showPassword}
                  value={formData.confirmPassword}
                  onChangeText={val => setFormData({...formData, confirmPassword: val})} 
                />
              </View>
            </View>
          )}

          {/* ROLE SELECTION - Signup Only */}
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Join As</Text>
              <View style={styles.roleRow}>
                {[
                  { id: 'collection_boy', label: 'STAFF' },
                  { id: 'lender', label: 'LENDER' },
                  { id: 'admin', label: 'ADMIN' }
                ].map((r) => (
                  <TouchableOpacity 
                    key={r.id} 
                    style={[styles.roleBtn, formData.role === r.id && styles.roleBtnActive]}
                    onPress={() => setFormData({...formData, role: r.id})}
                  >
                    <Text style={[styles.roleText, formData.role === r.id && styles.roleTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* SECRET KEY FIELD - Only if Signup AND Role is Admin */}
          {!isLogin && formData.role === 'admin' && (
            <View style={[styles.inputGroup, { marginTop: 8 }]}>
              <Text style={[styles.label, { color: '#ef4444' }]}>Admin Secret Key</Text>
              <View style={[styles.inputWrapper, { borderColor: '#ef4444' }]}>
                <Key color="#ef4444" size={20} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter Secret Code" 
                  placeholderTextColor="#fca5a5"
                  secureTextEntry
                  value={formData.adminSecret}
                  onChangeText={val => setFormData({...formData, adminSecret: val})} 
                />
              </View>
              <Text style={styles.helperText}>Only authorized administrators can use this role.</Text>
            </View>
          )}

          {/* REMEMBER ME - Login Only */}
          {isLogin && (
            <TouchableOpacity 
              style={styles.rememberRow} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe ? <CheckSquare color="#2563eb" size={20} /> : <Square color="#cbd5e1" size={20} />}
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.mainBtn, loading && { backgroundColor: '#64748b' }]} 
            onPress={handleAuth} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainBtnText}>{isLogin ? 'LOG IN' : 'REGISTER'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setIsLogin(!isLogin);
            setFormData({
              ...formData, 
              password: '', 
              confirmPassword: '', 
              adminSecret: '', 
              role: 'collection_boy'
            });
          }} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isLogin ? "New here? Create an account" : "Have an account? Log in"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { 
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#2563eb', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    elevation: 8, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10
  },
  logoText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { color: '#64748b', marginTop: 4, fontSize: 14 },
  card: { 
    backgroundColor: '#fff', 
    padding: 24, 
    borderRadius: 32, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 20 
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 54, color: '#1e293b', fontSize: 15 },
  eyeIcon: { padding: 8 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 12, 
    backgroundColor: '#f1f5f9', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  roleBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleText: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  roleTextActive: { color: '#fff' },
  helperText: { fontSize: 11, color: '#94a3b8', marginTop: 4, marginLeft: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8, marginLeft: 4 },
  rememberText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  mainBtn: { backgroundColor: '#0f172a', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 8 },
  mainBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  switchBtn: { marginTop: 24, alignItems: 'center' },
  switchText: { color: '#2563eb', fontWeight: '700', fontSize: 14 }
});