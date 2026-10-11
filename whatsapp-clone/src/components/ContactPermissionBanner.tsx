import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function ContactPermissionBanner() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.permissionBanner,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={[styles.permissionIcon, { backgroundColor: `${theme.accent}20` }]}>
        <Ionicons name="person-add" size={22} color={theme.accent} />
      </View>
      <View style={styles.permissionInfo}>
        <Text style={[styles.permissionTitle, { color: theme.text }]}>
          Sync Phone Contacts
        </Text>
        <Text style={[styles.permissionSub, { color: theme.subText }]}>
          Enable Contacts in Settings to chat with friends directly
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.permissionBtn, { backgroundColor: theme.accent }]}
        onPress={() => Linking.openSettings()}
      >
        <Text style={styles.permissionBtnText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 8,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  permissionSub: {
    fontSize: 12,
  },
  permissionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
