import { Redirect } from 'expo-router';

/**
 * Entry Point
 * Path: app/index.jsx
 */
export default function Index() {
  // Future logic: Check for a stored JWT token in AsyncStorage here.
  // If no token exists, redirect to /auth.
  return <Redirect href="/auth" />;
}