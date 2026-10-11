import { Platform } from 'react-native';

// Current machine IPv4 address for local network access from mobile devices
export const BACKEND_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : 'http://10.151.8.254:3000';

export const SOCKET_URL = BACKEND_URL;
