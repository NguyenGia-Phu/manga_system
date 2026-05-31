'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppShell } from '@/components/app-shell'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Clock,
  CheckCircle2,
  FileEdit,
  Eye,
  MoreHorizontal,
  Send,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  ArrowRight,
  UserCheck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { graphqlRequest } from '@/lib/api'
import { toast } from 'sonner'

interface Series {
  id: string
  title: string
  status: string
}

interface ChapterDto {
  id: string
  title: string
  chapterNumber: number
  isPublished: boolean
  createdAt: string
  seriesId: string
  status?: string
  manuscriptId?: string
  submissionId?: string
  feedback?: string
  version?: number
  annotatedPagesText?: string
}

interface SubmissionManuscript {
  id: string
  name: string
  status: string
  version: number
  isCurrentVersion: boolean
  chapterId: string
  createdAt: string
}

interface SubmissionTransition {
  id: string
  fromStatus: string
  toStatus: string
  comment: string | null
  occurredAt: string
}

interface Submission {
  id: string
  title: string
  note: string
  status: string
  seriesId: string
  submittedAt: string
  manuscripts: SubmissionManuscript[]
  transitions: SubmissionTransition[]
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    submitted: 'Chờ duyệt',
    Submitted: 'Chờ duyệt',
    UnderTantouReview: 'Tantou đang thẩm định',
    ForwardedToBoard: 'Chờ hội đồng duyệt',
    ReturnedForRevision: 'Cần chỉnh sửa lại',
    Approved: 'Đã phê duyệt',
    published: 'Đã xuất bản',
    Published: 'Đã xuất bản'
  }
  return labels[status] || status
}

