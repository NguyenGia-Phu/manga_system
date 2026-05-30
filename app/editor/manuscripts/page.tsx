'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppShell } from '@/components/app-shell'
import { graphqlRequest } from '@/lib/api'
import {
  Search,
  Clock,
  CheckCircle2,
  Eye,
  PenLine,
  FileCheck,
} from 'lucide-react'
import Link from 'next/link'

type SubmissionItem = {
  id: string
  title: string
  status: string
  seriesTitle: string
  submittedAt?: string | null
  resolvedAt?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Ban nhap',
  submitted: 'Da nop',
  undertantoureview: 'Dang duyet',
  returnedforrevision: 'Can sua lai',
  forwardedtoboard: 'Chuyen hoi dong',
  inboardvoting: 'Dang bo phieu',
  approved: 'Da duyet',
  rejected: 'Tu choi',
  postponed: 'Tam hoan',
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status.toLowerCase()] || status
}

export default function EditorManuscriptsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])

  useEffect(() => {
    const fetchSubmissions = async () => {
      const query = `
        query GetSubmissionInbox {
          submissionInbox {
            id
            title
            status
            seriesTitle
            submittedAt
            resolvedAt
          }
        }
      `

      try {
        const res = await graphqlRequest<{ submissionInbox: SubmissionItem[] }>(query, {}, true)
        const items = (res.data?.submissionInbox || []).map((item) => ({
          ...item,
          status: item.status.toLowerCase(),
        }))
        setSubmissions(items)
      } catch (error: any) {
        console.error('Error fetching submissions:', error)
        toast.error('Lỗi nạp danh sách bản thảo: ' + (error?.message || 'Unknown error'))
        setSubmissions([])
      }
    }

    fetchSubmissions()
  }, [])

  const filteredSubmissions = submissions.filter((submission) =>
    submission.seriesTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingStatuses = new Set(['submitted', 'undertantoureview'])
  const approvedStatuses = new Set(['approved'])
  const publishedStatuses = new Set(['forwardedtoboard', 'inboardvoting'])

  const pendingChapters = filteredSubmissions.filter((submission) => pendingStatuses.has(submission.status))
  const approvedChapters = filteredSubmissions.filter((submission) => approvedStatuses.has(submission.status))
  const publishedChapters = filteredSubmissions.filter((submission) => publishedStatuses.has(submission.status))

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
                  <ManuscriptCard key={chapter.id} submission={chapter} />
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
                  <ManuscriptCard key={chapter.id} submission={chapter} />
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
                  <ManuscriptCard key={chapter.id} submission={chapter} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

function ManuscriptCard({ submission }: { submission: SubmissionItem }) {
  const isUrgent = submission.status === 'undertantoureview'

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
                <h3 className="font-semibold text-foreground">{submission.seriesTitle}</h3>
                <Badge variant={submission.status === 'approved' ? 'secondary' : 'outline'}>
                  {getStatusLabel(submission.status)}
                </Badge>
                {isUrgent && (
                  <Badge variant="destructive">Gấp</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {submission.title}
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {submission.resolvedAt
                    ? `Xu ly: ${submission.resolvedAt}`
                    : `Nop: ${submission.submittedAt || 'N/A'}`
                  }
                </span>
                {submission.submittedAt && (
                  <>
                    <span>•</span>
                    <span>Nop: {submission.submittedAt}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {submission.status === 'submitted' || submission.status === 'undertantoureview' ? (
              <Link href={`/editor/review?submission=${submission.id}`}>
                <Button size="sm" className="gap-1">
                  <PenLine className="h-4 w-4" />
                  Xét duyệt
                </Button>
              </Link>
            ) : null}
            {submission.status === 'approved' && (
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
