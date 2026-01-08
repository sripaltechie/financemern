// apiConfig.js
import Constants from 'expo-constants';

// This pulls the IP address Expo is currently using to bundle your app
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || 'localhost';

// Replace 3000 with your backend port
export const API_URL = `http://${localhost}:5000`;