export default function MangakaChaptersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mySeries, setMySeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [chapters, setChapters] = useState<ChapterDto[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [submittingNote, setSubmittingNote] = useState('')
  const [targetChapter, setTargetChapter] = useState<ChapterDto | null>(null)

  // Create form states
  const [newTitle, setNewTitle] = useState('')
  const [newChapterNumber, setNewChapterNumber] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmittingWorkflow, setIsSubmittingWorkflow] = useState(false)

  // 1. Load User Profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser')
      if (stored) {
        try {
          const user = JSON.parse(stored)
          setCurrentUser(user)
        } catch (e) {
          console.error('Lỗi parse currentUser:', e)
        }
      }
    }
  }, [])

  // 2. Fetch Series list once User is loaded
  useEffect(() => {
    if (!currentUser) return
    const fetchSeries = async () => {
      try {
        const query = `
          query GetMySeries {
            mySeries {
              id
              title
              status
            }
          }
        `
        const res = await graphqlRequest<{ mySeries: Series[] }>(query, {}, true)
        if (res.errors) throw new Error(res.errors[0].message)
        const list = res.data?.mySeries || []
        setMySeries(list)
        if (list.length > 0) {
          let targetSeriesId = list[0].id
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const seriesIdFromUrl = params.get('seriesId')
            if (seriesIdFromUrl && list.some(s => s.id === seriesIdFromUrl)) {
              targetSeriesId = seriesIdFromUrl
            }
          }
          setSelectedSeriesId(targetSeriesId)
        } else {
          setLoading(false)
        }
      } catch (err: any) {
        console.error(err)
        toast.error('Lỗi tải danh sách bộ truyện: ' + err.message)
        setLoading(false)
      }
    }
    fetchSeries()
  }, [currentUser])

  // 3. Fetch Chapters & Submissions when Selected Series changes
  const fetchData = async () => {
    if (!selectedSeriesId || !currentUser) return
    setLoading(true)
    try {
      // Query Chapters
      const chaptersQuery = `
        query GetChaptersBySeries($seriesId: UUID!) {
          chaptersBySeries(seriesId: $seriesId) {
            id
            title
            chapterNumber
            isPublished
            createdAt
            seriesId
          }
        }
      `
      // Query Submissions
      const submissionsQuery = `
        query GetMySubmissions($seriesId: UUID) {
          mySubmissions(seriesId: $seriesId) {
            id
            title
            note
            status
            seriesId
            submittedAt
            manuscripts {
              id
              name
              status
              version
              isCurrentVersion
              chapterId
              createdAt
            }
            transitions {
              id
              fromStatus
              toStatus
              comment
              occurredAt
            }
          }
        }
      `

      // Fetch chapters and submissions in parallel to prevent sequential waterfall lag
      const [chaptersRes, submissionsRes] = await Promise.all([
        graphqlRequest<{ chaptersBySeries: ChapterDto[] }>(
          chaptersQuery,
          { seriesId: selectedSeriesId },
          true
        ),
        graphqlRequest<{ mySubmissions: Submission[] }>(
          submissionsQuery,
          { seriesId: selectedSeriesId },
          true
        )
      ])

      if (chaptersRes.errors) throw new Error(chaptersRes.errors[0].message)
      const rawChapters = chaptersRes.data?.chaptersBySeries || []
      const submissionsList = submissionsRes.data?.mySubmissions || []

      // Map workflow status dynamically
      const mappedChapters = await Promise.all(rawChapters.map(async (ch) => {
        const mapped: ChapterDto = { ...ch, status: 'draft', version: 1 }

        // Find active submission linked to this chapter
        const matchedSub = submissionsList.find((sub) =>
          sub.manuscripts.some((m) => m.chapterId === ch.id)
        )

        if (matchedSub) {
          const currentMs = matchedSub.manuscripts.find((m) => m.chapterId === ch.id && m.isCurrentVersion)
            || matchedSub.manuscripts.find((m) => m.chapterId === ch.id)

          mapped.status = matchedSub.status
          mapped.submissionId = matchedSub.id
          if (currentMs) {
            mapped.manuscriptId = currentMs.id
            mapped.version = currentMs.version
          }

          // If returned for revision, extract feedback comment from transitions
          if (matchedSub.status === 'ReturnedForRevision') {
            const revisionTransition = [...matchedSub.transitions]
              .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
              .find((t) => t.toStatus === 'ReturnedForRevision')
            mapped.feedback = revisionTransition?.comment || 'Yêu cầu chỉnh sửa lại bản thảo.'

            // Lấy thông tin các trang có ghi chú chưa được giải quyết (status === 'Open') - SINGLE QUERY
            try {
              const unresolvedQuery = `
                 query GetUnresolvedCountByChapter($chapterId: UUID!) {
                   unresolvedCountByChapter(chapterId: $chapterId) {
                     pageNumber
                     unresolvedCount
                   }
                 }
               `
              const unresolvedRes = await graphqlRequest<{ unresolvedCountByChapter: any[] }>(
                unresolvedQuery,
                { chapterId: ch.id },
                true
              )
              const list = unresolvedRes.data?.unresolvedCountByChapter || []
              const annotatedPagesList = list
                .filter((r) => r.unresolvedCount > 0)
                .map((r) => r.pageNumber)
                .sort((a, b) => a - b)

              if (annotatedPagesList.length > 0) {
                mapped.annotatedPagesText = `Cần sửa đổi ở: Trang ` + annotatedPagesList.join(', Trang ')
              }
            } catch (err) {
              console.error('Error fetching annotations for chapter pages:', err)
            }
          }
        }

        if (ch.isPublished) {
          mapped.status = 'published'
        }

        return mapped
      }))

      setChapters(mappedChapters)
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi nạp dữ liệu chương: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedSeriesId])

  // 4. Handle Create Chapter
  const handleCreateChapter = async () => {
    if (!newTitle.trim()) {
      toast.warning('Vui lòng nhập tiêu đề chương.')
      return
    }
    const num = parseFloat(newChapterNumber)
    if (isNaN(num) || num <= 0) {
      toast.warning('Vui lòng nhập số thứ tự chương hợp lệ.')
      return
    }

    setIsCreating(true)
    try {
      const mutation = `
        mutation CreateChapter($input: CreateChapterRequestInput!) {
          createChapter(input: $input) {
            id
            title
            chapterNumber
          }
        }
      `
      const res = await graphqlRequest<any>(
        mutation,
        {
          input: {
            title: newTitle.trim(),
            chapterNumber: num,
            seriesId: selectedSeriesId
          }
        },
        true
      )

      if (res.errors) throw new Error(res.errors[0].message)

      toast.success('Tạo chương mới thành công.')
      setCreateDialogOpen(false)
      setNewTitle('')
      setNewChapterNumber('')
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tạo chương: ' + err.message)
    } finally {
      setIsCreating(false)
    }
  }

  // 5. Handle Open Submit Workflow Dialog
  const handleOpenSubmitDialog = (chapter: ChapterDto) => {
    setTargetChapter(chapter)
    setSubmittingNote('')
    setSubmitDialogOpen(true)
  }

  // 6. Handle Submit Workflow (Snapshot + Submit Manuscript)
  const handleSubmitWorkflow = async () => {
    if (!targetChapter) return

    setIsSubmittingWorkflow(true)
    try {
      const submitMutation = `
        mutation SubmitChapterForReview($chapterId: UUID!, $note: String) {
          submitChapterForReview(chapterId: $chapterId, note: $note) {
            id
            title
            status
          }
        }
      `
      const submitRes = await graphqlRequest<any>(
        submitMutation,
        {
          chapterId: targetChapter.id,
          note: submittingNote.trim() || null
        },
        true
      )

      if (submitRes.errors) throw new Error(submitRes.errors[0].message)

      toast.success('Đã nộp duyệt bản thảo thành công.')
      setSubmitDialogOpen(false)
      setTargetChapter(null)
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi nộp duyệt: ' + err.message)
    } finally {
      setIsSubmittingWorkflow(false)
    }
  }

  // Filter lists
  const currentSeries = mySeries.find((s) => s.id === selectedSeriesId)
  const isSeriesApproved = currentSeries?.status === 'Ongoing'

  const inProgressChapters = chapters.filter(ch => ch.status === 'draft' || ch.status === 'ReturnedForRevision')
  const reviewChapters = chapters.filter(ch => ch.status === 'Submitted' || ch.status === 'UnderTantouReview' || ch.status === 'ForwardedToBoard')
  const publishedChapters = chapters.filter(ch => ch.status === 'published' || ch.status === 'Approved' || ch.status === 'Published')

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto p-1">

        {/* Banner Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              Sáng tác & Chương Truyện
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý các chương sáng tác, đóng gói bản thảo và gửi nộp duyệt cho Biên tập viên của bạn.
            </p>
          </div>
          {selectedSeriesId && (
            <Button className="rounded-xl font-semibold gap-2 shadow-sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-5 w-5" />
              Tạo chương mới
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
              <SelectTrigger className="rounded-xl border-border bg-card">
                <SelectValue placeholder="Chọn bộ truyện sáng tác" />
              </SelectTrigger>
              <SelectContent>
                {mySeries.length === 0 ? (
                  <SelectItem value="none" disabled>Chưa có bộ truyện sáng tác nào</SelectItem>
                ) : (
                  mySeries.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading / Main content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground text-sm font-medium">Đang tải danh sách chương manga...</p>
          </div>
        ) : mySeries.length === 0 ? (
          <Card className="border-dashed bg-card/50 flex flex-col items-center justify-center p-12 text-center rounded-2xl min-h-[320px]">
            <BookOpen className="h-12 w-12 text-muted-foreground opacity-55 mb-3" />
            <CardTitle className="text-xl font-bold mb-1">Chưa có bộ truyện sáng tác</CardTitle>
            <CardDescription className="max-w-md">
              Bạn cần gửi đề xuất mở bộ truyện mới và được Hội đồng phê duyệt hoạt động trước khi tạo chương sáng tác.
            </CardDescription>
          </Card>
        ) : (
          <Tabs defaultValue="in_progress" className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-xl">
              <TabsTrigger value="in_progress" className="rounded-lg font-semibold px-4 py-1.5">
                Đang làm ({inProgressChapters.length})
              </TabsTrigger>
              <TabsTrigger value="review" className="rounded-lg font-semibold px-4 py-1.5">
                Đang kiểm duyệt ({reviewChapters.length})
              </TabsTrigger>
              <TabsTrigger value="published" className="rounded-lg font-semibold px-4 py-1.5">
                Đã xuất bản ({publishedChapters.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab: In Progress */}
            <TabsContent value="in_progress" className="space-y-4">
              {inProgressChapters.length === 0 ? (
                <Card className="border-dashed bg-card flex flex-col items-center justify-center py-16 text-center rounded-xl">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/45 mb-2" />
                  <p className="text-muted-foreground text-sm">Không có chương truyện nào đang chỉnh sửa.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {inProgressChapters.map((ch) => (
                    <ChapterCard key={ch.id} chapter={ch} isSeriesApproved={isSeriesApproved} onSubmit={handleOpenSubmitDialog} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Under Review */}
            <TabsContent value="review" className="space-y-4">
              {reviewChapters.length === 0 ? (
                <Card className="border-dashed bg-card flex flex-col items-center justify-center py-16 text-center rounded-xl">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/45 mb-2" />
                  <p className="text-muted-foreground text-sm">Không có chương nào đang trong tiến trình kiểm duyệt.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {reviewChapters.map((ch) => (
                    <ChapterCard key={ch.id} chapter={ch} isSeriesApproved={isSeriesApproved} onSubmit={handleOpenSubmitDialog} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Published */}
            <TabsContent value="published" className="space-y-4">
              {publishedChapters.length === 0 ? (
                <Card className="border-dashed bg-card flex flex-col items-center justify-center py-16 text-center rounded-xl">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/45 mb-2" />
                  <p className="text-muted-foreground text-sm">Chưa có chương truyện nào được xuất bản chính thức.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {publishedChapters.map((ch) => (
                    <ChapterCard key={ch.id} chapter={ch} isSeriesApproved={isSeriesApproved} onSubmit={handleOpenSubmitDialog} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Dialog: Create Chapter */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Tạo Chương Mới
              </DialogTitle>
              <DialogDescription>
                Thêm một chương truyện mới cho bộ truyện hiện tại.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="space-y-1.5">
                <Label htmlFor="num" className="text-sm font-semibold">Số thứ tự chương (Chapter Number)</Label>
                <Input
                  id="num"
                  type="number"
                  step="any"
                  placeholder="Ví dụ: 1 hoặc 2 hoặc 1.5"
                  value={newChapterNumber}
                  onChange={(e) => setNewChapterNumber(e.target.value)}
                  className="rounded-xl border-border bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-semibold">Tiêu đề chương</Label>
                <Input
                  id="title"
                  placeholder="Ví dụ: Chương 1: Khởi đầu mới"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl border-border bg-background"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="rounded-xl" onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
                Hủy bỏ
              </Button>
              <Button className="rounded-xl bg-primary text-primary-foreground font-semibold" onClick={handleCreateChapter} disabled={isCreating}>
                {isCreating ? 'Đang tạo...' : 'Tạo chương'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Submit Workflow */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Nộp Duyệt Bản Thảo
              </DialogTitle>
              <DialogDescription>
                Hệ thống sẽ tiến hành đóng gói (Snapshot) ảnh truyện hiện tại và gửi bản thảo này đến Tantou Editor để kiểm duyệt.
              </DialogDescription>
            </DialogHeader>

            {targetChapter && (
              <div className="space-y-4 my-4">
                <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 space-y-1">
                  <h4 className="font-bold text-foreground">Chương {targetChapter.chapterNumber}: {targetChapter.title}</h4>
                  <p className="text-xs text-muted-foreground">Phiên bản bản thảo hiện tại: <span className="font-semibold text-foreground">V{targetChapter.version}</span></p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note" className="text-sm font-semibold">Lời nhắn gửi Biên tập viên (Tùy chọn)</Label>
                  <Textarea
                    id="note"
                    placeholder="Nhập lời nhắn hoặc ghi chú của bạn về bản thảo chương này gửi đến Tantou Editor..."
                    value={submittingNote}
                    onChange={(e) => setSubmittingNote(e.target.value)}
                    className="min-h-[90px] rounded-xl border-border bg-background resize-none"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="rounded-xl" onClick={() => setSubmitDialogOpen(false)} disabled={isSubmittingWorkflow}>
                Hủy bỏ
              </Button>
              <Button className="rounded-xl bg-primary text-primary-foreground font-semibold gap-2" onClick={handleSubmitWorkflow} disabled={isSubmittingWorkflow}>
                {isSubmittingWorkflow ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Xác nhận nộp duyệt
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  )
}

function ChapterCard({ chapter, isSeriesApproved, onSubmit }: { chapter: ChapterDto; isSeriesApproved: boolean; onSubmit: (ch: ChapterDto) => void }) {
  const isDraft = chapter.status === 'draft'
  const isReturned = chapter.status === 'ReturnedForRevision'
  const isUnderReview = chapter.status === 'Submitted' || chapter.status === 'UnderTantouReview' || chapter.status === 'ForwardedToBoard'
  const isPublished = chapter.status === 'published' || chapter.status === 'Approved' || chapter.status === 'Published'

  const progress = isPublished ? 100
    : chapter.status === 'Approved' ? 95
      : chapter.status === 'ForwardedToBoard' ? 80
        : chapter.status === 'UnderTantouReview' ? 65
          : chapter.status === 'Submitted' ? 50
            : isReturned ? 30
              : 10

  return (
    <Card className="bg-card hover:border-primary/10 hover:shadow-sm transition-all rounded-2xl overflow-hidden border border-border/80">
      <CardContent className="p-6 space-y-4">

        {/* Upper Card Row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex gap-4 items-start">
            {/* Fallback Preview Cover */}
            <div className="flex h-20 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/50 to-muted/80 text-primary border border-border/60 flex-shrink-0">
              <BookOpen className="h-7 w-7 opacity-60" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-foreground">
                  Chương {chapter.chapterNumber}: {chapter.title}
                </h3>
                <Badge variant={
                  isPublished ? 'default' :
                    isUnderReview ? 'secondary' :
                      isReturned ? 'destructive' : 'outline'
                } className="font-semibold text-xs py-0.5 rounded-full">
                  {getStatusLabel(chapter.status || 'draft')}
                </Badge>
                {chapter.version && (
                  <Badge variant="outline" className="text-[10px] font-normal border-border rounded-full py-0">
                    Bản thảo V{chapter.version}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span>Ngày tạo: {new Date(chapter.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Action Dropdown Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem className="gap-2">
                  <Eye className="h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <FileEdit className="h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Feedback block for ReturnedForRevision */}
        {isReturned && chapter.feedback && (
          <div className="flex flex-col gap-2 p-3.5 bg-yellow-500/10 border border-yellow-500/15 text-yellow-600 rounded-xl text-xs font-medium">
            <div className="flex gap-2">
              <MessageSquare className="h-4 w-4 flex-shrink-0 text-yellow-600/80 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Nhận xét sửa đổi của Tantou Editor:</p>
                <p className="text-muted-foreground font-normal leading-relaxed">{chapter.feedback}</p>
              </div>
            </div>
            {chapter.annotatedPagesText && (
              <div className="mt-2 pt-2 border-t border-yellow-500/20 text-red-500 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>{chapter.annotatedPagesText}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Quy trình hoàn thành chương</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 rounded-full bg-secondary" />
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-3 flex-wrap pt-2">
          <Link href={`/mangaka/workspace?chapterId=${chapter.id}`} className="flex-1 min-w-[140px]">
            <Button variant="outline" className="w-full gap-2 rounded-xl font-semibold border-border hover:bg-secondary/40">
              <Eye className="h-4 w-4" />
              Vào Workspace vẽ tranh
            </Button>
          </Link>
          <Link href={`/mangaka/tasks?chapter=${chapter.id}`} className="flex-1 min-w-[140px]">
            <Button variant="outline" className="w-full gap-2 rounded-xl font-semibold border-border hover:bg-secondary/40">
              <UserCheck className="h-4 w-4" />
              Giao việc cho Assistant
            </Button>
          </Link>
          {(isDraft || isReturned) && (
            <Button
              className="flex-1 min-w-[140px] rounded-xl font-bold shadow-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onSubmit(chapter)}
            >
              <Send className="h-4 w-4" />
              Nộp duyệt bản thảo
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
