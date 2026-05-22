'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'

export default function HomePage() {
  const router = useRouter()
  const { currentRole } = useAppStore()

  useEffect(() => {
    router.push(`/${currentRole}`)
  }, [currentRole, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-muted-foreground">Đang chuyển hướng...</span>
      </div>
    </div>
  )
}
