// Safe Audio Helper with fallback for Expo Go environments
let ExpoAudio: any = null;

try {
  ExpoAudio = require('expo-audio');
} catch (e) {
  // ExpoAudio native module may not be present in some Expo Go builds
}

export const isAudioAvailable = () => {
  return !!ExpoAudio;
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    if (ExpoAudio?.requestRecordingPermissionsAsync) {
      const res = await ExpoAudio.requestRecordingPermissionsAsync();
      return !!res?.granted;
    }
  } catch (e) {
    console.warn('Microphone permission error:', e);
  }
  return true; // Allow simulated fallback
};

export const createAudioRecorder = () => {
  if (ExpoAudio?.AudioRecorder) {
    try {
      return new ExpoAudio.AudioRecorder();
    } catch (e) {}
  }
  return null;
};
