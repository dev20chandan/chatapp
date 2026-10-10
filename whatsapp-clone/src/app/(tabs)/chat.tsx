import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { currentUserPhone } from '../../authStore';
import { useTheme } from '../../ThemeContext';

export default function ChatScreen() {
  const { darkMode, toggleTheme, theme } = useTheme();

  const otherPhone = currentUserPhone === '9999999999' ? '8888888888' : '9999999999';
  const otherName = currentUserPhone === '9999999999' ? 'User 88888' : 'User 99999';

  const DUMMY_CHATS = [
    { id: otherPhone, name: otherName, message: 'Tap to chat!', time: 'Now', unread: 1 },
    { id: '1', name: 'John Doe', message: 'Hey, how are you?', time: '10:00 AM', unread: 2 },
    { id: '2', name: 'Family Group', message: 'Mom: Dinner is ready', time: 'Yesterday', unread: 5 },
    { id: '3', name: 'Tech Team', message: 'Meeting at 3 PM today', time: 'Yesterday', unread: 0 },
    { id: '4', name: 'Alice Smith', message: 'See you tomorrow!', time: 'Monday', unread: 0 },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.header }]} edges={['top']}>
      <StatusBar style="light" />

      {/* WhatsApp Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>WhatsApp</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Camera', 'Open camera')}
          >
            <Ionicons name="camera-outline" size={22} color={theme.headerText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Search', 'Search chats and messages')}
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
            onPress={() => Alert.alert('Options', 'New group, Starred messages, Settings')}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat List Body */}
      <View style={[styles.body, { backgroundColor: theme.background }]}>
        <FlatList
          data={DUMMY_CHATS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name } })}
            >
              <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
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
                  <Text style={[styles.message, { color: theme.subText }]} numberOfLines={1}>
                    {item.message}
                  </Text>
                  {item.unread > 0 && (
                    <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
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
  body: {
    flex: 1,
  },
  listContainer: {
    padding: 12,
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
  message: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
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
});
