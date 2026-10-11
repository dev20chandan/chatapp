import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../ThemeContext';
import { getActiveChats, subscribeChats, ActiveChat } from '../../chatStore';
import { useDeviceContacts, DeviceContact } from '../../hooks/useDeviceContacts';
import SelectContactModal from '../../components/SelectContactModal';
import ContactPermissionBanner from '../../components/ContactPermissionBanner';

export default function ChatScreen() {
  const { darkMode, toggleTheme, theme } = useTheme();

  // Active chat conversations (only users with messages sent or received)
  const [activeChats, setActiveChats] = useState<ActiveChat[]>(getActiveChats);

  // Device contacts logic separated into hook
  const {
    deviceContacts,
    hasContactPermission,
    loadingContacts,
    refreshing,
    fetchContacts,
    onRefresh,
  } = useDeviceContacts();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'contacts'>('all');

  // Contact Picker Modal state
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // Subscribe to chatStore updates
  useEffect(() => {
    const unsub = subscribeChats(() => {
      setActiveChats(getActiveChats());
    });
    return unsub;
  }, []);

  // Start chat with contact
  const handleOpenChat = (chat: { id: string; name: string }) => {
    if (contactModalVisible) {
      setContactModalVisible(false);
    }
    router.push({
      pathname: '/chat/[id]',
      params: { id: chat.id, name: chat.name },
    });
  };

  // Filter list according to active tab
  // In 'all', ONLY show active chats where messages have been sent or received!
  const displayedChats = useMemo(() => {
    let list: (ActiveChat | DeviceContact)[] = [];

    if (activeFilter === 'contacts') {
      list = deviceContacts;
    } else if (activeFilter === 'unread') {
      list = activeChats.filter((c) => c.unread > 0);
    } else {
      // 'all': ONLY active chats with messages!
      list = activeChats;
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.message.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeFilter, activeChats, deviceContacts, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.header }]} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        {showSearchInput ? (
          <View style={styles.headerSearchWrapper}>
            <TouchableOpacity
              onPress={() => {
                setShowSearchInput(false);
                setSearchQuery('');
              }}
              style={styles.headerBtn}
            >
              <Ionicons name="arrow-back" size={24} color={theme.headerText} />
            </TouchableOpacity>
            <TextInput
              style={[styles.headerSearchInput, { color: theme.headerText }]}
              placeholder="Search chats and contacts..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.headerBtn}>
                <Ionicons name="close-circle" size={20} color={theme.headerText} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <Text style={[styles.headerTitle, { color: theme.headerText }]}>Chat</Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerBtn}
                activeOpacity={0.7}
                onPress={() => fetchContacts(true)}
              >
                <Ionicons name="sync-outline" size={21} color={theme.headerText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerBtn}
                activeOpacity={0.7}
                onPress={() => setShowSearchInput(true)}
              >
                <Ionicons name="search-outline" size={22} color={theme.headerText} />
              </TouchableOpacity>

              {/* Dark / Light Mode Toggle */}
              <TouchableOpacity
                style={styles.headerBtn}
                activeOpacity={0.7}
                onPress={toggleTheme}
              >
                <Ionicons name={darkMode ? 'sunny' : 'moon'} size={21} color={theme.headerText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerBtn}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    'Chat Options',
                    `Active Conversations: ${activeChats.length}\nPhone Contacts: ${deviceContacts.length}\nPermission: ${
                      hasContactPermission ? 'Granted' : 'Not Granted'
                    }`,
                    [
                      { text: 'Sync Contacts', onPress: () => fetchContacts(true) },
                      { text: 'Device Settings', onPress: () => Linking.openSettings() },
                      { text: 'Close', style: 'cancel' },
                    ]
                  )
                }
              >
                <Ionicons name="ellipsis-vertical" size={20} color={theme.headerText} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Filter Tabs / Chips */}
      <View style={[styles.filterBar, { backgroundColor: theme.header }]}>
        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === 'all'
              ? [styles.chipActive, { backgroundColor: darkMode ? '#2a3942' : '#ffffff' }]
              : { backgroundColor: darkMode ? '#182229' : 'rgba(255,255,255,0.15)' },
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text
            style={[
              styles.chipText,
              { color: activeFilter === 'all' ? theme.accent : theme.headerText },
            ]}
          >
            Chats {activeChats.length > 0 ? `(${activeChats.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === 'unread'
              ? [styles.chipActive, { backgroundColor: darkMode ? '#2a3942' : '#ffffff' }]
              : { backgroundColor: darkMode ? '#182229' : 'rgba(255,255,255,0.15)' },
          ]}
          onPress={() => setActiveFilter('unread')}
        >
          <Text
            style={[
              styles.chipText,
              { color: activeFilter === 'unread' ? theme.accent : theme.headerText },
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            activeFilter === 'contacts'
              ? [styles.chipActive, { backgroundColor: darkMode ? '#2a3942' : '#ffffff' }]
              : { backgroundColor: darkMode ? '#182229' : 'rgba(255,255,255,0.15)' },
          ]}
          onPress={() => {
            if (!hasContactPermission && deviceContacts.length === 0) {
              fetchContacts(true);
            }
            setActiveFilter('contacts');
          }}
        >
          <Ionicons
            name="people"
            size={14}
            color={activeFilter === 'contacts' ? theme.accent : theme.headerText}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.chipText,
              { color: activeFilter === 'contacts' ? theme.accent : theme.headerText },
            ]}
          >
            Contacts {deviceContacts.length > 0 ? `(${deviceContacts.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat List Body */}
      <View style={[styles.body, { backgroundColor: theme.background }]}>
        {/* Permission Request Banner if not granted yet */}
        {hasContactPermission === false && <ContactPermissionBanner />}

        {loadingContacts && deviceContacts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.subText }]}>
              Reading device contacts...
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedChats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.accent}
                colors={[theme.accent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={activeFilter === 'contacts' ? 'people-outline' : 'chatbubbles-outline'}
                  size={54}
                  color={theme.subText}
                />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {activeFilter === 'contacts'
                    ? (hasContactPermission === false ? 'Contacts Permission Required' : 'No Contacts Found')
                    : activeFilter === 'unread'
                    ? 'No unread messages'
                    : 'No chats yet'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
                  {searchQuery
                    ? 'No contact or chat matched your search.'
                    : activeFilter === 'contacts'
                    ? 'Sync contacts to see your phonebook contacts here.'
                    : 'Tap the green button below to select a contact and start chatting!'}
                </Text>
                {activeFilter !== 'contacts' && (
                  <TouchableOpacity
                    style={[styles.grantBtn, { backgroundColor: theme.accent, marginTop: 16 }]}
                    onPress={() => {
                      if (deviceContacts.length === 0) {
                        fetchContacts(true);
                      }
                      setContactModalVisible(true);
                    }}
                  >
                    <Text style={styles.grantBtnText}>Select a Contact</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            renderItem={({ item }) => {
              const isDeviceContactItem = (item as any).isDeviceContact;
              return (
                <TouchableOpacity
                  style={[
                    styles.chatItem,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleOpenChat(item)}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: isDeviceContactItem ? '#128c7e' : theme.accent,
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {item.name ? item.name.charAt(0).toUpperCase() : '#'}
                    </Text>
                  </View>

                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.time,
                          { color: item.unread > 0 ? theme.accent : theme.subText },
                          item.unread > 0 && styles.timeUnread,
                        ]}
                      >
                        {item.time}
                      </Text>
                    </View>

                    <View style={styles.chatFooter}>
                      <View style={styles.messageRow}>
                        {isDeviceContactItem && (
                          <Ionicons
                            name="phone-portrait-outline"
                            size={13}
                            color={theme.subText}
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[styles.message, { color: theme.subText }]}
                          numberOfLines={1}
                        >
                          {isDeviceContactItem ? item.phone : item.message}
                        </Text>
                      </View>

                      {item.unread > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                          <Text style={styles.badgeText}>{item.unread}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* WhatsApp Signature Floating Action Button (FAB) */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent }]}
          activeOpacity={0.85}
          onPress={() => {
            if (deviceContacts.length === 0) {
              fetchContacts(true);
            }
            setContactModalVisible(true);
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Select Contact Modal Component */}
      <SelectContactModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        contacts={deviceContacts}
        loading={loadingContacts}
        hasPermission={hasContactPermission}
        onSyncContacts={() => fetchContacts(true)}
        onSelectContact={handleOpenChat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    padding: 8,
    marginLeft: 4,
  },
  headerSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSearchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    marginHorizontal: 8,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 85,
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
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeUnread: {
    fontWeight: '700',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 14,
    flex: 1,
  },
  badge: {
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
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
