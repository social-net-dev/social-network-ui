import { create } from 'zustand'
import type { User } from '@/types'

interface UserState {
  currentUser: User | null
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  setUser: (user) => set({ currentUser: user }),
  updateUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
    })),
}))
