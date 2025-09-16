import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

// Global state for web alerts
let webAlertState: {
  setAlert: ((alert: AlertOptions & { visible: boolean }) => void) | null;
} = {
  setAlert: null,
};

export const setWebAlertHandler = (
  handler: (alert: AlertOptions & { visible: boolean }) => void
) => {
  webAlertState.setAlert = handler;
};

export const showAlert = (options: AlertOptions) => {
  if (Platform.OS === 'web' || Platform.OS === 'android') {
    // Use custom alert for web and Android
    if (webAlertState.setAlert) {
      webAlertState.setAlert({
        ...options,
        visible: true,
      });
    } else {
      // Fallback for web only
      if (Platform.OS === 'web') {
        const result = window.confirm(`${options.title}\n\n${options.message}`);
        if (result && options.buttons) {
          const confirmButton = options.buttons.find(
            (btn) => btn.style === 'cancel' || btn.text.toLowerCase().includes('try')
          );
          if (confirmButton?.onPress) {
            confirmButton.onPress();
          }
        }
      }
    }
  } else {
    // Use native Alert for iOS only
    Alert.alert(
      options.title,
      options.message,
      options.buttons?.map((btn) => ({
        text: btn.text,
        onPress: btn.onPress,
        style: btn.style,
      }))
    );
  }
};