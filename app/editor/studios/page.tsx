'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AppShell } from '@/components/app-shell'
import { mockSeries, mockChapters } from '@/lib/mock-data'
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  MessageSquare,
} from 'lucide-react'

// Mock studio data
const mockStudios = [
  {
    id: 'st1',
    name: 'Tanaka Yuki Studio',
    mangaka: 'Tanaka Yuki',
    series: ['Blade of the Eternal', 'Digital Hearts'],
    currentChapter: 'Blade of the Eternal Ch.46',
    progress: 65,
    pagesCompleted: 13,
    totalPages: 20,
    deadline: '2026-05-28',
    assistants: 2,
    status: 'on_track',
  },
  {
    id: 'st2',
    name: 'Morita Kenji Studio',
    mangaka: 'Morita Kenji',
    series: ['Shadow Academy'],
    currentChapter: 'Shadow Academy Ch.68',
    progress: 85,
    pagesCompleted: 17,
    totalPages: 20,
    deadline: '2026-05-26',
    assistants: 3,
    status: 'ahead',
  },
  {
    id: 'st3',
    name: 'Hayashi Miku Studio',
    mangaka: 'Hayashi Miku',
    series: ['Cooking Master Neo'],
    currentChapter: 'Cooking Master Neo Ch.90',
    progress: 40,
    pagesCompleted: 8,
    totalPages: 20,
    deadline: '2026-05-25',
    assistants: 2,
    status: 'behind',
  },
]

export default function EditorStudiosPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tiến độ Studio</h1>
          <p className="text-muted-foreground">Theo dõi tiến độ hoàn thiện của các studio theo thời gian thực</p>
        </div>

        {/* Studio Cards */}
        <div className="space-y-4">
          {mockStudios.map((studio) => {
            const deadline = new Date(studio.deadline)
            const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const isUrgent = daysLeft <= 3 && studio.status === 'behind'

            return (
              <Card 
                key={studio.id} 
                className={`bg-card ${
                  studio.status === 'behind' ? 'border-warning/50' :
                  studio.status === 'ahead' ? 'border-success/50' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{studio.name}</h3>
                        <Badge variant={
                          studio.status === 'ahead' ? 'default' :
                          studio.status === 'behind' ? 'destructive' : 'secondary'
                        }>
                          {studio.status === 'ahead' ? 'Vượt tiến độ' :
                           studio.status === 'behind' ? 'Chậm tiến độ' : 'Đúng tiến độ'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1">
                        Mangaka: {studio.mangaka} • Series: {studio.series.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Liên hệ
                      </Button>
                      <Button size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/30 p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{studio.currentChapter}</span>
                      <span className="text-sm text-muted-foreground">
                        {studio.pagesCompleted}/{studio.totalPages} trang
                      </span>
                    </div>
                    <Progress 
                      value={studio.progress} 
                      className={`h-3 ${
                        studio.status === 'behind' ? '[&>div]:bg-warning' :
                        studio.status === 'ahead' ? '[&>div]:bg-success' : ''
                      }`}
                    />
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-muted-foreground">{studio.progress}% hoàn thành</span>
                      <span className={`flex items-center gap-1 ${
                        isUrgent ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {isUrgent && <AlertTriangle className="h-4 w-4" />}
                        <Clock className="h-4 w-4" />
                        Còn {daysLeft} ngày
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="rounded-lg bg-secondary/30 p-3">
                      <p className="text-2xl font-bold text-foreground">{studio.pagesCompleted}</p>
                      <p className="text-xs text-muted-foreground">Trang xong</p>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3">
                      <p className="text-2xl font-bold text-foreground">{studio.totalPages - studio.pagesCompleted}</p>
                      <p className="text-xs text-muted-foreground">Trang còn lại</p>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3">
                      <p className="text-2xl font-bold text-foreground">{studio.assistants}</p>
                      <p className="text-xs text-muted-foreground">Trợ lý</p>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3">
                      <p className="text-2xl font-bold text-foreground">{daysLeft}</p>
                      <p className="text-xs text-muted-foreground">Ngày còn</p>
                    </div>
                  </div>

                  {studio.status === 'behind' && (
                    <div className="mt-4 rounded-lg bg-warning/10 p-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                      <p className="text-sm text-warning">
                        Studio đang chậm tiến độ. Cần liên hệ để kiểm tra và hỗ trợ kịp thời.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {mockStudios.filter(s => s.status === 'ahead').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Vượt tiến độ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {mockStudios.filter(s => s.status === 'on_track').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Đúng tiến độ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {mockStudios.filter(s => s.status === 'behind').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Chậm tiến độ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
