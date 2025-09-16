import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import CustomAlert from './CustomAlert';
import { setWebAlertHandler } from '../utils/alertUtils';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

interface AlertContextType {
  showAlert: (alert: Omit<AlertState, 'visible'>) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: React.ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    // Use custom alerts for both web and Android (iOS can use native alerts)
    if (Platform.OS === 'web' || Platform.OS === 'android') {
      setWebAlertHandler((alert) => {
        setAlertState(alert);
      });
    }
  }, []);

  const showAlert = (alert: Omit<AlertState, 'visible'>) => {
    setAlertState({ ...alert, visible: true });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {/* Custom Alert Modal for Web and Android */}
      {(Platform.OS === 'web' || Platform.OS === 'android') && (
        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons}
          onDismiss={hideAlert}
        />
      )}
    </AlertContext.Provider>
  );
};