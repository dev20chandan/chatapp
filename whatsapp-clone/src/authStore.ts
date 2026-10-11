import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Login user and persist to AsyncStorage
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
