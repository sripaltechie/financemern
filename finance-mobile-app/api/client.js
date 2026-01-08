import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/Config';

// Create instance
const api = axios.create({
  baseURL: Config.API_URL,
});

// Interceptor to add Token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const userData = await AsyncStorage.getItem('finance_user');
      if (userData) {
        const { token } = JSON.parse(userData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Error reading token from storage", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;