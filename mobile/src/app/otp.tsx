import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { syncUserProfile } from '../services/api';
import { initSocket } from '../services/socket';

export default function OtpScreen() {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { confirmationResult, phoneForOtp, setUserProfile } = useAuth();
  const router = useRouter();

  const handleVerifyOTP = async () => {
    setErrorMessage('');
    const code = otpCode.trim();

    if (!code || code.length < 6) {
      setErrorMessage('Please enter the full 6-digit OTP verification code.');
      return;
    }

    if (!confirmationResult) {
      setErrorMessage('No OTP verification session found. Please try logging in again.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(code);
      const firebaseUser = userCredential.user;

      // Sync MongoDB User
      const mongoProfile = await syncUserProfile(undefined, firebaseUser.phoneNumber || phoneForOtp);
      setUserProfile(mongoProfile);

      // Connect Socket.IO
      await initSocket();

      setLoading(false);

      if (!mongoProfile.name) {
        router.replace('/profile-setup');
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      console.error('[OTP Verification Error]:', error);
      setLoading(false);
      const msg = error.message || 'Invalid OTP code. Please check and try again.';
      setErrorMessage(msg);
      Alert.alert('Verification Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify OTP Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to {phoneForOtp || 'your phone number'}
          </Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor="#8E8E93"
            keyboardType="number-pad"
            maxLength={6}
            value={otpCode}
            onChangeText={setOtpCode}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}>
            <Text style={styles.backButtonText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C6C70',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#1C1C1E',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#99C7FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});
