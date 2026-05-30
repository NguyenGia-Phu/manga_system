'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AppShell } from '@/components/app-shell'
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Type,
  Pencil,
  Clock,
  Send,
  ArrowLeft,
  BookOpen,
  FileCheck,
  AlertTriangle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { graphqlRequest } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

interface SubmissionItem {
  id: string
  title: string
  note: string
  status: string
  seriesId: string
  seriesTitle: string
  mangakaId: string
  mangakaName: string
  assignedTantouId: string | null
  assignedTantouName: string | null
  submittedAt: string
  resolvedAt: string | null
  manuscripts: Array<{
    id: string
    name: string
    status: string
    version: number
    isCurrentVersion: boolean
    chapterId: string
    createdAt: string
  }>
}

interface PageItem {
  id: string
  pageNumber: number
  imageUrl: string
  version: number
  isCurrentVersion: boolean
  width: number
  height: number
  fileSizeBytes: number
  createdAt: string
}

interface AnnotationItem {
  id: string
  content: string
  category: string
  shape: string
  x: number
  y: number
  width: number
  height: number
  resolved: boolean
  createdAt: string
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    submitted: 'Chờ duyệt',
    Submitted: 'Chờ duyệt',
    UnderTantouReview: 'Tantou đang duyệt',
    ForwardedToBoard: 'Chờ hội đồng duyệt',
    ReturnedForRevision: 'Yêu cầu sửa đổi',
    Approved: 'Đã phê duyệt',
    Published: 'Đã xuất bản'
  }
  return labels[status] || status
}

function EditorReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const submissionId = searchParams.get('submission')

  useEffect(() => {
    if (!submissionId) {
      router.push('/editor/manuscripts')
    }
  }, [submissionId, router])

  const [loading, setLoading] = useState(true)
  const [submission, setSubmission] = useState<SubmissionItem | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(-1)

  // Annotations
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationItem | null>(null)
  const [isAddAnnotationOpen, setIsAddAnnotationOpen] = useState(false)
  const [annotationMode, setAnnotationMode] = useState(false)

  // Dialog fields
  const [newAnnoContent, setNewAnnoContent] = useState('')
  const [newAnnoCategory, setNewAnnoCategory] = useState('DIALOGUE')

  // Workflow Dialogs
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnFeedback, setReturnFeedback] = useState('')
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [approveFeedback, setApproveFeedback] = useState('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  const [zoom, setZoom] = useState(100)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Temporary coordinates when clicking the canvas to place an annotation
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null)

  const fetchSubmission = async () => {
    if (!submissionId) {
      toast.error('Không thấy Submission ID.')
      setLoading(false)
      return
    }

    try {
      const query = `
        query GetSubmissionById($id: UUID!) {
          submissionById(id: $id) {
            id
            title
            note
            status
            seriesId
            seriesTitle
            mangakaId
            mangakaName
            assignedTantouId
            assignedTantouName
            submittedAt
            resolvedAt
            manuscripts {
              id
              name
              status
              version
              isCurrentVersion
              chapterId
              createdAt
            }
          }
        }
      `
      const res = await graphqlRequest<{ submissionById: SubmissionItem }>(query, { id: submissionId }, true)
      if (res.errors) throw new Error(res.errors[0].message)

      const sub = res.data?.submissionById
      if (!sub) {
        throw new Error('Không tìm thấy bản nộp.')
      }

      setSubmission(sub)

      const currentMs = sub.manuscripts.find((m) => m.isCurrentVersion) || sub.manuscripts[0]
      if (currentMs) {
        await fetchPages(currentMs.chapterId)
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi nạp bản nộp: ' + err.message)
      setLoading(false)
    }
  }

  const fetchPages = async (chapterId: string) => {
    try {
      const query = `
        query GetPagesByChapter($chapterId: UUID!) {
          pagesByChapter(chapterId: $chapterId) {
            id
            pageNumber
            imageUrl
            version
            isCurrentVersion
            width
            height
            fileSizeBytes
            createdAt
          }
        }
      `
      const res = await graphqlRequest<{ pagesByChapter: PageItem[] }>(query, { chapterId }, true)
      if (res.errors) throw new Error(res.errors[0].message)

      const sortedPages = (res.data?.pagesByChapter || []).sort((a, b) => a.pageNumber - b.pageNumber)
      setPages(sortedPages)

      if (sortedPages.length > 0) {
        setSelectedPageIndex(0)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi nạp trang truyện: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnotations = async (pageId: string) => {
    try {
      const query = `
        query GetAnnotationsByPage($pageId: UUID!) {
          annotationsByPage(pageId: $pageId) {
            id
            content
            category
            shape
            x
            y
            width
            height
            status
            createdAt
          }
        }
      `
      const res = await graphqlRequest<{ annotationsByPage: any[] }>(query, { pageId }, true)
      if (res.errors) throw new Error(res.errors[0].message)

      const mapped = (res.data?.annotationsByPage || []).map(item => ({
        ...item,
        resolved: item.status !== 'Open'
      }))
      setAnnotations(mapped)
      setSelectedAnnotation(null)
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi nạp ghi chú trang: ' + err.message)
    }
  }

  useEffect(() => {
    fetchSubmission()
  }, [submissionId])

  useEffect(() => {
    // Clear stale annotations instantly before fetching new ones
    setAnnotations([])
    setSelectedAnnotation(null)

    if (selectedPageIndex >= 0 && selectedPageIndex < pages.length) {
      fetchAnnotations(pages[selectedPageIndex].id)
    }
  }, [selectedPageIndex, pages])

  const activePage = selectedPageIndex >= 0 && selectedPageIndex < pages.length ? pages[selectedPageIndex] : null

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationMode || !activePage) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setClickCoords({ x, y })
    setNewAnnoContent('')
    setIsAddAnnotationOpen(true)
  }

  const handleCreateAnnotation = async () => {
    if (!activePage || !clickCoords || !newAnnoContent.trim()) {
      toast.warning('Vui lòng điền nội dung ghi chú.')
      return
    }

    try {
      const mutation = `
        mutation CreateAnnotation($input: CreateAnnotationRequestInput!) {
          createAnnotation(input: $input) {
            id
            content
            category
            shape
            x
            y
            width
            height
            status
          }
        }
      `
      const res = await graphqlRequest<any>(
        mutation,
        {
          input: {
            pageId: activePage.id,
            content: newAnnoContent.trim(),
            category: newAnnoCategory,
            shape: 'RECTANGLE',
            x: clickCoords.x,
            y: clickCoords.y,
            width: 8,
            height: 8,
            strokeData: null
          }
        },
        true
      )

      if (res.errors) throw new Error(res.errors[0].message)

      toast.success('Thêm ghi chú thành công!')
      setIsAddAnnotationOpen(false)
      setClickCoords(null)
      fetchAnnotations(activePage.id)
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tạo ghi chú: ' + err.message)
    }
  }

  const handleAcceptSubmission = async () => {
    if (!submission) return
    setIsSubmittingAction(true)
    try {
      const mutation = `
        mutation AcceptSubmission($submissionId: UUID!) {
          acceptSubmission(submissionId: $submissionId) {
            id
            status
          }
        }
      `
      const res = await graphqlRequest<any>(mutation, { submissionId: submission.id }, true)
      if (res.errors) throw new Error(res.errors[0].message)

      toast.success('Bắt đầu quy trình thẩm định bản thảo.')
      fetchSubmission()
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tiếp nhận: ' + err.message)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const handleReturnSubmission = async () => {
    if (!submission) return
    setIsSubmittingAction(true)
    try {
      const mutation = `
        mutation ReturnForRevision($submissionId: UUID!, $comment: String!) {
          returnForRevision(submissionId: $submissionId, comment: $comment) {
            id
            status
          }
        }
      `
      const res = await graphqlRequest<any>(
        mutation,
        {
          submissionId: submission.id,
          comment: returnFeedback.trim() || 'Biên tập viên yêu cầu sửa đổi lại bản vẽ.'
        },
        true
      )
      if (res.errors) throw new Error(res.errors[0].message)

      toast.info('Đã trả bản thảo về trạng thái Yêu cầu chỉnh sửa.')
      setReturnDialogOpen(false)
      router.push('/editor/manuscripts')
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi trả bản thảo: ' + err.message)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const handleApproveSubmission = async () => {
    if (!submission) return
    setIsSubmittingAction(true)
    try {
      const mutation = `
        mutation ResolveSubmission($submissionId: UUID!, $approved: Boolean!, $feedback: String!) {
          resolveSubmission(submissionId: $submissionId, approved: $approved, feedback: $feedback) {
            id
            status
          }
        }
      `
      const res = await graphqlRequest<any>(
        mutation,
        {
          submissionId: submission.id,
          approved: true,
          feedback: approveFeedback.trim() || 'Bản vẽ đạt yêu cầu chất lượng xuất bản.'
        },
        true
      )
      if (res.errors) throw new Error(res.errors[0].message)

      toast.success('Bản thảo chương đã được phê duyệt thành công!')
      setApproveDialogOpen(false)
      router.push('/editor/manuscripts')
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi phê duyệt bản thảo: ' + err.message)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground font-semibold">Đang tải bản thảo thẩm định...</p>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
        <h2 className="text-lg font-bold">Không tìm thấy bản nộp</h2>
        <p className="text-muted-foreground text-sm">Vui lòng kiểm tra lại liên kết.</p>
      </div>
    )
  }

  const isPendingTantou = submission.status === 'Submitted'
  const isAuditing = submission.status === 'UnderTantouReview'
  const unresolvedCount = annotations.filter(a => !a.resolved).length

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold">
            <Link href="/editor/manuscripts" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Hòm thư bản thảo
            </Link>
            <span>/</span>
            <span className="text-foreground">Xét duyệt bản thảo</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            {submission.seriesTitle}: {submission.title}
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Sáng tác bởi: <span className="text-foreground font-bold">{submission.mangakaName}</span> • Trạng thái: <Badge variant="outline" className="border-primary/20 text-primary py-0.5 rounded-full">{getStatusLabel(submission.status)}</Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {isPendingTantou && (
            <Button
              className="rounded-xl font-bold bg-primary text-primary-foreground gap-2"
              onClick={handleAcceptSubmission}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? 'Đang tiếp nhận...' : 'Tiếp nhận thẩm định'}
            </Button>
          )}

          {isAuditing && (
            <>
              <Button 
                variant="outline" 
                className="rounded-xl text-destructive border-destructive hover:bg-destructive/5 font-bold gap-2"
                onClick={() => {
                  setReturnFeedback('')
                  setReturnDialogOpen(true)
                }}
              >
                <XCircle className="h-4 w-4" />
                Yêu cầu chỉnh sửa
              </Button>
              <Button 
                className="rounded-xl font-bold bg-success text-success-foreground gap-2 hover:bg-success/90"
                onClick={() => {
                  setApproveFeedback('')
                  setApproveDialogOpen(true)
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Phê duyệt bản vẽ
              </Button>
            </>
          )}
        </div>
      </div>

      {submission.note && (
        <Card className="bg-secondary/20 border border-border/80 rounded-xl p-4">
          <div className="flex gap-2.5">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm space-y-1 leading-relaxed">
              <p className="font-bold text-foreground">Lời nhắn từ Mangaka:</p>
              <p className="text-muted-foreground font-normal">{submission.note}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/60 py-4 px-6 flex flex-row justify-between items-center bg-muted/20">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={selectedPageIndex <= 0}
                  onClick={() => setSelectedPageIndex(idx => idx - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold text-foreground">
                  Trang {activePage ? activePage.pageNumber : 0} / {pages.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={selectedPageIndex >= pages.length - 1}
                  onClick={() => setSelectedPageIndex(idx => idx + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(50, z - 10))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold w-12 text-center text-foreground">{zoom}%</span>
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(200, z + 10))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>

                {isAuditing && (
                  <Button
                    variant={annotationMode ? 'default' : 'outline'}
                    onClick={() => setAnnotationMode(!annotationMode)}
                    className="gap-2 text-xs font-semibold rounded-xl"
                  >
                    <Pencil className="h-4 w-4" />
                    {annotationMode ? 'Click lên hình để đóng ghi chú' : 'Thêm ghi chú lên bản vẽ'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-slate-950/40 flex items-center justify-center min-h-[500px]">
              {activePage ? (
                <div 
                  ref={imageContainerRef}
                  onClick={handleCanvasClick}
                  className={`relative border border-border/50 rounded-xl overflow-hidden bg-background shadow-md transition-all duration-300 max-h-[720px] ${
                    annotationMode ? 'cursor-crosshair' : ''
                  }`}
                  style={{ width: `${zoom}%` }}
                >
                  <img 
                    src={activePage.imageUrl} 
                    alt={`Trang ${activePage.pageNumber}`} 
                    className="max-h-[700px] object-contain w-full h-auto select-none pointer-events-none" 
                  />

                  {annotations.map((anno) => (
                    <button
                      key={anno.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAnnotation(anno)
                      }}
                      className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-125 shadow-lg border-2 border-white ${
                        anno.resolved
                          ? 'bg-success text-success-foreground'
                          : anno.category === 'DIALOGUE'
                            ? 'bg-primary text-primary-foreground'
                            : anno.category === 'ARTWORK'
                              ? 'bg-warning text-warning-foreground'
                              : 'bg-destructive text-destructive-foreground'
                      }`}
                      style={{ left: `${anno.x}%`, top: `${anno.y}%` }}
                      title={anno.content}
                    >
                      {anno.category === 'DIALOGUE' ? <Type className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-12">
                  <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Chương truyện này chưa có trang bản thảo nào được nộp.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <Card className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                Danh sách trang ({pages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 max-h-[220px] overflow-y-auto grid grid-cols-4 gap-2">
              {pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`aspect-[3/4] rounded-lg border font-bold text-xs flex items-center justify-center transition-all ${
                    selectedPageIndex === idx
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-secondary/30 hover:bg-secondary/60 border-border text-muted-foreground'
                  }`}
                >
                  Tr. {p.pageNumber}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="py-4 px-5 bg-muted/20 border-b border-border/60">
              <CardTitle className="text-sm font-bold">Ghi chú sửa đổi ({annotations.length})</CardTitle>
              <CardDescription className="text-xs">
                Có {unresolvedCount} ghi chú chưa sửa đổi
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 max-h-[300px] overflow-y-auto space-y-2">
              {annotations.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted-foreground font-semibold">Chưa có ghi chú nào trên trang này.</p>
              ) : (
                annotations.map((anno) => (
                  <button
                    key={anno.id}
                    onClick={() => setSelectedAnnotation(anno)}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${
                      selectedAnnotation?.id === anno.id
                        ? 'bg-primary/10 border-primary/40 shadow-sm'
                        : 'bg-secondary/30 hover:bg-secondary/60 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[10px] py-0 border-primary/20 text-primary font-bold bg-primary/5 rounded-full">
                        {anno.category}
                      </Badge>
                      {anno.resolved && (
                        <Badge variant="outline" className="text-[10px] py-0 border-success/20 text-success font-bold bg-success/5 rounded-full">
                          Đã sửa
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground font-semibold line-clamp-2 leading-relaxed">{anno.content}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selectedAnnotation && (
            <Card className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
                <CardTitle className="text-xs font-bold text-foreground">Chi tiết ghi chú</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                <p className="font-semibold text-muted-foreground flex justify-between">
                  <span>Phân loại:</span>
                  <span className="text-foreground font-bold">{selectedAnnotation.category}</span>
                </p>
                <p className="font-semibold text-muted-foreground flex justify-between">
                  <span>Trạng thái:</span>
                  <span className={selectedAnnotation.resolved ? 'text-success font-bold' : 'text-destructive font-bold'}>
                    {selectedAnnotation.resolved ? 'Đã sửa đổi' : 'Chưa sửa đổi'}
                  </span>
                </p>
                <div className="p-3 bg-secondary/20 rounded-xl border border-border/50 text-foreground font-semibold">
                  {selectedAnnotation.content}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isAddAnnotationOpen} onOpenChange={setIsAddAnnotationOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Thêm Ghi Chú Bản Vẽ
            </DialogTitle>
            <DialogDescription>
              Nhập nội dung chỉnh sửa/góp ý cho Mangaka tại vị trí đã đánh dấu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold">Loại góp ý</Label>
              <Select value={newAnnoCategory} onValueChange={setNewAnnoCategory}>
                <SelectTrigger className="rounded-xl border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIALOGUE">Dialogue (Lời thoại/Câu chữ)</SelectItem>
                  <SelectItem value="ARTWORK">Artwork (Hình vẽ/ Anatomy / Phối cảnh)</SelectItem>
                  <SelectItem value="PACING">Pacing (Nhịp độ / Chia Panel)</SelectItem>
                  <SelectItem value="STORY">Story (Cốt truyện / Plot Hole)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-semibold">Chi tiết ý kiến</Label>
              <Textarea
                id="content"
                placeholder="Ví dụ: Lời thoại panel này quá dài, nên lược bớt..."
                value={newAnnoContent}
                onChange={(e) => setNewAnnoContent(e.target.value)}
                className="min-h-[100px] rounded-xl border-border bg-background resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsAddAnnotationOpen(false)}>
              Hủy
            </Button>
            <Button className="rounded-xl bg-primary text-primary-foreground font-semibold gap-1.5" onClick={handleCreateAnnotation}>
              <Send className="h-4 w-4" />
              Gửi góp ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Yêu Cầu Chỉnh Sửa
            </DialogTitle>
            <DialogDescription>
              Trả lại bản thảo để Mangaka tiến hành chỉnh sửa dựa trên các ghi chú của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4">
            <Label htmlFor="rev-comment" className="text-sm font-semibold">Nhận xét tổng quan sửa đổi</Label>
            <Textarea
              id="rev-comment"
              placeholder="Ví dụ: Bản vẽ đạt 80%, cần sửa đổi lời thoại chương 1 và nét vẽ nhân vật chính ở trang 3 theo đúng ghi chú..."
              value={returnFeedback}
              onChange={(e) => setReturnFeedback(e.target.value)}
              className="min-h-[120px] rounded-xl border-border bg-background resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setReturnDialogOpen(false)} disabled={isSubmittingAction}>
              Hủy
            </Button>
            <Button className="rounded-xl bg-destructive text-destructive-foreground font-semibold" onClick={handleReturnSubmission} disabled={isSubmittingAction}>
              {isSubmittingAction ? 'Đang gửi...' : 'Gửi yêu cầu sửa đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Phê Duyệt Bản Thảo
            </DialogTitle>
            <DialogDescription>
              Phê duyệt hoàn tất bản thảo chương này. Trạng thái bản thảo sẽ đổi thành Đã phê duyệt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4">
            <Label htmlFor="app-comment" className="text-sm font-semibold">Nhận xét phê duyệt</Label>
            <Textarea
              id="app-comment"
              placeholder="Ví dụ: Bản vẽ hoàn hảo, phối cảnh đẹp và lời thoại rất mượt mà. Đã duyệt xuất bản!"
              value={approveFeedback}
              onChange={(e) => setApproveFeedback(e.target.value)}
              className="min-h-[120px] rounded-xl border-border bg-background resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setApproveDialogOpen(false)} disabled={isSubmittingAction}>
              Hủy
            </Button>
            <Button className="rounded-xl bg-success text-success-foreground font-semibold" onClick={handleApproveSubmission} disabled={isSubmittingAction}>
              {isSubmittingAction ? 'Đang duyệt...' : 'Xác nhận phê duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function EditorReviewPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-semibold">Đang tải trang xét duyệt bản thảo...</p>
        </div>
      </AppShell>
    }>
      <AppShell>
        <EditorReviewContent />
      </AppShell>
    </Suspense>
  )
}
