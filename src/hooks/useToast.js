import { useState, useCallback, createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export function useToastState() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return { toasts, addToast };
}

export function useToast() {
  return useContext(ToastContext);
}
