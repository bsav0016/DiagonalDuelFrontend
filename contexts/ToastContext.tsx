import React, { createContext, useState, useCallback, ReactNode } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

interface Toast {
  id: number;
  message: string;
  okCallback: (() => void) | null;
}

interface ToastContextType {
  addToast: (message: string, okCallback?: (() => void) | null) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const toastRef = React.useRef<(message: string, okCallback?: (() => void) | null) => void>();

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, okCallback: (() => void) | null = null) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, okCallback }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  toastRef.current = addToast;

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.length > 0 && (
        <ThemedView style={styles.toastOverlay} />
      )}
      {toasts.map((toast) => (
        <ThemedView key={toast.id} style={styles.toastContainer}>
          <ThemedText style={styles.toastContainerLabel}>{toast.message}</ThemedText>
          <ThemedView style={styles.buttonContainer}>
            {toast.okCallback && (
              <TouchableOpacity
                style={styles.boldButton}
                onPress={() => removeToast(toast.id)}
              >
                <ThemedText style={styles.boldButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={toast.okCallback ? styles.dimButton : styles.boldButton}
              onPress={() => {
                if (toast.okCallback) {
                  toast.okCallback();
                }
                removeToast(toast.id);
              }}
            >
              <ThemedText style={toast.okCallback ? styles.dimButtonText : styles.boldButtonText}>
                {toast.okCallback ? "OK" : "Dismiss"}
              </ThemedText>
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
    maxWidth: '50%',
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
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
