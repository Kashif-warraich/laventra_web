import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertState { type: AlertType; message: string }
interface ConfirmState {
  title: string
  message: string
  confirmLabel?: string
  confirmColor?: string
  onConfirm: () => void
}

interface AlertContextValue {
  alert: AlertState | null
  confirm: ConfirmState | null
  showAlert: (type: AlertType, message: string) => void
  showConfirm: (cfg: ConfirmState) => void
  dismissAlert: () => void
  dismissConfirm: () => void
}

const AlertContext = createContext<AlertContextValue>(null!)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showAlert = useCallback((type: AlertType, message: string) => {
    setAlert({ type, message })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAlert(null), 3800)
  }, [])

  const showConfirm = useCallback((cfg: ConfirmState) => setConfirm(cfg), [])
  const dismissAlert = useCallback(() => setAlert(null), [])
  const dismissConfirm = useCallback(() => setConfirm(null), [])

  return (
    <AlertContext.Provider value={{ alert, confirm, showAlert, showConfirm, dismissAlert, dismissConfirm }}>
      {children}
    </AlertContext.Provider>
  )
}

export const useAlert = () => useContext(AlertContext)
