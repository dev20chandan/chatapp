export interface ActiveChat {
  id: string;
  name: string;
  phone: string;
  message: string;
  time: string;
  unread: number;
  lastUpdated: number;
}

export interface StoredMessage {
  id: string;
  text?: string;
  imageUri?: string;
  audioUri?: string;
  audioDuration?: string;
  sender: 'me' | 'other';
  time: string;
}

// Initial active chats with messages
let activeChats: ActiveChat[] = [];

// Stored messages keyed by contact/chat id
const messagesByChat: Record<string, StoredMessage[]> = {};

const listeners = new Set<() => void>();

export const getActiveChats = (): ActiveChat[] => {
  return [...activeChats].sort((a, b) => b.lastUpdated - a.lastUpdated);
};

export const getMessagesForChat = (chatId: string): StoredMessage[] => {
  return messagesByChat[chatId] ? [...messagesByChat[chatId]] : [];
};

export const addMessageToChat = (
  chatId: string,
  chatName: string,
  msg: StoredMessage
) => {
  if (!messagesByChat[chatId]) {
    messagesByChat[chatId] = [];
  }
  messagesByChat[chatId].push(msg);

  const preview = msg.text
    ? msg.text
    : msg.imageUri
    ? '📷 Photo'
    : msg.audioUri
    ? '🎤 Voice note'
    : 'Message';

  const existingIndex = activeChats.findIndex((c) => c.id === chatId);
  const existingChat = activeChats[existingIndex];

  const updatedChat: ActiveChat = {
    id: chatId,
    name: chatName || existingChat?.name || chatId,
    phone: chatId,
    message: preview,
    time: msg.time,
    unread:
      msg.sender === 'other'
        ? (existingChat ? existingChat.unread + 1 : 1)
        : 0,
    lastUpdated: Date.now(),
  };

  if (existingIndex >= 0) {
    activeChats[existingIndex] = updatedChat;
  } else {
    activeChats.unshift(updatedChat);
  }

  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('Listener error in chatStore:', e);
    }
  });
};

export const markChatRead = (chatId: string) => {
  const chat = activeChats.find((c) => c.id === chatId);
  if (chat && chat.unread > 0) {
    chat.unread = 0;
    listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.warn('Listener error in chatStore:', e);
      }
    });
  }
};

export const subscribeChats = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
