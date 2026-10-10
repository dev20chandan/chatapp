import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { setCurrentUserPhone } from '../authStore';
import { useTheme } from '../ThemeContext';

export default function LoginScreen() {
  const { darkMode, toggleTheme, theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);

  const handleSendOtp = () => {
    if (phoneNumber.length >= 10) {
      setStep(2);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length > 0) {
      setCurrentUserPhone(phoneNumber);
      router.replace('/(tabs)/chat');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.header }]} edges={['top']}>
      <StatusBar style="light" />

      {/* WhatsApp Consistent Top Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.header }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>WhatsApp</Text>

        <TouchableOpacity
          style={styles.themeToggleBtn}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons name={darkMode ? 'sunny' : 'moon'} size={21} color={theme.headerText} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.content, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: darkMode ? '#1f2c34' : '#dcfce7' }]}>
            <Text style={styles.icon}>📱</Text>
          </View>
          <Text style={[styles.title, { color: theme.accent }]}>Verify Phone</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Enter your details to securely log into your account.
          </Text>
        </View>

        <View style={styles.formContainer}>
          {step === 1 ? (
            <View style={styles.formContent}>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.prefix, { color: theme.subText }]}>+1</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Phone number"
                  placeholderTextColor={theme.subText}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.accent },
                  phoneNumber.length < 10 && styles.buttonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={phoneNumber.length < 10}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContent}>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.card, borderColor: theme.border, justifyContent: 'center' },
                ]}
              >
                <TextInput
                  style={[styles.otpInput, { color: theme.text }]}
                  placeholder="------"
                  placeholderTextColor={theme.subText}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.accent },
                  otp.length < 6 && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={otp.length < 6}
              >
                <Text style={styles.buttonText}>Verify & Login</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(1)} style={styles.goBack}>
                <Text style={[styles.goBackText, { color: theme.accent }]}>Wrong number? Go back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
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
  themeToggleBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 340,
  },
  formContent: {
    width: '100%',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  prefix: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 14,
  },
  otpInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 10,
    paddingVertical: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  goBack: {
    marginTop: 18,
    padding: 8,
  },
  goBackText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
