'use client'

import { AppSidebar } from './app-sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
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
