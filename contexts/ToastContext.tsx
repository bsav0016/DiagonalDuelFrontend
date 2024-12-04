import React, { createContext, useState, useCallback, useRef, ReactNode } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";


export interface ToastAction {
  label: string;
  callback: () => void;
}

interface Toast {
  id: number;
  message: string;
  actions: ToastAction[];
}

interface ToastContextType {
  addToast: (message: string, actions?: ToastAction[]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastRef = useRef<(message: string, actions: ToastAction[]) => void>();

  const addToast = useCallback(
    (
      message: string, 
      actions: ToastAction[] = []
    ) => {
      const id = Date.now();
      setToasts((prevToasts) => [...prevToasts, { id, message, actions }]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  toastRef.current = addToast;

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.length > 0 && <ThemedView style={styles.toastOverlay} />}
      {toasts.map((toast) => (
        <ThemedView key={toast.id} style={styles.toastContainer}>
          <ThemedText style={styles.toastContainerLabel}>{toast.message}</ThemedText>
          <ThemedView style={[styles.buttonContainer, { flexDirection: toast.actions.length > 1 ? 'column' : 'row' }]}>
            {toast.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.boldButton}
                onPress={() => {
                  action.callback();
                  removeToast(toast.id);
                }}
              >
                <ThemedText style={styles.boldButtonText}>{action.label}</ThemedText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.dimButton}
              onPress={() => removeToast(toast.id)}
            >
              <ThemedText style={styles.dimButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    zIndex: 9999,
    maxWidth: '80%',
    width: 'auto',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    padding: 15,
  },
  toastContainerLabel: {
    fontSize: 20,
  },
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 9998,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    gap: 4
  },
  boldButton: {
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#007bff',
    color: 'white',
    borderWidth: 0,
    borderRadius: 4,
  },
  boldButtonText: {
    color: 'white',
    fontSize: 16,
  },
  dimButton: {
    fontWeight: 'normal',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#d9dde0',
    color: '#5a6167',
    borderWidth: 1,
    borderColor: '#9da5ac',
    borderRadius: 4,
    marginLeft: 5,
  },
  dimButtonText: {
    color: '#5a6167',
    fontSize: 16,
  },
});
