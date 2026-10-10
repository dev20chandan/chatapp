import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import io, { Socket } from 'socket.io-client';
import { currentUserPhone } from '../../authStore';
import { useTheme } from '../../ThemeContext';

const SOCKET_URL = 'http://10.120.123.254:3000';

interface MessageItem {
  id: string;
  text?: string;
  imageUri?: string;
  sender: 'me' | 'other';
  time: string;
}

export default function ChatMessageScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const insets = useSafeAreaInsets();

  const contactId = Array.isArray(id) ? id[0] : id || 'unknown';
  const contactName = (Array.isArray(name) ? name[0] : name) || contactId || 'Chat';

  const { darkMode, toggleTheme, theme } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'init-1',
      text: 'Hey there! How are you doing?',
      sender: 'other',
      time: '10:42 AM',
    },
  ]);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Track keyboard show / hide
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (currentUserPhone) {
        socket.emit('joinChat', currentUserPhone);
      }
    });

    socket.on('receiveMessage', (newMessage: any) => {
      if (
        newMessage &&
        (newMessage.sender === contactId || (newMessage.sender && newMessage.sender !== currentUserPhone))
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [
            ...prev,
            {
              id: newMessage.id || Date.now().toString(),
              text: newMessage.text || '',
              imageUri: newMessage.imageUri,
              sender: 'other',
              time: newMessage.time || formatTime(new Date()),
            },
          ];
        });
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.disconnect();
    };
  }, [contactId]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const timeNow = formatTime(new Date());
    const newMsg: MessageItem = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'me',
      time: timeNow,
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessage('');

    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', {
        to: contactId,
        message: trimmed,
        from: currentUserPhone,
      });
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  // Open Device Gallery
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow gallery access to send photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        sendImageMessage(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error opening gallery: ', err);
      Alert.alert('Error', 'Failed to open gallery.');
    }
  };

  // Open Device Camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        sendImageMessage(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error opening camera: ', err);
      Alert.alert('Error', 'Failed to open camera.');
    }
  };

  // Attachment Options Dialog (Gallery / Camera)
  const handleAttachmentPress = () => {
    Alert.alert(
      'Share Media',
      'Choose photo source:',
      [
        { text: '📷 Camera', onPress: handleTakePhoto },
        { text: '🖼️ Gallery', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const sendImageMessage = (uri: string) => {
    const timeNow = formatTime(new Date());
    const newMsg: MessageItem = {
      id: Date.now().toString(),
      text: '',
      imageUri: uri,
      sender: 'me',
      time: timeNow,
    };

    setMessages((prev) => [...prev, newMsg]);

    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', {
        to: contactId,
        message: '📷 Photo',
        imageUri: uri,
        from: currentUserPhone,
      });
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCall = (type: 'voice' | 'video') => {
    Alert.alert(
      type === 'video' ? 'Video Call' : 'Voice Call',
      `Calling ${contactName}...`,
      [{ text: 'End Call', style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.header }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* WhatsApp Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.headerText} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.userInfo} activeOpacity={0.8}>
          <View style={[styles.avatar, { backgroundColor: darkMode ? '#374151' : '#10b981' }]}>
            <Text style={styles.avatarText}>{contactName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userTextContainer}>
            <Text style={[styles.userName, { color: theme.headerText }]} numberOfLines={1}>
              {contactName}
            </Text>
            <Text style={[styles.userStatus, { color: theme.subText }]}>online</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => handleCall('video')}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam" size={22} color={theme.headerText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => handleCall('voice')}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={20} color={theme.headerText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons name={darkMode ? 'sunny' : 'moon'} size={20} color={theme.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Chat Canvas with Keyboard Handling */}
      <KeyboardAvoidingView
        style={[styles.chatContainer, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={[
            styles.messageListContent,
            { paddingBottom: 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            <View style={styles.chatHeaderInfo}>
              <View style={[styles.lockBadge, { backgroundColor: theme.lockBadge }]}>
                <Ionicons name="lock-closed" size={12} color={darkMode ? '#ffd279' : '#854d0e'} />
                <Text style={[styles.lockText, { color: darkMode ? '#e9edef' : '#713f12' }]}>
                  Messages are end-to-end encrypted. No one outside of this chat can read them.
                </Text>
              </View>

              <View style={[styles.datePill, { backgroundColor: darkMode ? '#182229' : '#e1dfdd' }]}>
                <Text style={[styles.dateText, { color: darkMode ? '#8696a0' : '#54656f' }]}>
                  TODAY
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender === 'me';
            return (
              <View
                style={[
                  styles.messageBubbleWrapper,
                  isMe ? styles.myMessageWrapper : styles.otherMessageWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMe
                      ? [styles.myMessageBubble, { backgroundColor: theme.bubbleMine }]
                      : [styles.otherMessageBubble, { backgroundColor: theme.bubbleOther }],
                    item.imageUri ? styles.imageBubble : null,
                  ]}
                >
                  {item.imageUri ? (
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.bubbleImage}
                        contentFit="cover"
                        transition={200}
                      />
                    </View>
                  ) : null}

                  {item.text ? (
                    <Text
                      style={[
                        styles.messageText,
                        { color: isMe ? theme.textMine : theme.textOther },
                        item.imageUri ? { marginTop: 6, marginHorizontal: 4 } : null,
                      ]}
                    >
                      {item.text}
                    </Text>
                  ) : null}

                  <View
                    style={[
                      styles.messageMeta,
                      item.imageUri && !item.text ? styles.imageMetaOverlay : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageTime,
                        item.imageUri && !item.text
                          ? styles.imageTimeText
                          : { color: isMe ? theme.timeMine : theme.timeOther },
                      ]}
                    >
                      {item.time}
                    </Text>
                    {isMe && (
                      <Ionicons
                        name="checkmark-done"
                        size={15}
                        color={item.imageUri && !item.text ? '#ffffff' : '#53bdeb'}
                        style={styles.checkIcon}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* WhatsApp Bottom Composer */}
        <View
          style={[
            styles.composerContainer,
            {
              backgroundColor: theme.composerBg,
              paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 8),
            },
          ]}
        >
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
            <TouchableOpacity
              style={styles.composerIconBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Emoji', 'Emoji picker opens here')}
            >
              <Ionicons name="happy-outline" size={24} color={theme.iconColor} />
            </TouchableOpacity>

            <TextInput
              style={[styles.textInput, { color: theme.inputText }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Message"
              placeholderTextColor={theme.iconColor}
              multiline
              maxLength={1000}
            />

            {/* Gallery / Attachment Picker */}
            <TouchableOpacity
              style={styles.composerIconBtn}
              activeOpacity={0.7}
              onPress={handleAttachmentPress}
            >
              <Ionicons name="attach-outline" size={24} color={theme.iconColor} />
            </TouchableOpacity>

            {/* Direct Camera Button */}
            {!message.trim() && (
              <TouchableOpacity
                style={styles.composerIconBtn}
                activeOpacity={0.7}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={23} color={theme.iconColor} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.sendButton }]}
            onPress={message.trim() ? handleSend : () => Alert.alert('Voice Note', 'Hold to record voice message')}
            activeOpacity={0.8}
          >
            {message.trim() ? (
              <Ionicons name="send" size={19} color="#ffffff" style={{ marginLeft: 2 }} />
            ) : (
              <Ionicons name="mic" size={22} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  backButton: {
    padding: 6,
    marginRight: 2,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  userStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 8,
    marginLeft: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    flexGrow: 1,
  },
  chatHeaderInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '92%',
    marginBottom: 12,
  },
  lockText: {
    fontSize: 11,
    textAlign: 'center',
    marginLeft: 6,
    lineHeight: 15,
    flexShrink: 1,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  messageBubbleWrapper: {
    marginBottom: 6,
    maxWidth: '82%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  imageBubble: {
    padding: 4,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: 240,
    height: 200,
    borderRadius: 10,
  },
  imageMetaOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  imageTimeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  myMessageBubble: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  otherMessageBubble: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
  },
  checkIcon: {
    marginLeft: 4,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 46,
    maxHeight: 120,
    marginRight: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  composerIconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 6,
    paddingVertical: 6,
    maxHeight: 100,
  },
  actionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
