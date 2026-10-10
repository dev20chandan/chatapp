import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../ThemeContext';

export default function ProfileScreen() {
  const { darkMode, toggleTheme, theme } = useTheme();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => router.replace('/') },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.header }]} edges={['top']}>
      <StatusBar style="light" />

      {/* WhatsApp Consistent Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Settings</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Search', 'Search settings')}
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
        </View>
      </View>

      <ScrollView style={[styles.body, { backgroundColor: theme.background }]}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.name, { color: theme.text }]}>My Profile</Text>
            <Text style={[styles.status, { color: theme.accent }]}>Available • Online</Text>
          </View>
          <TouchableOpacity
            style={[styles.qrButton, { backgroundColor: darkMode ? '#1f2c34' : '#f4f4f5' }]}
            onPress={() => Alert.alert('QR Code', 'Share your contact QR code')}
          >
            <Ionicons name="qr-code-outline" size={22} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Section 1 */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: darkMode ? '#1e3a5f' : '#e0f2fe' }]}>
              <Ionicons name="key" size={20} color="#3b82f6" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Account</Text>
              <Text style={[styles.settingSubtitle, { color: theme.subText }]}>Privacy, security, change number</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: darkMode ? '#144e32' : '#dcfce7' }]}>
              <Ionicons name="notifications" size={20} color="#22c55e" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: theme.subText }]}>Message, group & call tones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconWrapper, { backgroundColor: darkMode ? '#4a2810' : '#ffedd5' }]}>
              <Ionicons name="help-circle" size={22} color="#f97316" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Help</Text>
              <Text style={[styles.settingSubtitle, { color: theme.subText }]}>Help center, contact us, privacy policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* Theme Settings Row */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={toggleTheme}>
            <View style={[styles.iconWrapper, { backgroundColor: darkMode ? '#3b2f5c' : '#f3e8ff' }]}>
              <Ionicons name={darkMode ? 'moon' : 'sunny'} size={20} color="#a855f7" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Theme</Text>
              <Text style={[styles.settingSubtitle, { color: theme.subText }]}>
                {darkMode ? 'Dark mode enabled' : 'Light mode enabled'}
              </Text>
            </View>
            <Ionicons name="sync-outline" size={18} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Section 2 - Logout */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <View style={[styles.iconWrapper, { backgroundColor: darkMode ? '#451a1a' : '#fee2e2' }]}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: '#ef4444' }]}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 2,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrButton: {
    padding: 10,
    borderRadius: 20,
  },
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
});
