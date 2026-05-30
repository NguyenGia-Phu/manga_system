'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUserRoles } from '@/lib/api'

// Map backend role names → frontend route prefixes
const ROLE_ROUTE_MAP: Record<string, string> = {
  'Admin': 'admin',
  'Mangaka': 'mangaka',
  'Assistant': 'assistant',
  'Tantou Editor': 'editor',
  'Editorial Board': 'board',
}

// Priority order for choosing the default page
const ROLE_PRIORITY = ['Admin', 'Mangaka', 'Assistant', 'Tantou Editor', 'Editorial Board']

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const roles = getUserRoles()
    // Find the first role the user has, in priority order
    const matchedRole = ROLE_PRIORITY.find(r => roles.includes(r))
    const route = matchedRole ? ROLE_ROUTE_MAP[matchedRole] : 'mangaka'

    router.push(`/${route}`)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-muted-foreground">Đang chuyển hướng...</span>
      </div>
    </div>
  )
}
