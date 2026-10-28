"use client";

// 화면 아래에 잠깐 떴다가 사라지는 안내 메시지 (토스트) (추가 기능 단계)
//
// 사용법 (어느 화면이든)
//   const toast = useToast();
//   toast.show("바구니에 담았어요");
//   toast.show("빼냈어요", { action: { label: "실행 취소", onClick: () => ... } });

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import styles from "./Toast.module.css";

const ToastContext = createContext({ show: () => {}, dismiss: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (text, { action, tone = "default", duration = 3500 } = {}) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-2), { id, text, action, tone }]); // 최대 3개
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.tone] ?? ""}`}>
            <span className={styles.text}>{toast.text}</span>
            {toast.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" className={styles.close} aria-label="닫기" onClick={() => dismiss(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
