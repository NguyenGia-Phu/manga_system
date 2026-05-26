'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AppShell } from '@/components/app-shell'
import { Series, Chapter, Task, getStatusLabel } from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'
import { graphqlRequest } from '@/lib/api'
import {
  BookOpen,
  FileEdit,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export default function MangakaDashboard() {
  const [mySeries, setMySeries] = useState<Series[]>([])
  const [userName, setUserName] = useState('Mangaka')
  const [activeChapters] = useState<Chapter[]>([])
  const [pendingTasks] = useState<Task[]>([])

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setUserName(user.username || user.email || 'Mangaka')

      const fetchSeries = async () => {
        const query = `
          query GetMySeries($mangakaId: UUID!) {
            getMySeries(mangakaId: $mangakaId) {
              id
              title
              alternativeTitle
              description
              coverImageUrl
              status
              createdAt
              updatedAt
              authorName
              authorId
            }
          }
        `
        try {
          const res = await graphqlRequest<{ getMySeries: any[] }>(query, {
            mangakaId: user.id
          }, true)

          let backendSeries: any[] = []
          if (res.data?.getMySeries) {
            backendSeries = res.data.getMySeries.map((s: any) => ({
              ...s,
              status: s.status.toLowerCase()
            }))
          }

          const localSeriesStr = localStorage.getItem(`custom_series_${user.id}`)
          const localSeries = localSeriesStr ? JSON.parse(localSeriesStr) : []
          const combined = [...localSeries, ...backendSeries]

          setMySeries(combined)
          useAppStore.getState().setMySeries(combined)
        } catch (e) {
          console.error('Error fetching series:', e)
          // Fallback to local storage if API fails or is empty
          const localSeriesStr = localStorage.getItem(`custom_series_${user.id}`)
          const localSeries = localSeriesStr ? JSON.parse(localSeriesStr) : []
          setMySeries(localSeries)
          useAppStore.getState().setMySeries(localSeries)
        }
      }
      if (user.id) {
        fetchSeries()
      }
    }
  }, [])

  const stats = [
    {
      label: 'Series đang chạy',
      value: mySeries.filter(s => s.status.toLocaleLowerCase() === 'ongoing').length,
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Chương đang làm',
      value: activeChapters.length,
      icon: FileEdit,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Công việc chờ duyệt',
      value: pendingTasks.length,
      icon: Users,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Xếp hạng cao nhất',
      value: 'N/A', // Changed due to removing rank from Series
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Xin chào, {userName}</h1>
            <p className="text-muted-foreground">Đây là tổng quan về các series và công việc của bạn</p>
          </div>
          <Link href="/mangaka/series?create=true">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo series mới
            </Button>
          </Link>
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
          {/* My Series */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Series của tôi</CardTitle>
                <CardDescription>Quản lý và theo dõi các series</CardDescription>
              </div>
              <Link href="/mangaka/series">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {mySeries.map((series) => (
                <div
                  key={series.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex h-16 w-12 items-center justify-center rounded bg-muted text-xs font-medium">
                    Cover
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{series.title}</h3>
                      <Badge variant={series.status === 'ongoing' ? 'default' : 'secondary'}>
                        {getStatusLabel(series.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{series.alternativeTitle}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Tác giả: {series.authorName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Chapters */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Chương đang làm</CardTitle>
                <CardDescription>Tiến độ các chương hiện tại</CardDescription>
              </div>
              <Link href="/mangaka/chapters">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeChapters.map((chapter) => {
                const progress = chapter.status === 'review' ? 80 : chapter.status === 'in_progress' ? 45 : 20
                const deadline = new Date(chapter.deadline)
                const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

                return (
                  <div
                    key={chapter.id}
                    className="rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {chapter.seriesTitle} - Chương {chapter.number}
                        </h3>
                        <p className="text-sm text-muted-foreground">{chapter.title}</p>
                      </div>
                      <Badge variant={chapter.status === 'review' ? 'default' : 'secondary'}>
                        {getStatusLabel(chapter.status)}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Tiến độ</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span className={daysLeft <= 3 ? 'text-destructive' : 'text-muted-foreground'}>
                        Còn {daysLeft} ngày đến deadline
                      </span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Pending Reviews */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Công việc chờ kiểm duyệt</CardTitle>
            <CardDescription>Các công việc trợ lý đã nộp, đang chờ bạn xác nhận</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Không có công việc nào chờ kiểm duyệt</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs">
                        Trang
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{task.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Nộp bởi {task.assignedToName} • {task.submittedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Xem
                      </Button>
                      <Button size="sm">Duyệt</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
