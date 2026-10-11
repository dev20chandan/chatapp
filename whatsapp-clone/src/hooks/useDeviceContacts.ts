import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking, AppState } from 'react-native';
import {
  Contact,
  ContactField,
  requestPermissionsAsync,
  getPermissionsAsync,
} from 'expo-contacts';
import { BACKEND_URL } from '../config';

export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
  message: string;
  time: string;
  unread: number;
  isDeviceContact: boolean;
  isOnPlatform?: boolean;
  platformName?: string;
  about?: string;
}

export const sanitizePhoneNumber = (raw: string): string => {
  return raw.replace(/[\s\-\(\)]/g, '');
};

export function useDeviceContacts() {
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [hasContactPermission, setHasContactPermission] = useState<boolean | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContacts = useCallback(async (showFeedback = false) => {
    if (Platform.OS === 'web') {
      setHasContactPermission(false);
      return;
    }

    try {
      setLoadingContacts(true);

      // Check current permission first
      let perm = await getPermissionsAsync();
      if (!perm.granted && perm.canAskAgain) {
        perm = await requestPermissionsAsync();
      }

      setHasContactPermission(perm.granted);

      if (!perm.granted) {
        if (showFeedback) {
          Alert.alert(
            'Permission Required',
            'Please allow Contacts permission in your device settings to chat with your phone contacts.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
        return;
      }

      // Permission granted - fetch device contacts locally
      const list: DeviceContact[] = [];
      const seenNumbers = new Set<string>();

      try {
        // Modern Expo SDK 57 Contact.getAllDetails
        const details = await Contact.getAllDetails([
          ContactField.FULL_NAME,
          ContactField.GIVEN_NAME,
          ContactField.FAMILY_NAME,
          ContactField.PHONES,
        ]);

        if (details && details.length > 0) {
          for (const item of details) {
            const phones = (item as any).phones;
            if (phones && Array.isArray(phones) && phones.length > 0) {
              for (const p of phones) {
                if (p && p.number) {
                  const cleaned = sanitizePhoneNumber(p.number);
                  if (cleaned.length >= 7 && !seenNumbers.has(cleaned)) {
                    seenNumbers.add(cleaned);
                    const name =
                      (item as any).fullName ||
                      `${(item as any).givenName || ''} ${(item as any).familyName || ''}`.trim() ||
                      cleaned;

                    list.push({
                      id: cleaned,
                      phone: cleaned,
                      name,
                      message: 'Hey there! I am using Chat',
                      time: 'Contact',
                      unread: 0,
                      isDeviceContact: true,
                      isOnPlatform: false,
                    });
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (classErr) {
        console.warn('Class API getAllDetails failed, attempting legacy fallback:', classErr);
        try {
          const LegacyContacts = await import('expo-contacts/legacy');
          const res = await LegacyContacts.getContactsAsync({
            fields: [LegacyContacts.Fields.PhoneNumbers],
          });
          if (res && res.data && res.data.length > 0) {
            for (const item of res.data) {
              if (item.phoneNumbers && item.phoneNumbers.length > 0) {
                for (const p of item.phoneNumbers) {
                  if (p.number) {
                    const cleaned = sanitizePhoneNumber(p.number);
                    if (cleaned.length >= 7 && !seenNumbers.has(cleaned)) {
                      seenNumbers.add(cleaned);
                      const name =
                        item.name ||
                        `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
                        cleaned;

                      list.push({
                        id: cleaned,
                        phone: cleaned,
                        name,
                        message: 'Hey there! I am using Chat',
                        time: 'Contact',
                        unread: 0,
                        isDeviceContact: true,
                        isOnPlatform: false,
                      });
                      break;
                    }
                  }
                }
              }
            }
          }
        } catch (legacyErr) {
          console.warn('Legacy contacts fallback also failed:', legacyErr);
        }
      }

      // Check registered users from backend WITHOUT sending contacts
      // Only registered platform users are fetched, matching happens 100% locally on device
      try {
        const res = await fetch(`${BACKEND_URL}/users`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.users)) {
            const registeredMap = new Map<
              string,
              { phone: string; name: string; about?: string }
            >();
            data.users.forEach((u: any) => {
              const norm = (u.phone || '').replace(/\D/g, '').slice(-10);
              if (norm) {
                registeredMap.set(norm, u);
              }
            });

            for (const item of list) {
              const norm = item.phone.replace(/\D/g, '').slice(-10);
              if (registeredMap.has(norm)) {
                const reg = registeredMap.get(norm)!;
                item.isOnPlatform = true;
                item.platformName = reg.name;
                item.about = reg.about;
                item.message = reg.about || 'Hey there! I am using Chat';
              }
            }

            // Prioritize registered platform users at the top
            list.sort((a, b) => {
              if (a.isOnPlatform && !b.isOnPlatform) return -1;
              if (!a.isOnPlatform && b.isOnPlatform) return 1;
              return a.name.localeCompare(b.name);
            });
          }
        }
      } catch (fetchErr) {
        console.warn('Could not fetch registered users from backend:', fetchErr);
      }

      setDeviceContacts(list);

      if (showFeedback) {
        const onPlatformCount = list.filter((c) => c.isOnPlatform).length;
        if (list.length > 0) {
          Alert.alert(
            'Contacts Synced',
            `${list.length} phone contacts loaded!\n${onPlatformCount} contacts are on Chat.`
          );
        } else {
          Alert.alert(
            'No Contacts Found',
            'No contacts with phone numbers found on this device.'
          );
        }
      }
    } catch (err: any) {
      console.warn('Error accessing device contacts:', err);
      if (showFeedback) {
        Alert.alert(
          'Device Permission Needed',
          'Please allow contacts permission from your phone settings to load contacts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } finally {
      setLoadingContacts(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(false);

    // Auto refresh contacts when user returns from phone Settings
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchContacts(false);
      }
    });

    return () => {
      appStateSub.remove();
    };
  }, [fetchContacts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContacts(false);
  }, [fetchContacts]);

  return {
    deviceContacts,
    hasContactPermission,
    loadingContacts,
    refreshing,
    fetchContacts,
    onRefresh,
  };
}
