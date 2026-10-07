import { auth } from '../config/firebase';
import { API_BASE_URL } from '../utils/config';
import { UserProfile, ChatMessage } from '../types';

const getAuthToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      return await currentUser.getIdToken(true);
    } catch (e) {
      console.error('[API] Error getting fresh ID token:', e);
    }
  }
  return null;
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
};

export const syncUserProfile = async (name?: string, phone?: string): Promise<UserProfile> => {
  return fetchWithAuth('/api/users/sync', {
    method: 'POST',
    body: JSON.stringify({ name, phone }),
  });
};

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  return fetchWithAuth('/api/users/me', {
    method: 'GET',
  });
};

export const fetchUsersList = async (): Promise<UserProfile[]> => {
  return fetchWithAuth('/api/users', {
    method: 'GET',
  });
};

export const fetchMessages = async (targetUserId: string): Promise<ChatMessage[]> => {
  return fetchWithAuth(`/api/messages/${targetUserId}`, {
    method: 'GET',
  });
};
