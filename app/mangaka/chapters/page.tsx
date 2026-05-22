'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppShell } from '@/components/app-shell'
import { mockChapters, mockSeries, getStatusLabel } from '@/lib/mock-data'
import {
  Plus,
  Clock,
  CheckCircle2,
  FileEdit,
  Eye,
  MoreHorizontal,
  Send,
  AlertTriangle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

export default function MangakaChaptersPage() {
  const [selectedSeries, setSelectedSeries] = useState<string>('all')
  const mySeries = mockSeries.filter(s => s.authorId === 'u1')

  const filteredChapters = selectedSeries === 'all'
    ? mockChapters
    : mockChapters.filter(ch => ch.seriesId === selectedSeries)

  const inProgressChapters = filteredChapters.filter(ch => 
    ch.status === 'draft' || ch.status === 'in_progress'
  )
  const reviewChapters = filteredChapters.filter(ch => ch.status === 'review')
  const publishedChapters = filteredChapters.filter(ch => ch.status === 'published' || ch.status === 'approved')

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý chương</h1>
            <p className="text-muted-foreground">Theo dõi tiến độ và quản lý các chương manga</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo chương mới
          </Button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Select value={selectedSeries} onValueChange={setSelectedSeries}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả series</SelectItem>
                {mySeries.map((series) => (
                  <SelectItem key={series.id} value={series.id}>
                    {series.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="in_progress" className="space-y-4">
          <TabsList>
            <TabsTrigger value="in_progress">
              Đang làm ({inProgressChapters.length})
            </TabsTrigger>
            <TabsTrigger value="review">
              Chờ duyệt ({reviewChapters.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Đã xuất bản ({publishedChapters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in_progress" className="space-y-4">
            {inProgressChapters.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có chương nào đang làm</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {inProgressChapters.map((chapter) => (
                  <ChapterCard key={chapter.id} chapter={chapter} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            {reviewChapters.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có chương nào chờ duyệt</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviewChapters.map((chapter) => (
                  <ChapterCard key={chapter.id} chapter={chapter} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-4">
            {publishedChapters.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Chưa có chương nào được xuất bản</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {publishedChapters.map((chapter) => (
                  <ChapterCard key={chapter.id} chapter={chapter} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

function ChapterCard({ chapter }: { chapter: typeof mockChapters[0] }) {
  const deadline = new Date(chapter.deadline)
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysLeft < 0
  const isUrgent = daysLeft <= 3 && daysLeft >= 0

  const progress = chapter.status === 'published' ? 100 
    : chapter.status === 'approved' ? 95
    : chapter.status === 'review' ? 80
    : chapter.status === 'in_progress' ? 45
    : 10

  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
              Preview
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  Chương {chapter.number}: {chapter.title}
                </h3>
                <Badge variant={
                  chapter.status === 'published' ? 'default' :
                  chapter.status === 'review' ? 'secondary' : 'outline'
                }>
                  {getStatusLabel(chapter.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{chapter.seriesTitle}</p>
              
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className={
                    isOverdue ? 'text-destructive font-medium' :
                    isUrgent ? 'text-warning font-medium' :
                    'text-muted-foreground'
                  }>
                    {isOverdue 
                      ? `Quá hạn ${Math.abs(daysLeft)} ngày`
                      : `Còn ${daysLeft} ngày`
                    }
                  </span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Tạo: {chapter.createdAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isOverdue || isUrgent) && chapter.status !== 'published' && (
              <div className="flex items-center gap-1 text-warning">
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                {chapter.status === 'in_progress' && (
                  <DropdownMenuItem>
                    <Send className="mr-2 h-4 w-4" />
                    Nộp bản thảo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Tiến độ hoàn thành</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mt-4 flex gap-2">
          <Link href={`/mangaka/tasks?chapter=${chapter.id}`} className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <FileEdit className="h-4 w-4" />
              Phân công công việc
            </Button>
          </Link>
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Xem trang
          </Button>
          {chapter.status === 'in_progress' && (
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Nộp duyệt
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
