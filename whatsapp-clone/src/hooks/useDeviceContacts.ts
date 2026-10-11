import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking, AppState } from 'react-native';
import {
  Contact,
  ContactField,
  requestPermissionsAsync,
  getPermissionsAsync,
} from 'expo-contacts';

export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
  message: string;
  time: string;
  unread: number;
  isDeviceContact: boolean;
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

      // Permission granted - fetch contacts
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

      setDeviceContacts(list);

      if (showFeedback) {
        if (list.length > 0) {
          Alert.alert('Contacts Synced', `${list.length} phone contacts loaded successfully!`);
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
