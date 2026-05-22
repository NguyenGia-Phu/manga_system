'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AppShell } from '@/components/app-shell'
import { mockSeries, mockChapters, getStatusLabel } from '@/lib/mock-data'
import {
  FileCheck,
  Users,
  Clock,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import Link from 'next/link'

export default function EditorDashboard() {
  const managedSeries = mockSeries.filter(s => s.editorId === 'u4')
  const pendingReviews = mockChapters.filter(ch => ch.status === 'review')
  const atRiskSeries = managedSeries.filter(s => s.rank >= 15)

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
    {
      label: 'Series nguy cơ',
      value: atRiskSeries.length,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Deadline tuần này',
      value: 3,
      icon: Clock,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Xin chào, Suzuki Hiro</h1>
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
              {managedSeries.slice(0, 3).map((series) => {
                const progress = Math.floor(Math.random() * 40) + 50 // Mock progress

                return (
                  <div key={series.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{series.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Chương {series.currentChapter + 1} - Tanaka Yuki Studio
                        </p>
                      </div>
                      <Badge variant={progress >= 80 ? 'default' : progress >= 50 ? 'secondary' : 'outline'}>
                        {progress}%
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>15/20 trang hoàn thành</span>
                      <span>Deadline: 28/05</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Series at Risk */}
        {atRiskSeries.length > 0 && (
          <Card className="bg-card border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Series có nguy cơ bị huỷ</CardTitle>
              </div>
              <CardDescription>Các series cần được bảo vệ trước hội đồng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {atRiskSeries.map((series) => {
                  const rankChange = series.previousRank - series.rank

                  return (
                    <div
                      key={series.id}
                      className="flex items-center justify-between rounded-lg bg-destructive/5 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive font-bold">
                          #{series.rank}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{series.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Tác giả: {series.author} • {series.votes.toLocaleString()} phiếu
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {rankChange < 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                              <TrendingDown className="h-4 w-4" />
                              {Math.abs(rankChange)} hạng
                            </span>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Chuẩn bị hồ sơ
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
