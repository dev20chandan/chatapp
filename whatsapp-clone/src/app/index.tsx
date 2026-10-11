import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { initAuthSession, setCurrentUserPhone } from '../authStore';
import { useTheme } from '../ThemeContext';

export default function LoginScreen() {
  const { darkMode, toggleTheme, theme } = useTheme();

  // Session checking state
  const [checkingSession, setCheckingSession] = useState(true);

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;

    initAuthSession().then((session) => {
      if (isMounted) {
        if (session.isLoggedIn && session.currentUserPhone) {
          // Already logged in! Auto-redirect to chats
          router.replace('/(tabs)/chat');
        } else {
          setCheckingSession(false);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Handle Send OTP
  const handleSendOtp = () => {
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length >= 10) {
      setStep(2);
      setTimer(30);
      setCanResend(false);
      setOtp('');
      Alert.alert(
        'Verification Code Sent',
        `A 6-digit code has been sent to +91 ${cleanDigits}.\n\n(For testing, use code: 123456)`
      );
    } else {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
    }
  };

  // Handle Verify OTP & Create Session
  const handleVerifyOtp = async () => {
    if (otp.trim().length >= 4) {
      setIsSubmitting(true);
      try {
        const cleanDigits = phoneNumber.replace(/\D/g, '');
        await setCurrentUserPhone(cleanDigits);
        router.replace('/(tabs)/chat');
      } catch (e) {
        Alert.alert('Error', 'Failed to save session. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
    }
  };

  // Resend OTP
  const handleResendOtp = () => {
    setTimer(30);
    setCanResend(false);
    setOtp('');
    Alert.alert('New Code Sent', 'New verification code sent: 123456');
  };

  // Auto fill demo OTP
  const handleAutoFillOtp = () => {
    setOtp('123456');
  };

  // Splash screen while checking session
  if (checkingSession) {
    return (
      <SafeAreaView style={[styles.splashContainer, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
        <View style={[styles.splashIconBox, { backgroundColor: `${theme.accent}18` }]}>
          <Ionicons name="chatbubble-ellipses" size={60} color={theme.accent} />
        </View>
        <Text style={[styles.splashTitle, { color: theme.text }]}>Chat</Text>
        <Text style={[styles.splashSubtitle, { color: theme.subText }]}>
          Connecting your session...
        </Text>
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.header }]} edges={['top']}>
      <StatusBar style="light" />

      {/* Top Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.header }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Chat</Text>

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
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: darkMode ? '#1f2c34' : '#dcfce7' },
            ]}
          >
            <Text style={styles.icon}>📱</Text>
          </View>
          <Text style={[styles.title, { color: theme.accent }]}>
            {step === 1 ? 'Verify Phone' : 'Enter Verification Code'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            {step === 1
              ? 'Enter your mobile number to sign in and stay connected.'
              : `We sent a 6-digit code to +91 ${phoneNumber}`}
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
                <Text style={[styles.prefix, { color: theme.subText }]}>+91</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={theme.subText}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
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
                activeOpacity={0.8}
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
                  (otp.length < 4 || isSubmitting) && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={otp.length < 4 || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Log In</Text>
                )}
              </TouchableOpacity>

              {/* Demo auto-fill shortcut */}
              <TouchableOpacity
                style={[styles.demoFillBtn, { borderColor: `${theme.accent}40` }]}
                onPress={handleAutoFillOtp}
                activeOpacity={0.7}
              >
                <Text style={[styles.demoFillText, { color: theme.accent }]}>
                  ⚡ Use Demo Code (123456)
                </Text>
              </TouchableOpacity>

              <View style={styles.otpFooter}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={[styles.resendText, { color: theme.accent }]}>
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.timerText, { color: theme.subText }]}>
                    Resend code in {timer}s
                  </Text>
                )}

                <TouchableOpacity onPress={() => setStep(1)} style={styles.goBack}>
                  <Text style={[styles.goBackText, { color: theme.accent }]}>
                    Edit number
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 14,
  },
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
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
  demoFillBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  demoFillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  otpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  resendText: {
    fontWeight: '700',
    fontSize: 14,
  },
  timerText: {
    fontSize: 13,
  },
  goBack: {
    padding: 4,
  },
  goBackText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
