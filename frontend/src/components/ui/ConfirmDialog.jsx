import { Button } from './Button'

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-fadeIn">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>Bekor qilish</Button>
          <Button variant="destructive" onClick={onConfirm}>Tasdiqlash</Button>
        </div>
      </div>
    </div>
  )
}
