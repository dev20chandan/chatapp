import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from './config';

const STORAGE_KEYS = {
  USER_PHONE: '@chat_user_phone',
  USER_NAME: '@chat_user_name',
  IS_LOGGED_IN: '@chat_is_logged_in',
};

export interface AuthSession {
  currentUserPhone: string;
  userName: string;
  isLoggedIn: boolean;
  isLoading: boolean;
}

export let currentUserPhone = '';
export let currentUserName = '';
export let isUserLoggedIn = false;

const listeners = new Set<(session: AuthSession) => void>();

export const notifyAuthChange = (isLoading = false) => {
  const session: AuthSession = {
    currentUserPhone,
    userName: currentUserName,
    isLoggedIn: isUserLoggedIn,
    isLoading,
  };
  listeners.forEach((l) => {
    try {
      l(session);
    } catch (e) {
      console.warn('Auth listener error:', e);
    }
  });
};

export const subscribeAuth = (listener: (session: AuthSession) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Sync user profile to backend MongoDB Atlas
 */
export const syncUserProfileWithBackend = async (
  phone: string,
  name: string,
  about?: string,
) => {
  if (!phone) return;
  try {
    const res = await fetch(`${BACKEND_URL}/users/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        name,
        about: about || 'Hey there! I am using Chat',
      }),
    });
    if (!res.ok) {
      console.warn('Failed to sync profile to backend:', res.status);
    }
  } catch (err) {
    console.warn('Network error syncing profile to backend:', err);
  }
};

// Initialize / load stored session from AsyncStorage
export const initAuthSession = async (): Promise<AuthSession> => {
  try {
    const [phone, name, loggedIn] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.USER_PHONE),
      AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
      AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN),
    ]);

    if (phone && loggedIn === 'true') {
      currentUserPhone = phone;
      currentUserName = name || `User ${phone.slice(-4)}`;
      isUserLoggedIn = true;

      // Sync with backend in background to ensure up-to-date in DB
      syncUserProfileWithBackend(currentUserPhone, currentUserName);
    } else {
      currentUserPhone = '';
      currentUserName = '';
      isUserLoggedIn = false;
    }
  } catch (error) {
    console.warn('Error reading auth session from storage:', error);
    currentUserPhone = '';
    currentUserName = '';
    isUserLoggedIn = false;
  }

  const session: AuthSession = {
    currentUserPhone,
    userName: currentUserName,
    isLoggedIn: isUserLoggedIn,
    isLoading: false,
  };
  notifyAuthChange(false);
  return session;
};

// Login user and persist to AsyncStorage & MongoDB
export const setCurrentUserPhone = async (phone: string, name?: string) => {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  currentUserPhone = cleanPhone;
  currentUserName = name || `User ${cleanPhone.slice(-4)}`;
  isUserLoggedIn = true;

  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER_PHONE, cleanPhone),
      AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, currentUserName),
      AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true'),
    ]);
  } catch (error) {
    console.warn('Error saving auth session to storage:', error);
  }

  // Register / sync in MongoDB backend
  syncUserProfileWithBackend(currentUserPhone, currentUserName);

  notifyAuthChange(false);
};

// Update display name and sync to backend MongoDB
export const updateUserName = async (newName: string) => {
  if (!newName || !newName.trim()) return;
  const trimmed = newName.trim();
  currentUserName = trimmed;

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, trimmed);
  } catch (error) {
    console.warn('Error saving updated name to storage:', error);
  }

  // Sync with MongoDB backend
  if (currentUserPhone) {
    await syncUserProfileWithBackend(currentUserPhone, trimmed);
  }

  notifyAuthChange(false);
};

// Logout user and clear from AsyncStorage
export const logoutUser = async () => {
  currentUserPhone = '';
  currentUserName = '';
  isUserLoggedIn = false;

  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER_PHONE),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_NAME),
      AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN),
    ]);
  } catch (error) {
    console.warn('Error clearing auth session from storage:', error);
  }

  notifyAuthChange(false);
};
