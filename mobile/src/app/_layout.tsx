import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#F2F2F7',
          },
        }}>
        <Stack.Screen
          name="index"
          options={{
            title: 'Chats',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Phone Sign In',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="otp"
          options={{
            title: 'Verify Code',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="profile-setup"
          options={{
            title: 'Setup Profile',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            title: 'Chat',
            headerShown: true,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
