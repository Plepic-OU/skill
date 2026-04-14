import { useState, useCallback } from 'react'
import { signOut } from '../data/auth'

export function useAuthActions() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const openConfirm = useCallback(() => setIsConfirmOpen(true), [])
  const closeConfirm = useCallback(() => setIsConfirmOpen(false), [])

  const handleSignOut = useCallback(() => {
    setIsConfirmOpen(true)
  }, [])

  const confirmSignOut = useCallback(() => {
    setIsConfirmOpen(false)
    signOut()
  }, [])

  return {
    isModalOpen,
    openModal,
    closeModal,
    isConfirmOpen,
    openConfirm,
    closeConfirm,
    handleSignOut,
    confirmSignOut,
  }
}
