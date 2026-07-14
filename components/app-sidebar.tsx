'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { getRoleLabel, UserRole } from '@/lib/mock-data'
import { logout, getUserRoles } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  BookOpen,
  Users,
  FileEdit,
  BarChart3,
  ClipboardList,
  Home,
  ChevronDown,
  Bell,
  Settings,
  Vote,
  TrendingUp,
  Palette,
  DollarSign,
  FileCheck,
  PenTool,
  CheckSquare,
  LogOut,
  ShieldAlert,
} from 'lucide-react'

// Map backend role names → frontend role keys
const BACKEND_TO_FRONTEND_ROLE: Record<string, UserRole> = {
  'Mangaka': 'mangaka',
  'Assistant': 'assistant',
  'Tantou Editor': 'editor',
  'Editorial Board': 'board',
  'Admin': 'admin',
}

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  mangaka: PenTool,
  assistant: Palette,
  editor: FileEdit,
  board: Users,
  admin: ShieldAlert,
}

const roleNavItems = {
  mangaka: [
    { href: '/mangaka', label: 'Tổng quan', icon: Home },
    { href: '/mangaka/series', label: 'Series của tôi', icon: BookOpen },
    { href: '/mangaka/chapters', label: 'Quản lý chương', icon: FileEdit },
    { href: '/mangaka/assistants', label: 'Trợ lý của tôi', icon: Users },
    { href: '/mangaka/tasks', label: 'Phân công công việc', icon: ClipboardList },
    { href: '/mangaka/review', label: 'Duyệt công việc', icon: CheckSquare },
    { href: '/mangaka/rankings', label: 'Bảng xếp hạng', icon: TrendingUp },
  ],
  assistant: [
    { href: '/assistant', label: 'Tổng quan', icon: Home },
    { href: '/assistant/tasks', label: 'Công việc được giao', icon: ClipboardList },
    { href: '/assistant/workspace', label: 'Không gian làm việc', icon: Palette },
    { href: '/assistant/earnings', label: 'Thu nhập', icon: DollarSign },
  ],
  editor: [
    { href: '/editor', label: 'Tổng quan', icon: Home },
    { href: '/editor/manuscripts', label: 'Bản thảo', icon: FileCheck },
    { href: '/editor/studios', label: 'Tiến độ studio', icon: Users },
    { href: '/editor/review', label: 'Xét duyệt', icon: PenTool },
  ],
  board: [
    { href: '/board', label: 'Tổng quan', icon: Home },
    { href: '/board/voting', label: 'Bỏ phiếu', icon: Vote },
    { href: '/board/series-approval', label: 'Xét duyệt tác phẩm', icon: FileCheck },
    { href: '/board/rankings', label: 'Bảng xếp hạng', icon: BarChart3 },
    { href: '/board/poll-data', label: 'Nhập dữ liệu bình chọn', icon: TrendingUp },
  ],
  admin: [
    { href: '/board', label: 'Tổng quan', icon: Home },
    { href: '/board/voting', label: 'Bỏ phiếu', icon: Vote },
    { href: '/board/rankings', label: 'Bảng xếp hạng', icon: BarChart3 },
    { href: '/board/poll-data', label: 'Nhập dữ liệu bình chọn', icon: TrendingUp },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentRole, currentUser, setCurrentRole, setCurrentUser } = useAppStore()
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([])
  const navItems = roleNavItems[currentRole]

  useEffect(() => {
    // Load user info from localStorage
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setCurrentUser({
        id: user.id || 'u1',
        name: user.username || user.email?.split('@')[0] || 'User',
        avatar: '/avatars/default.jpg',
        role: currentRole,
        email: user.email || ''
      })
    }

    // Load actual roles from localStorage (set during login from JWT)
    const backendRoles = getUserRoles()
    const frontendRoles = backendRoles
      .map(r => BACKEND_TO_FRONTEND_ROLE[r])
      .filter(Boolean) as UserRole[]

    if (frontendRoles.length > 0) {
      setAvailableRoles(frontendRoles)

      // Determine current role from URL path
      const pathRole = pathname.split('/')[1] as UserRole
      if (frontendRoles.includes(pathRole)) {
        setCurrentRole(pathRole)
      } else if (!frontendRoles.includes(currentRole)) {
        // Current role is not available for this user, switch to first available
        setCurrentRole(frontendRoles[0])
        router.push(`/${frontendRoles[0]}`)
      }
    } else {
      // Fallback: no roles parsed, show current
      setAvailableRoles([currentRole])
    }
  }, [pathname])

  const handleSwitchRole = (role: UserRole) => {
    if (role === currentRole) return
    // Check if user actually has this role
    if (!availableRoles.includes(role)) return
    setCurrentRole(role)
    router.push(`/${role}`)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">MangaFlow</span>
        </div>

        {/* Role Selector */}
        <div className="border-b border-sidebar-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {currentUser?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{getRoleLabel(currentRole)}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Chuyển vai trò</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['mangaka', 'assistant', 'editor', 'board', 'admin'] as UserRole[]).map(role => {
                const isAvailable = availableRoles.includes(role)
                const isActive = currentRole === role
                const Icon = ROLE_ICONS[role]

                return (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => isAvailable && handleSwitchRole(role)}
                    disabled={!isAvailable}
                    className={cn(
                      isActive && 'bg-accent',
                      !isAvailable && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="flex-1">{getRoleLabel(role)}</span>
                    {!isAvailable && (
                      <ShieldAlert className="h-3 w-3 text-muted-foreground ml-2" />
                    )}
                    {isActive && (
                      <span className="ml-2 text-xs text-primary">●</span>
                    )}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentUser?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {currentUser?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground" onClick={logout} title="Đăng xuất">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
