import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { UserProfile } from '../types';
import { syncUserProfile, fetchCurrentUser } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  verificationId: string | null;
  setVerificationId: (id: string | null) => void;
  phoneForOtp: string;
  setPhoneForOtp: (phone: string) => void;
  refreshUserProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [phoneForOtp, setPhoneForOtp] = useState<string>('');

  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    if (!auth.currentUser) return null;
    try {
      const profile = await fetchCurrentUser();
      setUserProfile(profile);
      return profile;
    } catch (e) {
      // If profile doesn't exist yet on backend, try sync
      try {
        const synced = await syncUserProfile(undefined, auth.currentUser.phoneNumber || phoneForOtp);
        setUserProfile(synced);
        return synced;
      } catch (err) {
        console.error('[AuthContext] Error fetching/syncing user profile:', err);
        return null;
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(undefined, firebaseUser.phoneNumber || phoneForOtp);
          setUserProfile(profile);
          await initSocket();
        } catch (err) {
          console.error('[AuthContext] Profile sync error on auth change:', err);
        }
      } else {
        setUserProfile(null);
        disconnectSocket();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    disconnectSocket();
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setVerificationId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        verificationId,
        setVerificationId,
        phoneForOtp,
        setPhoneForOtp,
        refreshUserProfile,
        logout,
        setUserProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
