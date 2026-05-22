'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppShell } from '@/components/app-shell'
import { mockChapters, mockSeries, getStatusLabel } from '@/lib/mock-data'
import {
  Search,
  Clock,
  CheckCircle2,
  Eye,
  PenLine,
  FileCheck,
} from 'lucide-react'
import Link from 'next/link'

export default function EditorManuscriptsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const managedSeries = mockSeries.filter(s => s.editorId === 'u4')
  const allChapters = mockChapters.filter(ch => 
    managedSeries.some(s => s.id === ch.seriesId)
  )

  const filteredChapters = allChapters.filter(ch =>
    ch.seriesTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingChapters = filteredChapters.filter(ch => ch.status === 'review')
  const approvedChapters = filteredChapters.filter(ch => ch.status === 'approved')
  const publishedChapters = filteredChapters.filter(ch => ch.status === 'published')

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bản thảo</h1>
          <p className="text-muted-foreground">Xét duyệt và quản lý bản thảo các chương</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bản thảo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Chờ duyệt ({pendingChapters.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Đã duyệt ({approvedChapters.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Đã xuất bản ({publishedChapters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingChapters.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có bản thảo nào chờ duyệt</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingChapters.map((chapter) => (
                  <ManuscriptCard key={chapter.id} chapter={chapter} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedChapters.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có bản thảo nào đã duyệt</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {approvedChapters.map((chapter) => (
                  <ManuscriptCard key={chapter.id} chapter={chapter} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-4">
            {publishedChapters.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Chưa có bản thảo nào xuất bản</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {publishedChapters.map((chapter) => (
                  <ManuscriptCard key={chapter.id} chapter={chapter} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

function ManuscriptCard({ chapter }: { chapter: typeof mockChapters[0] }) {
  const deadline = new Date(chapter.deadline)
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isUrgent = daysLeft <= 3 && chapter.status === 'review'

  return (
    <Card className={`bg-card ${isUrgent ? 'border-warning/50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="flex h-24 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
              Preview
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{chapter.seriesTitle}</h3>
                <Badge variant={
                  chapter.status === 'published' ? 'default' :
                  chapter.status === 'approved' ? 'secondary' : 'outline'
                }>
                  {getStatusLabel(chapter.status)}
                </Badge>
                {isUrgent && (
                  <Badge variant="destructive">Gấp</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                Chương {chapter.number}: {chapter.title}
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {chapter.status === 'published' 
                    ? `Xuất bản: ${chapter.approvedAt}`
                    : `Deadline: ${chapter.deadline}`
                  }
                </span>
                {chapter.submittedAt && (
                  <>
                    <span>•</span>
                    <span>Nộp: {chapter.submittedAt}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Eye className="h-4 w-4" />
              Xem
            </Button>
            {chapter.status === 'review' && (
              <Link href={`/editor/review?chapter=${chapter.id}`}>
                <Button size="sm" className="gap-1">
                  <PenLine className="h-4 w-4" />
                  Xét duyệt
                </Button>
              </Link>
            )}
            {chapter.status === 'approved' && (
              <Button size="sm" className="gap-1">
                <FileCheck className="h-4 w-4" />
                Gửi in
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
