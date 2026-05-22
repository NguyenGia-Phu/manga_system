'use client'

import { create } from 'zustand'
import { UserRole, User, mockUsers } from './mock-data'

interface AppStore {
  currentUser: User | null
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  setCurrentUser: (user: User) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentUser: mockUsers[0], // Default to mangaka
  currentRole: 'mangaka',
  setCurrentRole: (role) => {
    const user = mockUsers.find(u => u.role === role) || mockUsers[0]
    set({ currentRole: role, currentUser: user })
  },
  setCurrentUser: (user) => set({ currentUser: user, currentRole: user.role }),
}))
