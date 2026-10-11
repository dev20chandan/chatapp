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
import { getMessagesForChat, addMessageToChat, markChatRead } from '../../chatStore';

const SOCKET_URL = 'http://10.120.123.254:3000';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
  '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦',
  '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
  '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
  '💀', '💩', '🤡', '👻', '👽', '🤖', '👋', '🤚', '🖐️', '✋',
  '🖖', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊',
  '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤝', '🙏', '✍️', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥',
  '✨', '🌟', '💫', '💥', '💯', '🎉', '🎊', '🎈', '🎂', '🎁',
  '☕', '🍕', '🍔', '🍟', '🍦', '🍩', '🍻', '🥂', '🍾', '🚀',
];

interface MessageItem {
  id: string;
  text?: string;
  imageUri?: string;
  audioUri?: string;
  audioDuration?: string;
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
  const [messages, setMessages] = useState<MessageItem[]>(() => getMessagesForChat(contactId));

  useEffect(() => {
    markChatRead(contactId);
  }, [contactId]);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const playbackTimerRef = useRef<any>(null);

  // Track keyboard show / hide
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setShowEmojiPicker(false);
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
        const receivedMsg: MessageItem = {
          id: newMessage.id || Date.now().toString(),
          text: newMessage.text || '',
          imageUri: newMessage.imageUri,
          audioUri: newMessage.audioUri,
          audioDuration: newMessage.audioDuration,
          sender: 'other',
          time: newMessage.time || formatTime(new Date()),
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === receivedMsg.id)) return prev;
          return [...prev, receivedMsg];
        });

        addMessageToChat(contactId, contactName, receivedMsg);
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.disconnect();
    };
  }, [contactId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRecordTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
    addMessageToChat(contactId, contactName, newMsg);

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

  // Attachment Options Dialog
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
    addMessageToChat(contactId, contactName, newMsg);

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

  // Start Voice Recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordSeconds(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Stop & Send Voice Note
  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const durationFormatted = formatRecordTime(recordSeconds || 1);
    setIsRecording(false);
    sendAudioMessage('voice-note', durationFormatted);
  };

  // Cancel Voice Recording
  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    setRecordSeconds(0);
  };

  const sendAudioMessage = (uri: string, durationStr: string) => {
    const timeNow = formatTime(new Date());
    const newMsg: MessageItem = {
      id: Date.now().toString(),
      text: '',
      audioUri: uri,
      audioDuration: durationStr,
      sender: 'me',
      time: timeNow,
    };

    setMessages((prev) => [...prev, newMsg]);
    addMessageToChat(contactId, contactName, newMsg);

    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', {
        to: contactId,
        message: '🎤 Voice message',
        audioUri: uri,
        audioDuration: durationStr,
        from: currentUserPhone,
      });
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Play / Pause Voice Note
  const handlePlayAudio = (item: MessageItem) => {
    if (!item.audioUri) return;

    if (playingAudioId === item.id) {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }

    setPlayingAudioId(item.id);

    playbackTimerRef.current = setTimeout(() => {
      setPlayingAudioId(null);
      playbackTimerRef.current = null;
    }, 4500);
  };

  // Toggle Emoji Picker
  const toggleEmojiPicker = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    } else {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
    }
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
                  {/* Photo Message */}
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

                  {/* Voice Note Message */}
                  {item.audioUri ? (
                    <View style={styles.voiceNoteRow}>
                      <TouchableOpacity
                        style={[
                          styles.voicePlayBtn,
                          { backgroundColor: isMe ? '#ffffff' : theme.accent },
                        ]}
                        onPress={() => handlePlayAudio(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={playingAudioId === item.id ? 'pause' : 'play'}
                          size={18}
                          color={isMe ? theme.accent : '#ffffff'}
                          style={{ marginLeft: playingAudioId === item.id ? 0 : 2 }}
                        />
                      </TouchableOpacity>

                      <View style={styles.voiceWaveContainer}>
                        <View style={styles.waveformBars}>
                          {[6, 14, 18, 9, 15, 20, 16, 10, 17, 8, 19, 13, 9, 18, 12, 7, 15, 19, 9, 14].map(
                            (barHeight, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.waveformBar,
                                  {
                                    height: barHeight,
                                    backgroundColor:
                                      playingAudioId === item.id && idx < 10
                                        ? '#53bdeb'
                                        : isMe
                                          ? '#a7f3d0'
                                          : theme.subText,
                                  },
                                ]}
                              />
                            )
                          )}
                        </View>
                        <Text
                          style={[
                            styles.voiceDuration,
                            { color: isMe ? '#d1fae5' : theme.subText },
                          ]}
                        >
                          {item.audioDuration || '0:05'}
                        </Text>
                      </View>

                      <View style={styles.voiceMicBadge}>
                        <Ionicons name="mic" size={17} color={isMe ? '#d1fae5' : theme.accent} />
                      </View>
                    </View>
                  ) : null}

                  {/* Text Message */}
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
              paddingBottom: isKeyboardVisible || showEmojiPicker ? 8 : Math.max(insets.bottom, 8),
            },
          ]}
        >
          {isRecording ? (
            /* Active Voice Recording UI */
            <View style={[styles.recordingContainer, { backgroundColor: theme.inputBg }]}>
              <View style={styles.recordingIndicator}>
                <View style={styles.redDot} />
                <Text style={[styles.recordingTimer, { color: theme.inputText }]}>
                  {formatRecordTime(recordSeconds)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cancelRecordBtn}
                onPress={cancelRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
                <Text style={styles.cancelRecordText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Standard Message Composer UI */
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
              <TouchableOpacity
                style={styles.composerIconBtn}
                activeOpacity={0.7}
                onPress={toggleEmojiPicker}
              >
                <Ionicons
                  name={showEmojiPicker ? 'keypad-outline' : 'happy-outline'}
                  size={24}
                  color={showEmojiPicker ? theme.accent : theme.iconColor}
                />
              </TouchableOpacity>

              <TextInput
                style={[styles.textInput, { color: theme.inputText }]}
                value={message}
                onChangeText={setMessage}
                onFocus={() => setShowEmojiPicker(false)}
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
          )}

          {/* Action Button: Send or Mic */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.sendButton },
              isRecording ? styles.recordingActionButton : null,
            ]}
            onPress={
              isRecording
                ? stopAndSendRecording
                : message.trim()
                  ? handleSend
                  : startRecording
            }
            activeOpacity={0.8}
          >
            {isRecording ? (
              <Ionicons name="send" size={19} color="#ffffff" style={{ marginLeft: 2 }} />
            ) : message.trim() ? (
              <Ionicons name="send" size={19} color="#ffffff" style={{ marginLeft: 2 }} />
            ) : (
              <Ionicons name="mic" size={22} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* EMOJI PICKER BOARD */}
        {showEmojiPicker && (
          <View style={[styles.emojiPickerBox, { backgroundColor: theme.composerBg }]}>
            <View style={[styles.emojiHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.emojiHeaderLabel, { color: theme.subText }]}>EMOJIS</Text>
              <TouchableOpacity
                style={styles.backspaceBtn}
                onPress={() => setMessage((prev) => prev.slice(0, -2))}
                activeOpacity={0.7}
              >
                <Ionicons name="backspace-outline" size={22} color={theme.iconColor} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={EMOJIS}
              keyExtractor={(item, index) => `${item}-${index}`}
              numColumns={8}
              contentContainerStyle={styles.emojiGrid}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.emojiCell}
                  activeOpacity={0.6}
                  onPress={() => setMessage((prev) => prev + item)}
                >
                  <Text style={styles.emojiChar}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
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
  voiceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 210,
  },
  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  voiceWaveContainer: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    marginBottom: 2,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  voiceDuration: {
    fontSize: 11,
    fontWeight: '600',
  },
  voiceMicBadge: {
    padding: 4,
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
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
    marginRight: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  recordingTimer: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  cancelRecordText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  recordingActionButton: {
    backgroundColor: '#ef4444',
  },
  emojiPickerBox: {
    height: 250,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  emojiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  emojiHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  backspaceBtn: {
    padding: 4,
  },
  emojiGrid: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  emojiCell: {
    flex: 1 / 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  emojiChar: {
    fontSize: 26,
  },
});
