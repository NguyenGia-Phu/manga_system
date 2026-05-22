'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { mockSeries, mockVoteSessions, mockPollData } from '@/lib/mock-data'
import {
  Vote,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
} from 'lucide-react'
import Link from 'next/link'

export default function BoardDashboard() {
  const openVoteSessions = mockVoteSessions.filter(v => v.status === 'open')
  const atRiskSeries = mockSeries.filter(s => s.rank >= 15)
  const latestPoll = mockPollData[0]

  const stats = [
    {
      label: 'Phiếu bầu đang mở',
      value: openVoteSessions.length,
      icon: Vote,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Series đang chạy',
      value: mockSeries.filter(s => s.status === 'ongoing').length,
      icon: BarChart3,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Series nguy cơ',
      value: atRiskSeries.length,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Tuần hiện tại',
      value: `W${latestPoll.weekNumber}`,
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hội đồng biên tập</h1>
          <p className="text-muted-foreground">Quản lý phê duyệt và ra quyết định xuất bản</p>
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
          {/* Open Votes */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Phiếu bầu đang mở</CardTitle>
                <CardDescription>Các quyết định cần bỏ phiếu</CardDescription>
              </div>
              <Link href="/board/voting">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {openVoteSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Vote className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có phiếu bầu nào đang mở</p>
                </div>
              ) : (
                openVoteSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{session.seriesTitle}</h3>
                        <Badge variant={
                          session.type === 'new_series' ? 'default' :
                          session.type === 'cancellation' ? 'destructive' : 'secondary'
                        }>
                          {session.type === 'new_series' ? 'Series mới' :
                           session.type === 'cancellation' ? 'Huỷ bỏ' : 'Đổi lịch'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {session.votes.length} phiếu
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Hết hạn: {session.deadline}
                        </span>
                      </div>
                      <Link href={`/board/voting?session=${session.id}`}>
                        <Button size="sm">Bỏ phiếu</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Top Rankings */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top 5 tuần này</CardTitle>
                <CardDescription>Xếp hạng dựa trên bình chọn độc giả</CardDescription>
              </div>
              <Link href="/board/rankings">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem đầy đủ <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockSeries
                .sort((a, b) => a.rank - b.rank)
                .slice(0, 5)
                .map((series) => {
                  const rankChange = series.previousRank - series.rank

                  return (
                    <div
                      key={series.id}
                      className="flex items-center gap-4 rounded-lg bg-secondary/30 p-3"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded font-bold text-sm ${
                        series.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                        series.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                        series.rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {series.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{series.title}</p>
                        <p className="text-xs text-muted-foreground">{series.author}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rankChange > 0 && (
                          <span className="flex items-center text-xs text-success">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {rankChange}
                          </span>
                        )}
                        {rankChange < 0 && (
                          <span className="flex items-center text-xs text-destructive">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {Math.abs(rankChange)}
                          </span>
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {series.votes.toLocaleString()}
                        </span>
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
                <CardTitle>Series cần xem xét huỷ bỏ</CardTitle>
              </div>
              <CardDescription>
                Các series xếp hạng thấp trong nhiều tuần liên tiếp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {atRiskSeries.map((series) => (
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
                          {series.author} • {series.votes.toLocaleString()} phiếu
                        </p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      Tạo phiếu huỷ
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
