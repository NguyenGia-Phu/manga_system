'use client'

import { useEffect } from 'react'
import { AppSidebar } from './app-sidebar'
import { isAuthenticated } from '@/lib/api'
import { useRouter } from 'next/navigation'

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
  }, [])

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <main className="pl-64">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </main>
    </div>
  )
}


