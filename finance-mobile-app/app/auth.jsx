import React, { useState } from 'react';
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
import axios from 'axios';
import { Config } from '../constants/Config';


// Safely handle expo-router for preview environment
let useRouter;
try {
  useRouter = require('expo-router').useRouter;
} catch (e) {
  useRouter = () => ({ replace: (path) => console.log('Navigating to:', path) });
}

/**
 * Mobile Auth Screen with Backend Integration
 * Path: app/auth.jsx
 */

// IMPORTANT: Replace with your computer's local IP address (e.g., 192.168.1.5)
// Do NOT use 'localhost' as physical devices cannot see 'localhost' of your computer.
// const API_URL = 'http://10.193.116.230:5000/api'; 

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    role: 'collection_boy' // Default role
  });

  const handleAuth = async () => {
    // 1. Validation
    if (!formData.mobile || !formData.password || (!isLogin && !formData.name)) {
      Alert.alert("Missing Fields", "Please fill in all required information.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { mobile: formData.mobile, password: formData.password }
        : formData;

      // 2. Call your MERN Backend
      const response = await axios.post(`${Config.API_URL}${endpoint}`, payload);
      const { data } = response;

      // 3. Success Feedback
      Alert.alert("Success", `Welcome back, ${data.name}!`);
      
      // Note: You should save data.token to AsyncStorage for persistence
      
      // 4. Navigate to the main application
      router.replace('/(tabs)');

    } catch (err) {
      console.log("Auth Error:", err);
      const errorMsg = err.response?.data?.message || "Connection failed. Check your IP and ensure server is running.";
      Alert.alert("Authentication Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>$</Text>
          </View>
          <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
          <Text style={styles.subtitle}>Finance Management System</Text>
        </View>

        <View style={styles.card}>
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter your name" 
                placeholderTextColor="#94a3b8"
                onChangeText={val => setFormData({...formData, name: val})} 
              />
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput 
              style={styles.input} 
              placeholder="9876543210" 
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              onChangeText={val => setFormData({...formData, mobile: val})} 
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#94a3b8"
              secureTextEntry
              onChangeText={val => setFormData({...formData, password: val})} 
            />
          </View>

          {!isLogin && (
            <View style={styles.roleContainer}>
              <Text style={styles.label}>Select Role</Text>
              <View style={styles.roleRow}>
                {['collection_boy', 'lender', 'admin'].map(r => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.roleBtn, formData.role === r && styles.roleBtnActive]}
                    onPress={() => setFormData({...formData, role: r})}
                  >
                    <Text style={[styles.roleText, formData.role === r && styles.roleTextActive]}>
                      {r.split('_')[0].toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.mainBtn} 
            onPress={handleAuth} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainBtnText}>{isLogin ? 'LOGIN' : 'REGISTER'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isLogin ? "New user? Create an account" : "Have an account? Sign in"}
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
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { 
    width: 60, height: 60, borderRadius: 18, backgroundColor: '#2563eb', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  logoText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 28, elevation: 4 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  input: { 
    backgroundColor: '#f1f5f9', padding: 16, borderRadius: 14, 
    borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b' 
  },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  roleBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  roleBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleText: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  roleTextActive: { color: '#fff' },
  mainBtn: { backgroundColor: '#0f172a', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  mainBtnText: { color: '#fff', fontWeight: 'bold' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#2563eb', fontWeight: '600' }
});