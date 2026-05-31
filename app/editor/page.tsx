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
} from 'lucide-react'
import Link from 'next/link'

type SeriesSummary = {
  id: string
  title: string
  alternativeTitle?: string | null
  status: string
  authorName: string
}

type PendingReview = {
  id: string
  seriesTitle: string
  number: number
  title: string
  deadline: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Ban nhap',
  pending: 'Cho duyet',
  approved: 'Da duyet',
  ongoing: 'Dang chay',
  hiatus: 'Tam ngung',
  cancelled: 'Da huy',
  completed: 'Hoan thanh',
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status.toLowerCase()] || status
}

export default function EditorDashboard() {
  const [userName, setUserName] = useState('Editor')
  const [managedSeries, setManagedSeries] = useState<SeriesSummary[]>([])
  const pendingReviews: PendingReview[] = []

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (!storedUser) return

    const user = JSON.parse(storedUser)
    setUserName(user.username || user.email || 'Editor')

    if (!user.id) return

    const fetchSeries = async () => {
      const query = `
        query GetMySeries {
          mySeries {
            id
            title
            alternativeTitle
            status
            authorName
          }
        }
      `

      try {
        const res = await graphqlRequest<{ mySeries: SeriesSummary[] }>(
          query,
          {},
          true
        )

        const series = (res.data?.mySeries || []).map((s) => ({
          ...s,
          status: s.status.toLowerCase(),
        }))

        setManagedSeries(series)
      } catch (error) {
        console.error('Error fetching series:', error)
        setManagedSeries([])
      }
    }

    fetchSeries()
  }, [])

  const stats = [
    {
      label: 'Series quản lý',
      value: managedSeries.length,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Chờ xét duyệt',
      value: pendingReviews.length,
      icon: FileCheck,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Xin chao, {userName}</h1>
          <p className="text-muted-foreground">Tổng quan về các series và công việc biên tập</p>
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
                <CardDescription>Các chương cần xét duyệt nội dung</CardDescription>
              </div>
              <Link href="/editor/manuscripts">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileCheck className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có bản thảo nào chờ duyệt</p>
                </div>
              ) : (
                pendingReviews.map((chapter) => {
                  const deadline = new Date(chapter.deadline)
                  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

                  return (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-10 items-center justify-center rounded bg-muted text-xs">
                          Ch.{chapter.number}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{chapter.seriesTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            Chương {chapter.number}: {chapter.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs">
                            <Clock className="h-3 w-3" />
                            <span className={daysLeft <= 3 ? 'text-destructive' : 'text-muted-foreground'}>
                              Còn {daysLeft} ngày
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/editor/review?chapter=${chapter.id}`}>
                        <Button size="sm">Xét duyệt</Button>
                      </Link>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Studio Progress */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tiến độ Studio</CardTitle>
                <CardDescription>Theo dõi tiến độ các studio</CardDescription>
              </div>
              <Link href="/editor/studios">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {managedSeries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Chua co du lieu studio</p>
                </div>
              ) : (
                managedSeries.slice(0, 3).map((series) => (
                  <div key={series.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{series.title}</h3>
                        <p className="text-sm text-muted-foreground">Tac gia: {series.authorName}</p>
                      </div>
                      <Badge variant={series.status === 'ongoing' ? 'default' : 'secondary'}>
                        {getStatusLabel(series.status)}
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
