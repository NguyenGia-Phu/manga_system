'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { graphqlRequest } from '@/lib/api'
import {
  FileCheck,
  Users,
  ArrowRight,
  BookOpen,
  Clock,
  PenLine,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type SubmissionSummary = {
  id: string
  title: string
  status: string
  seriesTitle: string
  mangakaName?: string | null
  submittedAt?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  submitted: 'Chờ duyệt',
  undertantoureview: 'Đang thẩm định',
  returnedforrevision: 'Yêu cầu sửa đổi',
  forwardedtoboard: 'Đã chuyển hội đồng',
  inboardvoting: 'Đang bỏ phiếu',
  approved: 'Đã phê duyệt',
  rejected: 'Từ chối',
  postponed: 'Tạm hoãn',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  submitted: 'outline',
  undertantoureview: 'default',
  returnedforrevision: 'destructive',
  forwardedtoboard: 'secondary',
  approved: 'secondary',
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status.toLowerCase()] || status
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_VARIANTS[status.toLowerCase()] || 'outline'
}

export default function EditorDashboard() {
  const [userName, setUserName] = useState('Editor')
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setUserName(user.username || user.email || 'Editor')
    }

    const fetchInbox = async () => {
      const query = `
        query GetSubmissionInbox {
          submissionInbox {
            id
            title
            status
            seriesTitle
            mangakaName
            submittedAt
          }
        }
      `

      try {
        const res = await graphqlRequest<{ submissionInbox: SubmissionSummary[] }>(
          query,
          {},
          true
        )

        const items = (res.data?.submissionInbox || []).map((s) => ({
          ...s,
          status: s.status.toLowerCase(),
        }))

        setSubmissions(items)
      } catch (error: any) {
        console.error('Error fetching inbox:', error)
        toast.error('Lỗi nạp danh sách bản thảo: ' + (error?.message || 'Unknown error'))
        setSubmissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchInbox()
  }, [])

  const pendingStatuses = new Set(['submitted', 'undertantoureview'])
  const pendingSubmissions = submissions.filter((s) => pendingStatuses.has(s.status))
  const allProcessed = submissions.filter((s) => !pendingStatuses.has(s.status))

  const stats = [
    {
      label: 'Tổng bản thảo',
      value: submissions.length,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Chờ xét duyệt',
      value: pendingSubmissions.length,
      icon: FileCheck,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Đã xử lý',
      value: allProcessed.length,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Xin chào, {userName}</h1>
          <p className="text-muted-foreground">Tổng quan về các bản thảo và công việc biên tập</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Reviews */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bản thảo chờ duyệt</CardTitle>
                <CardDescription>Các bản nộp cần Tantou xét duyệt</CardDescription>
              </div>
              <Link href="/editor/manuscripts">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Đang tải...</p>
                </div>
              ) : pendingSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileCheck className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có bản thảo nào chờ duyệt</p>
                </div>
              ) : (
                pendingSubmissions.slice(0, 5).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{sub.seriesTitle}</h3>
                        <Badge variant={getStatusVariant(sub.status)}>
                          {getStatusLabel(sub.status)}
                        </Badge>
                        {sub.status === 'submitted' && (
                          <Badge variant="destructive" className="text-xs">Mới</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{sub.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {sub.mangakaName && <span>Tác giả: {sub.mangakaName}</span>}
                        {sub.submittedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/editor/review?submission=${sub.id}`}>
                      <Button size="sm" className="gap-1 ml-4">
                        <PenLine className="h-4 w-4" />
                        Xét duyệt
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>Bản thảo đã xử lý</CardDescription>
              </div>
              <Link href="/editor/manuscripts">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Đang tải...</p>
                </div>
              ) : allProcessed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Chưa có bản thảo nào đã xử lý</p>
                </div>
              ) : (
                allProcessed.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">{sub.seriesTitle}</h3>
                        <p className="text-sm text-muted-foreground truncate">{sub.title}</p>
                        {sub.mangakaName && (
                          <p className="text-xs text-muted-foreground mt-0.5">Tác giả: {sub.mangakaName}</p>
                        )}
                      </div>
                      <Badge variant={getStatusVariant(sub.status)}>
                        {getStatusLabel(sub.status)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </AppShell>
  )
}
