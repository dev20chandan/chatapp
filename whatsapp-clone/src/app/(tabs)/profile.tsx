import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../ThemeContext';
import {
  currentUserPhone,
  currentUserName,
  logoutUser,
  updateUserName,
  subscribeAuth,
} from '../../authStore';

export default function ProfileScreen() {
  const { darkMode, toggleTheme, theme } = useTheme();

  const [userName, setUserName] = useState(currentUserName);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newNameInput, setNewNameInput] = useState(currentUserName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUserName(currentUserName);
    const unsub = subscribeAuth((session) => {
      setUserName(session.userName);
    });
    return unsub;
  }, []);

  const handleOpenEditName = () => {
    setNewNameInput(userName);
    setEditModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!newNameInput.trim()) {
      Alert.alert('Invalid Name', 'Name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      await updateUserName(newNameInput.trim());
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your display name has been updated and synced to the database!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update name.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          router.replace('/');
        },
      },
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
            <Text style={styles.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {userName || 'My Account'}
              </Text>
              <TouchableOpacity
                onPress={handleOpenEditName}
                style={[styles.editIconBtn, { backgroundColor: `${theme.accent}15` }]}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={15} color={theme.accent} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.status, { color: theme.accent }]}>
              {currentUserPhone ? `+91 ${currentUserPhone}` : 'Available • Online'}
            </Text>
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
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={handleOpenEditName}
          >
            <View style={[styles.iconWrapper, { backgroundColor: darkMode ? '#1e3a5f' : '#e0f2fe' }]}>
              <Ionicons name="person" size={20} color="#3b82f6" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Profile Name</Text>
              <Text style={[styles.settingSubtitle, { color: theme.subText }]}>
                {userName || 'Set your display name'}
              </Text>
            </View>
            <Ionicons name="pencil" size={16} color={theme.accent} />
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

      {/* Edit Name Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Your Name</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
              This name will be visible to your contacts on Chat.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter your name..."
              placeholderTextColor={theme.subText}
              value={newNameInput}
              onChangeText={setNewNameInput}
              autoFocus
              maxLength={30}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => setEditModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={[styles.modalBtnText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
                onPress={handleSaveName}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#ffffff', fontWeight: 'bold' }]}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
    maxWidth: '80%',
  },
  editIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 18,
    lineHeight: 18,
  },
  modalInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
