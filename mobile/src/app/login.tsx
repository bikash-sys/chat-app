import React, { useState, useEffect } from 'react';
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
import { PhoneAuthProvider, ApplicationVerifier } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { setVerificationId, setPhoneForOtp, user, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated with completed profile name, navigate to home
    if (user && userProfile?.name) {
      router.replace('/');
    }
  }, [user, userProfile]);

  const handleSendOTP = async () => {
    setErrorMessage('');
    const formattedPhone = phoneNumber.trim();

    if (!formattedPhone || !formattedPhone.startsWith('+') || formattedPhone.length < 10) {
      setErrorMessage(
        'Please enter a valid phone number in international format starting with + (e.g. +16505553434 or +919999999999).'
      );
      return;
    }

    setLoading(true);
    try {
      setPhoneForOtp(formattedPhone);

      // React Native compatible application verifier without DOM/window/document
      const appVerifier: ApplicationVerifier = {
        type: 'recaptcha',
        verify: async () => '',
        _reset: () => {},
      } as any;

      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(formattedPhone, appVerifier);

      setVerificationId(verificationId);
      setLoading(false);
      router.push('/otp');
    } catch (error: any) {
      console.error('[Login Error]:', error);
      setLoading(false);

      let msg = error.message || 'Failed to send OTP code.';
      if (error.code === 'auth/operation-not-allowed') {
        msg =
          'Phone authentication is not enabled or SMS region is restricted for this Firebase project. Ensure "Phone" is enabled in Firebase Console > Authentication > Sign-in method, and add test phone numbers under "Phone numbers for testing".';
      } else if (error.code === 'auth/invalid-phone-number') {
        msg = 'The phone number format is invalid. Please verify the country code and number.';
      } else if (error.code === 'auth/quota-exceeded') {
        msg = 'SMS quota exceeded. Please use Firebase test phone numbers in Firebase Console.';
      }

      setErrorMessage(msg);
      Alert.alert('Authentication Error', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Mobile Chat</Text>
          <Text style={styles.subtitle}>
            Enter your phone number with country code to receive an OTP code
          </Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+16505553434 or +919999999999"
            placeholderTextColor="#8E8E93"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP Code</Text>
            )}
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
    fontSize: 26,
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
    fontSize: 16,
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
  },
  buttonDisabled: {
    backgroundColor: '#99C7FF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});
