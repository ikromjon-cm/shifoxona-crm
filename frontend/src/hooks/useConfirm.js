import { useState, useCallback } from 'react'

export function useConfirm() {
  const [state, setState] = useState({ open: false, title: '', message: '', resolve: null })

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setState({ open: true, title, message, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState((s) => ({ ...s, open: false }))
  }, [state])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState((s) => ({ ...s, open: false }))
  }, [state])

  return { confirm, state, handleConfirm, handleCancel }
}
