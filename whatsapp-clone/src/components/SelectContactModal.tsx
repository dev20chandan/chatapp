import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { DeviceContact } from '../hooks/useDeviceContacts';

interface SelectContactModalProps {
  visible: boolean;
  onClose: () => void;
  contacts: DeviceContact[];
  loading: boolean;
  hasPermission: boolean | null;
  onSyncContacts: () => void;
  onSelectContact: (contact: { id: string; name: string }) => void;
}

export default function SelectContactModal({
  visible,
  onClose,
  contacts,
  loading,
  hasPermission,
  onSyncContacts,
  onSelectContact,
}: SelectContactModalProps) {
  const { theme } = useTheme();
  const [modalSearch, setModalSearch] = useState('');

  const filteredContacts = useMemo(() => {
    if (!modalSearch.trim()) return contacts;
    const q = modalSearch.toLowerCase().trim();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [contacts, modalSearch]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.header }]} edges={['top']}>
        <StatusBar style="light" />

        {/* Modal Header */}
        <View style={[styles.modalHeader, { backgroundColor: theme.header }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.headerText} />
          </TouchableOpacity>

          <View style={styles.modalHeaderInfo}>
            <Text style={[styles.modalHeaderTitle, { color: theme.headerText }]}>
              Select contact
            </Text>
            <Text style={[styles.modalHeaderSub, { color: theme.subText }]}>
              {contacts.length} contacts on phone
            </Text>
          </View>

          <TouchableOpacity
            onPress={onSyncContacts}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="sync-outline" size={22} color={theme.headerText} />
          </TouchableOpacity>
        </View>

        {/* Modal Search Bar */}
        <View style={[styles.modalSearchContainer, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.modalSearchBox,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.subText} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.modalSearchInput, { color: theme.text }]}
              placeholder="Search contact name or number..."
              placeholderTextColor={theme.subText}
              value={modalSearch}
              onChangeText={setModalSearch}
            />
            {modalSearch.length > 0 && (
              <TouchableOpacity onPress={() => setModalSearch('')}>
                <Ionicons name="close-circle" size={18} color={theme.subText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Modal Contacts List */}
        <View style={[styles.modalListWrapper, { backgroundColor: theme.background }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.subText }]}>
                Loading contacts...
              </Text>
            </View>
          ) : filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.chatItem,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => onSelectContact(item)}
                >
                  <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                    <Text style={styles.avatarText}>
                      {item.name ? item.name.charAt(0).toUpperCase() : '#'}
                    </Text>
                  </View>

                  <View style={styles.chatInfo}>
                    <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                    <View style={styles.messageRow}>
                      <Ionicons
                        name="call-outline"
                        size={13}
                        color={theme.subText}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.message, { color: theme.subText }]}>
                        {item.phone}
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={theme.subText} />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={54} color={theme.subText} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {hasPermission === false
                  ? 'Contacts Permission Required'
                  : 'No Contacts Found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
                {hasPermission === false
                  ? 'Android requires permission to read phone contacts. Please open device settings and allow Contacts.'
                  : 'We could not find any contacts on your phone.'}
              </Text>
              <TouchableOpacity
                style={[styles.grantBtn, { backgroundColor: theme.accent }]}
                onPress={() => {
                  if (hasPermission === false) {
                    Linking.openSettings();
                  } else {
                    onSyncContacts();
                  }
                }}
              >
                <Text style={styles.grantBtnText}>
                  {hasPermission === false ? 'Open Device Settings' : 'Sync Contacts Now'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerBtn: {
    padding: 8,
  },
  modalHeaderInfo: {
    flex: 1,
    marginLeft: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalHeaderSub: {
    fontSize: 12,
  },
  modalSearchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    borderWidth: 1,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  modalListWrapper: {
    flex: 1,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 40,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  message: {
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  grantBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  grantBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
