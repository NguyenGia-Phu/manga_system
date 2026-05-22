'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/app-shell'
import { mockSeries, mockPollData } from '@/lib/mock-data'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Trophy,
  Medal,
} from 'lucide-react'

export default function MangakaRankingsPage() {
  const mySeries = mockSeries.filter(s => s.authorId === 'u1')
  const latestPoll = mockPollData[0]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bảng xếp hạng</h1>
          <p className="text-muted-foreground">
            Theo dõi thứ hạng các series của bạn và toàn bộ tạp chí
          </p>
        </div>

        {/* My Series Rankings */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Series của tôi</CardTitle>
            <CardDescription>Xếp hạng hiện tại và so sánh với tuần trước</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mySeries.map((series) => {
              const rankChange = series.previousRank - series.rank
              const isAtRisk = series.rank >= 15
              
              return (
                <div
                  key={series.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 ${
                    isAtRisk 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : 'border-border bg-secondary/30'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold ${
                    series.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                    series.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                    series.rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    #{series.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{series.title}</h3>
                      {isAtRisk && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Nguy cơ huỷ
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{series.titleJp}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rankChange > 0 && (
                        <span className="flex items-center gap-1 text-success">
                          <TrendingUp className="h-4 w-4" />
                          +{rankChange}
                        </span>
                      )}
                      {rankChange < 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <TrendingDown className="h-4 w-4" />
                          {rankChange}
                        </span>
                      )}
                      {rankChange === 0 && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Minus className="h-4 w-4" />
                          0
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {series.votes.toLocaleString()} phiếu bầu
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Full Rankings */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Bảng xếp hạng tổng - Tuần {latestPoll.weekNumber}/{latestPoll.year}</CardTitle>
            <CardDescription>Xếp hạng tất cả series trong tạp chí</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockSeries
                .sort((a, b) => a.rank - b.rank)
                .map((series, index) => {
                  const rankChange = series.previousRank - series.rank
                  const isMySeries = series.authorId === 'u1'
                  
                  return (
                    <div
                      key={series.id}
                      className={`flex items-center gap-4 rounded-lg p-3 transition-colors ${
                        isMySeries 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center">
                        {series.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500" />}
                        {series.rank === 2 && <Medal className="h-5 w-5 text-gray-400" />}
                        {series.rank === 3 && <Medal className="h-5 w-5 text-orange-500" />}
                        {series.rank > 3 && (
                          <span className="text-sm font-medium text-muted-foreground">
                            {series.rank}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${isMySeries ? 'text-primary' : 'text-foreground'}`}>
                            {series.title}
                          </p>
                          {isMySeries && (
                            <Badge variant="outline" className="text-xs">
                              Của tôi
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{series.author}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-right">
                          {rankChange > 0 && (
                            <span className="flex items-center justify-end gap-1 text-sm text-success">
                              <TrendingUp className="h-3 w-3" />
                              {rankChange}
                            </span>
                          )}
                          {rankChange < 0 && (
                            <span className="flex items-center justify-end gap-1 text-sm text-destructive">
                              <TrendingDown className="h-3 w-3" />
                              {Math.abs(rankChange)}
                            </span>
                          )}
                          {rankChange === 0 && (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                        <div className="w-20 text-right">
                          <p className="text-sm font-medium text-foreground">
                            {series.votes.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">phiếu</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
