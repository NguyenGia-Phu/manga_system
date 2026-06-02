'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppShell } from '@/components/app-shell'
import { graphqlRequest } from '@/lib/api'
import { toast } from 'sonner'
import {
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MousePointer2,
  Layers,
  ArrowLeft,
  BookOpen,
  FileImage,
  Loader2,
  RotateCcw,
  Ban,
  Eye,
  AlertCircle,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import { getOptimizedImageUrl } from '@/lib/image-utils'

// ─── Types ───────────────────────────────────────────────
interface PageDto {
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

interface RegionDto {
  id: string
  name: string
  description: string
  pageId: string
  x: number
  y: number
  width: number
  height: number
}

interface TaskDto {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string | null
  assignedUserId: string | null
  assignedUserName: string | null
  regionId: string | null
  region: RegionDto | null
  pageImageUrl: string | null
  resourceUrl: string | null
  resultFileUrl: string | null
  resultNote: string | null
  reward: number
  completedAt: string | null
  createdAt: string
}

interface AssistantDto {
  id: string
  username: string
  email: string
}

interface ChapterInfo {
  id: string
  title: string
  chapterNumber: number
  seriesId: string
}

// ─── Helpers ─────────────────────────────────────────────
const statusLabels: Record<string, string> = {
  Todo: 'Chưa bắt đầu',
  InProgress: 'Đang thực hiện',
  Review: 'Chờ duyệt',
  NeedsRevision: 'Cần sửa lại',
  Done: 'Hoàn thành',
  Canceled: 'Đã hủy',
}

const statusColors: Record<string, string> = {
  Todo: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  InProgress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  NeedsRevision: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Canceled: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const priorityLabels: Record<string, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Urgent: 'Khẩn cấp',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

// ─── Main Component ──────────────────────────────────────
function MangakaTasksContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chapterId = searchParams.get('chapter')

  // State
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [chapter, setChapter] = useState<ChapterInfo | null>(null)
  const [pages, setPages] = useState<PageDto[]>([])
  const [assistants, setAssistants] = useState<AssistantDto[]>([])
  const [tasks, setTasks] = useState<TaskDto[]>([])
  const [regions, setRegions] = useState<RegionDto[]>([])

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(false)

  // Region drawing state
  const [selectionMode, setSelectionMode] = useState(false)
  const [drawingRegion, setDrawingRegion] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)
  const [drawnRegion, setDrawnRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Assign dialog
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    assistantId: '',
    priority: 'Medium',
    dueDate: '',
    reward: '',
    regionName: '',
    regionDesc: '',
  })
  const [isAssigning, setIsAssigning] = useState(false)

  // Detail dialog
  const [detailTask, setDetailTask] = useState<TaskDto | null>(null)

  const selectedPage = pages.find(p => p.id === selectedPageId) || null

  // Filter tasks for the selected page's regions
  const currentPageRegionIds = regions.map(r => r.id)
  const currentPageTasks = tasks.filter(t => t.regionId && currentPageRegionIds.includes(t.regionId))

  // ─── Load User ───
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser')
      if (stored) {
        try { setCurrentUser(JSON.parse(stored)) } catch {}
      }
    }
  }, [])

  // ─── Load Chapter, Pages, Assistants ───
  useEffect(() => {
    if (!chapterId || !currentUser) return

    const fetchInitialData = async () => {
      setLoading(true)
      try {
        // 1. Fetch pages for chapter
        const pagesQuery = `
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
        const pagesRes = await graphqlRequest<{ pagesByChapter: PageDto[] }>(
          pagesQuery,
          { chapterId },
          true
        )
        if (pagesRes.errors) throw new Error(pagesRes.errors[0].message)
        const sortedPages = (pagesRes.data?.pagesByChapter || []).sort((a, b) => a.pageNumber - b.pageNumber)
        setPages(sortedPages)

        // 2. Fetch my assistants
        const assistantsQuery = `
          query GetMyAssistants {
            myAssistants {
              id
              username
              email
            }
          }
        `
        const assistantsRes = await graphqlRequest<{ myAssistants: AssistantDto[] }>(
          assistantsQuery,
          {},
          true
        )
        if (assistantsRes.errors) throw new Error(assistantsRes.errors[0].message)
        setAssistants(assistantsRes.data?.myAssistants || [])

        // 3. Find chapter info
        const chapterQuery = `
          query GetChapterById($id: UUID!) {
            chapterById(id: $id) {
              id
              title
              chapterNumber
              seriesId
            }
          }
        `
        const chapterRes = await graphqlRequest<{ chapterById: ChapterInfo | null }>(
          chapterQuery,
          { id: chapterId },
          true
        )
        if (chapterRes.errors) throw new Error(chapterRes.errors[0].message)
        const foundChapter = chapterRes.data?.chapterById
        setChapter(foundChapter || { id: chapterId, title: 'Chương truyện', chapterNumber: 0, seriesId: '' })

        // Select first page
        if (sortedPages.length > 0) {
          setSelectedPageId(sortedPages[0].id)
        }
      } catch (err: any) {
        console.error(err)
        toast.error('Lỗi nạp dữ liệu: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [chapterId, currentUser])

  // ─── Load Regions + Tasks when page selected ───
  const loadPageTasksAndRegions = useCallback(async (pageId: string) => {
    // Clear stale state immediately
    setRegions([])
    setTasks([])
    setTasksLoading(true)
    try {
      // 1. Fetch regions for this page
      const regionsQuery = `
        query GetRegionsByPage($pageId: UUID!) {
          regionsByPage(pageId: $pageId) {
            id
            name
            description
            pageId
            x
            y
            width
            height
          }
        }
      `
      const regionsRes = await graphqlRequest<{ regionsByPage: RegionDto[] }>(
        regionsQuery,
        { pageId },
        true
      )
      if (regionsRes.errors) throw new Error(regionsRes.errors[0].message)
      const pageRegions = regionsRes.data?.regionsByPage || []
      setRegions(pageRegions)

      // 2. Fetch tasks for this page
      const tasksQuery = `
        query GetTasksByPage($pageId: UUID!) {
          tasksByPage(pageId: $pageId) {
            id
            title
            description
            status
            priority
            dueDate
            assignedUserId
            assignedUserName
            regionId
            region { id name description pageId x y width height }
            pageImageUrl
            resourceUrl
            resultFileUrl
            resultNote
            reward
            completedAt
            createdAt
          }
        }
      `
      const tasksRes = await graphqlRequest<{ tasksByPage: TaskDto[] }>(
        tasksQuery,
        { pageId },
        true
      )
      if (tasksRes.errors) throw new Error(tasksRes.errors[0].message)
      setTasks(tasksRes.data?.tasksByPage || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi nạp dữ liệu công việc: ' + err.message)
    } finally {
      setTasksLoading(false)
    }
  }, [assistants])

  useEffect(() => {
    if (selectedPageId && assistants.length >= 0) {
      loadPageTasksAndRegions(selectedPageId)
    }
  }, [selectedPageId, assistants, loadPageTasksAndRegions])

  // ─── Region Drawing Handlers ───
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectionMode || !imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setDrawingRegion({ startX: x, startY: y, currentX: x, currentY: y })
    setDrawnRegion(null)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawingRegion || !imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setDrawingRegion(prev => prev ? { ...prev, currentX: x, currentY: y } : null)
  }

  const handleMouseUp = () => {
    if (!drawingRegion) return
    const x = Math.min(drawingRegion.startX, drawingRegion.currentX)
    const y = Math.min(drawingRegion.startY, drawingRegion.currentY)
    const width = Math.abs(drawingRegion.currentX - drawingRegion.startX)
    const height = Math.abs(drawingRegion.currentY - drawingRegion.startY)
    if (width > 2 && height > 2) {
      setDrawnRegion({ x, y, width, height })
      setSelectionMode(false)
      setIsAssignDialogOpen(true)
    }
    setDrawingRegion(null)
  }

  const getDrawingRect = () => {
    if (!drawingRegion) return null
    return {
      x: Math.min(drawingRegion.startX, drawingRegion.currentX),
      y: Math.min(drawingRegion.startY, drawingRegion.currentY),
      width: Math.abs(drawingRegion.currentX - drawingRegion.startX),
      height: Math.abs(drawingRegion.currentY - drawingRegion.startY),
    }
  }

  // ─── Assign Task ───
  const handleAssignTask = async () => {
    if (!assignForm.title.trim()) { toast.warning('Vui lòng nhập tiêu đề công việc.'); return }
    if (!assignForm.assistantId) { toast.warning('Vui lòng chọn trợ lý.'); return }
    if (!selectedPageId) { toast.warning('Vui lòng chọn trang.'); return }

    setIsAssigning(true)
    try {
      // Determine region - either use drawn region or create a full-page region
      let regionId: string

      if (drawnRegion) {
        // Create new region from drawn area
        const createRegionMutation = `
          mutation CreateRegion($input: CreateRegionRequestInput!) {
            createRegion(input: $input) {
              id
              name
              description
              pageId
              x
              y
              width
              height
            }
          }
        `
        const regionRes = await graphqlRequest<{ createRegion: RegionDto }>(
          createRegionMutation,
          {
            input: {
              name: assignForm.regionName.trim() || assignForm.title.trim(),
              description: assignForm.regionDesc.trim() || assignForm.description.trim() || 'Vùng được giao việc',
              pageId: selectedPageId,
              x: drawnRegion.x,
              y: drawnRegion.y,
              width: drawnRegion.width,
              height: drawnRegion.height,
            },
          },
          true
        )
        if (regionRes.errors) throw new Error(regionRes.errors[0].message)
        regionId = regionRes.data!.createRegion.id
      } else {
        // Create full-page region
        const createRegionMutation = `
          mutation CreateRegion($input: CreateRegionRequestInput!) {
            createRegion(input: $input) { id }
          }
        `
        const regionRes = await graphqlRequest<{ createRegion: { id: string } }>(
          createRegionMutation,
          {
            input: {
              name: assignForm.title.trim(),
              description: assignForm.description.trim() || 'Toàn bộ trang',
              pageId: selectedPageId,
              x: 0, y: 0, width: 100, height: 100,
            },
          },
          true
        )
        if (regionRes.errors) throw new Error(regionRes.errors[0].message)
        regionId = regionRes.data!.createRegion.id
      }

      // Assign task
      const assignTaskMutation = `
        mutation AssignTask($input: AssignTaskRequestInput!) {
          assignTask(input: $input) {
            id
            title
            status
            assignedUserName
          }
        }
      `
      const taskRes = await graphqlRequest<{ assignTask: any }>(
        assignTaskMutation,
        {
          input: {
            title: assignForm.title.trim(),
            description: assignForm.description.trim(),
            assistantId: assignForm.assistantId,
            regionId: regionId,
            priority: assignForm.priority,
            dueDate: assignForm.dueDate ? new Date(assignForm.dueDate).toISOString() : null,
            reward: parseFloat(assignForm.reward) || 0,
          },
        },
        true
      )
      if (taskRes.errors) throw new Error(taskRes.errors[0].message)

      toast.success(`Đã giao việc "${assignForm.title}" thành công!`)
      setIsAssignDialogOpen(false)
      setDrawnRegion(null)
      setAssignForm({ title: '', description: '', assistantId: '', priority: 'Medium', dueDate: '', reward: '', regionName: '', regionDesc: '' })

      // Reload tasks
      if (selectedPageId) loadPageTasksAndRegions(selectedPageId)
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi giao việc: ' + err.message)
    } finally {
      setIsAssigning(false)
    }
  }

  // ─── Update Task Status ───
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      let mappedStatus = newStatus
      if (newStatus === 'Todo') mappedStatus = 'TODO'
      else if (newStatus === 'InProgress') mappedStatus = 'IN_PROGRESS'
      else if (newStatus === 'Review') mappedStatus = 'REVIEW'
      else if (newStatus === 'NeedsRevision') mappedStatus = 'NEEDS_REVISION'
      else if (newStatus === 'Done') mappedStatus = 'DONE'
      else if (newStatus === 'Canceled') mappedStatus = 'CANCELED'

      const mutation = `
        mutation UpdateTaskStatus($taskId: UUID!, $input: UpdateTaskStatusRequestInput!) {
          updateTaskStatus(taskId: $taskId, input: $input) {
            id
            status
          }
        }
      `
      const res = await graphqlRequest<any>(
        mutation,
        {
          taskId,
          input: { newStatus: mappedStatus },
        },
        true
      )
      if (res.errors) throw new Error(res.errors[0].message)

      toast.success('Cập nhật trạng thái thành công!')
      if (selectedPageId) loadPageTasksAndRegions(selectedPageId)
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi cập nhật: ' + err.message)
    }
  }

  // ─── Render ────────────────────────────────────────────
  if (!chapterId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground font-medium">Không tìm thấy Chapter ID trong URL.</p>
        <Link href="/mangaka/chapters">
          <Button variant="outline" className="rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách chương
          </Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-medium">Đang tải dữ liệu phân công...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold">
            <Link href="/mangaka/chapters" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Chương truyện
            </Link>
            <span>/</span>
            <span className="text-foreground">Phân công công việc</span>
          </div>
          {chapter && (
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-primary" />
              Chương {chapter.chapterNumber}: {chapter.title}
            </h1>
          )}
          <p className="text-muted-foreground text-sm">
            Chọn vùng trên trang truyện và giao việc cho trợ lý của bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectionMode ? 'default' : 'outline'}
            className="rounded-xl font-semibold gap-2"
            onClick={() => {
              setSelectionMode(!selectionMode)
              setDrawnRegion(null)
              setDrawingRegion(null)
            }}
            disabled={!selectedPage}
          >
            <MousePointer2 className="h-4 w-4" />
            {selectionMode ? 'Đang chọn vùng...' : 'Chọn vùng giao việc'}
          </Button>
          <Button
            className="rounded-xl font-semibold gap-2"
            onClick={() => {
              setDrawnRegion(null)
              setIsAssignDialogOpen(true)
            }}
            disabled={!selectedPage}
          >
            <Plus className="h-4 w-4" />
            Giao việc toàn trang
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Pages List Panel */}
        <Card className="bg-card rounded-2xl border border-border/80 overflow-hidden lg:col-span-1 shadow-sm">
          <CardHeader className="border-b border-border/60 py-4 bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Trang truyện ({pages.length})
            </CardTitle>
            <CardDescription>Chọn trang để xem và giao việc</CardDescription>
          </CardHeader>
          <CardContent className="p-3 max-h-[580px] overflow-y-auto space-y-2">
            {pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-xl bg-card">
                <FileImage className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground font-semibold">Chưa có trang nào</p>
                <Link href={`/mangaka/workspace?chapterId=${chapterId}`}>
                  <Button variant="ghost" size="sm" className="mt-2 text-primary text-xs">
                    Vào Workspace vẽ trang
                  </Button>
                </Link>
              </div>
            ) : (
              pages.map((p) => {
                const pageTasks = tasks.filter(t => {
                  const r = regions.find(rg => rg.id === t.regionId)
                  return r && r.pageId === p.id
                })
                // We only know tasks for the selected page; for others show "?"
                const isSelected = selectedPageId === p.id

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPageId(p.id)}
                    className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/40 shadow-sm'
                        : 'bg-secondary/30 hover:bg-secondary/60 border border-transparent'
                    }`}
                  >
                    <div className="flex h-12 w-9 items-center justify-center rounded-lg bg-background border border-border/80 overflow-hidden relative flex-shrink-0">
                      {p.imageUrl ? (
                        <img src={getOptimizedImageUrl(p.imageUrl, 'thumbnail')} alt={`Trang ${p.pageNumber}`} className="object-cover h-full w-full" />
                      ) : (
                        <FileImage className="h-4 w-4 opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">Trang {p.pageNumber}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>V{p.version}</span>
                        <span>•</span>
                        <span>{(p.fileSizeBytes / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Page Preview with Regions */}
        <Card className="bg-card rounded-2xl border border-border/80 overflow-hidden lg:col-span-3 shadow-sm">
          <CardHeader className="border-b border-border/60 py-4 px-6 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  {selectedPage ? `Trang ${selectedPage.pageNumber}` : 'Chọn một trang'}
                  {tasksLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  {selectionMode
                    ? '🎯 Nhấn giữ chuột và kéo để chọn vùng cần giao việc trên ảnh'
                    : `${regions.length} vùng • ${currentPageTasks.length} công việc đã giao`
                  }
                </CardDescription>
              </div>
              {selectedPage && (
                <Badge variant="outline" className="rounded-full text-xs font-semibold border-primary/20 text-primary">
                  {selectedPage.width}×{selectedPage.height}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {selectedPage ? (
              <div className="space-y-4">
                {/* Image with regions overlay */}
                <div
                  ref={imageContainerRef}
                  className={`relative rounded-xl overflow-hidden bg-slate-950/40 border border-border/50 ${selectionMode ? 'cursor-crosshair' : 'cursor-default'}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => setDrawingRegion(null)}
                >
                  <img
                    src={getOptimizedImageUrl(selectedPage.imageUrl, 'large')}
                    alt={`Trang ${selectedPage.pageNumber}`}
                    className="w-full h-auto max-h-[600px] object-contain select-none pointer-events-none"
                    draggable={false}
                  />

                  {/* Existing regions */}
                  {regions.map((region) => {
                    const regionTask = currentPageTasks.find(t => t.regionId === region.id)
                    return (
                      <div
                        key={region.id}
                        className="absolute border-2 border-primary/60 bg-primary/10 rounded-sm cursor-pointer hover:bg-primary/20 transition-colors group"
                        style={{
                          top: `${region.y}%`,
                          left: `${region.x}%`,
                          width: `${region.width}%`,
                          height: `${region.height}%`,
                        }}
                        title={`${region.name}${regionTask ? ` — ${regionTask.assignedUserName}` : ''}`}
                      >
                        <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {region.name}{regionTask ? ` • ${regionTask.assignedUserName}` : ''}
                        </div>
                      </div>
                    )
                  })}

                  {/* Currently drawing region */}
                  {drawingRegion && getDrawingRect() && (
                    <div
                      className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/15 rounded"
                      style={{
                        top: `${getDrawingRect()!.y}%`,
                        left: `${getDrawingRect()!.x}%`,
                        width: `${getDrawingRect()!.width}%`,
                        height: `${getDrawingRect()!.height}%`,
                      }}
                    />
                  )}

                  {/* Selection mode overlay */}
                  {selectionMode && (
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                  )}
                </div>

                {/* Tasks table for selected page */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Công việc trên Trang {selectedPage.pageNumber}
                    <Badge variant="outline" className="rounded-full text-xs">{currentPageTasks.length}</Badge>
                  </h3>

                  {tasksLoading ? (
                    <div className="flex items-center justify-center py-8 gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Đang tải danh sách công việc...</span>
                    </div>
                  ) : currentPageTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl bg-card">
                      <UserCheck className="h-10 w-10 text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground text-sm font-medium">Chưa có công việc nào được giao cho trang này</p>
                      <p className="text-muted-foreground text-xs mt-1">Chọn vùng trên ảnh hoặc nhấn "Giao việc toàn trang"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentPageTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                              task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400' :
                              task.status === 'Review' ? 'bg-amber-500/10 text-amber-400' :
                              task.status === 'InProgress' ? 'bg-blue-500/10 text-blue-400' :
                              task.status === 'NeedsRevision' ? 'bg-orange-500/10 text-orange-400' :
                              task.status === 'Canceled' ? 'bg-red-500/10 text-red-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {task.status === 'Done' ? <CheckCircle2 className="h-5 w-5" /> :
                               task.status === 'Review' ? <Clock className="h-5 w-5" /> :
                               task.status === 'InProgress' ? <Loader2 className="h-5 w-5" /> :
                               task.status === 'NeedsRevision' ? <RotateCcw className="h-5 w-5" /> :
                               task.status === 'Canceled' ? <Ban className="h-5 w-5" /> :
                               <User className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground truncate">{task.title}</span>
                                <Badge className={`text-[10px] px-2 py-0 rounded-full border ${statusColors[task.status] || 'bg-muted'}`}>
                                  {statusLabels[task.status] || task.status}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full border-border">
                                  {priorityLabels[task.priority] || task.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{task.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                👤 {task.assignedUserName || 'Chưa giao'}
                                {task.dueDate && <> • 📅 {new Date(task.dueDate).toLocaleDateString('vi-VN')}</>}
                                {task.reward > 0 && <> • 💰 {formatCurrency(task.reward)}</>}
                              </p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setDetailTask(task)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {task.status === 'Review' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs rounded-lg border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'NeedsRevision')}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Yêu cầu sửa
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'Done')}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Duyệt
                                </Button>
                              </>
                            )}
                            {(task.status === 'Todo' || task.status === 'InProgress' || task.status === 'NeedsRevision') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/10"
                                onClick={() => handleUpdateTaskStatus(task.id, 'Canceled')}
                              >
                                <Ban className="h-3 w-3" />
                                Hủy
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] p-8 border-2 border-dashed border-border rounded-xl bg-card text-center">
                <FileImage className="h-16 w-16 text-muted-foreground opacity-40 mb-4" />
                <CardTitle className="text-xl font-bold text-foreground">Chọn một trang truyện</CardTitle>
                <CardDescription className="max-w-md mt-1">
                  Chọn trang từ danh sách bên trái để xem ảnh trang, các vùng đã giao việc và quản lý công việc.
                </CardDescription>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Assign Task Dialog ─── */}
      <Dialog open={isAssignDialogOpen} onOpenChange={(v) => { setIsAssignDialogOpen(v); if (!v) setDrawnRegion(null) }}>
        <DialogContent className="max-w-lg rounded-2xl bg-card border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Giao việc mới
            </DialogTitle>
            <DialogDescription>
              {drawnRegion
                ? 'Giao công việc cho vùng đã chọn trên trang truyện.'
                : 'Giao công việc cho toàn bộ trang truyện.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {drawnRegion && (
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-muted-foreground">
                📐 Vùng đã chọn: X={drawnRegion.x.toFixed(1)}%, Y={drawnRegion.y.toFixed(1)}%, W={drawnRegion.width.toFixed(1)}%, H={drawnRegion.height.toFixed(1)}%
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Tiêu đề công việc <span className="text-red-400">*</span></Label>
              <Input
                placeholder="VD: Vẽ nền cảnh thành phố panel 1-3"
                value={assignForm.title}
                onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))}
                className="rounded-xl border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Mô tả chi tiết</Label>
              <Textarea
                placeholder="Mô tả yêu cầu cụ thể cho công việc này..."
                value={assignForm.description}
                onChange={e => setAssignForm(f => ({ ...f, description: e.target.value }))}
                className="rounded-xl border-border bg-background min-h-[80px] resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Giao cho trợ lý <span className="text-red-400">*</span></Label>
              <Select
                value={assignForm.assistantId}
                onValueChange={v => setAssignForm(f => ({ ...f, assistantId: v }))}
              >
                <SelectTrigger className="rounded-xl border-border bg-background">
                  <SelectValue placeholder="Chọn trợ lý" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.length === 0 ? (
                    <SelectItem value="none" disabled>Chưa có trợ lý nào</SelectItem>
                  ) : (
                    assistants.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.username} ({a.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Độ ưu tiên</Label>
                <Select
                  value={assignForm.priority}
                  onValueChange={v => setAssignForm(f => ({ ...f, priority: v }))}
                >
                  <SelectTrigger className="rounded-xl border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">🟢 Thấp</SelectItem>
                    <SelectItem value="Medium">🟡 Trung bình</SelectItem>
                    <SelectItem value="High">🟠 Cao</SelectItem>
                    <SelectItem value="Urgent">🔴 Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Deadline</Label>
                <Input
                  type="date"
                  value={assignForm.dueDate}
                  onChange={e => setAssignForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="rounded-xl border-border bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Thù lao (¥)</Label>
              <Input
                type="number"
                placeholder="10000"
                value={assignForm.reward}
                onChange={e => setAssignForm(f => ({ ...f, reward: e.target.value }))}
                className="rounded-xl border-border bg-background"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => { setIsAssignDialogOpen(false); setDrawnRegion(null) }} disabled={isAssigning}>
              Hủy bỏ
            </Button>
            <Button className="rounded-xl bg-primary text-primary-foreground font-semibold gap-2" onClick={handleAssignTask} disabled={isAssigning}>
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang giao việc...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Giao việc
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Task Detail Dialog ─── */}
      <Dialog open={!!detailTask} onOpenChange={v => { if (!v) setDetailTask(null) }}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border p-6">
          {detailTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Chi tiết công việc
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 my-2">
                <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 space-y-2">
                  <h4 className="font-bold text-foreground">{detailTask.title}</h4>
                  <p className="text-sm text-muted-foreground">{detailTask.description || 'Không có mô tả'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-medium">Trạng thái</span>
                    <Badge className={`text-xs rounded-full border ${statusColors[detailTask.status] || ''}`}>
                      {statusLabels[detailTask.status] || detailTask.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-medium">Độ ưu tiên</span>
                    <p className="font-semibold text-foreground">{priorityLabels[detailTask.priority] || detailTask.priority}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-medium">Người thực hiện</span>
                    <p className="font-semibold text-foreground">{detailTask.assignedUserName || 'Chưa giao'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-medium">Thù lao</span>
                    <p className="font-semibold text-foreground">{formatCurrency(detailTask.reward)}</p>
                  </div>
                  {detailTask.dueDate && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs font-medium">Deadline</span>
                      <p className="font-semibold text-foreground">{new Date(detailTask.dueDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                  {detailTask.completedAt && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs font-medium">Hoàn thành</span>
                      <p className="font-semibold text-foreground">{new Date(detailTask.completedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                </div>

                {detailTask.resultNote && (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                    <p className="text-xs font-bold text-blue-400 mb-1">Ghi chú kết quả:</p>
                    <p className="text-sm text-muted-foreground">{detailTask.resultNote}</p>
                  </div>
                )}

                {detailTask.resultFileUrl && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                    <p className="text-xs font-bold text-emerald-400 mb-1">File kết quả:</p>
                    <a href={detailTask.resultFileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                      {detailTask.resultFileUrl}
                    </a>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">Ngày tạo: {new Date(detailTask.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <DialogFooter>
                <Button className="rounded-xl" onClick={() => setDetailTask(null)}>Đóng</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MangakaTasksPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-semibold">Đang tải trang phân công...</p>
        </div>
      </AppShell>
    }>
      <AppShell>
        <MangakaTasksContent />
      </AppShell>
    </Suspense>
  )
}
