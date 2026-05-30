'use client'

import { create } from 'zustand'
import { UserRole, User, Series } from './mock-data'

interface AppStore {
  currentUser: User | null
  currentRole: UserRole
  mySeries: Series[]
  setCurrentRole: (role: UserRole) => void
  setCurrentUser: (user: User) => void
  setMySeries: (series: Series[]) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentUser: null,
  currentRole: 'mangaka',
  mySeries: [],
  setCurrentRole: (role) => {
    set((state) => ({
      currentRole: role,
      currentUser: state.currentUser ? { ...state.currentUser, role } : null,
    }))
  },
  setCurrentUser: (user) => set({ currentUser: user, currentRole: user.role }),
  setMySeries: (series) => set({ mySeries: series }),
}))

