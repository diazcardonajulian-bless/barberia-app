import { useEffect, useState } from 'react'
import './Toast.css'

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, 8000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  return (
    <div className={`toast ${exiting ? 'toast-exit' : ''}`}>
      <div className="toast-header">
        <span className="toast-title">
          <span className="toast-dot"></span>
          {toast.title}
        </span>
        <button className="toast-close" onClick={handleClose}>&times;</button>
      </div>
      <div className="toast-body">
        {toast.message}
      </div>
      {toast.detail && (
        <div className="toast-detail">{toast.detail}</div>
      )}
    </div>
  )
}
