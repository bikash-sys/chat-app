import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBackendUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Derive host IP automatically from Expo packager host in development
  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost ? debuggerHost.split(':')[0] : null;

  if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
    return `http://${ip}:5001`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001';
  }

  return 'http://localhost:5001';
};

export const API_BASE_URL = getBackendUrl();
