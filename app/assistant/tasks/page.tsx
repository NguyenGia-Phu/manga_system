'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppShell } from '@/components/app-shell'
import { getAccessToken, graphqlRequest, restRequest } from '@/lib/api'
import {
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileImage,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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
  region?: {
    x: number
    y: number
    width: number
    height: number
  } | null
  pageImageUrl: string | null
  resourceUrl: string | null
  resultFileUrl: string | null
  resultNote: string | null
  reward: number
  completedAt: string | null
  createdAt: string
}

const statusLabels: Record<string, string> = {
  Todo: 'Chưa bắt đầu',
  InProgress: 'Đang thực hiện',
  Review: 'Chờ duyệt',
  NeedsRevision: 'Cần sửa lại',
  Done: 'Hoàn thành',
  Canceled: 'Đã hủy',
}

const taskTypeLabels: Record<string, string> = {
  background: 'Vẽ nền',
  shading: 'Tô bóng',
  effects: 'Hiệu ứng',
  screentone: 'Screentone',
  cleanup: 'Làm sạch',
  lettering: 'Chữ viết',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

export default function AssistantTasksPage() {
  const [tasks, setTasks] = useState<TaskDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewRegion, setPreviewRegion] = useState<TaskDto['region']>(null)
  const [downloadTaskId, setDownloadTaskId] = useState<string | null>(null)
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [resultNote, setResultNote] = useState('')
  const [isSubmittingResult, setIsSubmittingResult] = useState(false)

  const fetchTasks = async () => {
      if (typeof window === 'undefined') return
      const stored = localStorage.getItem('currentUser')
      if (!stored) return

      let userId: string | null = null
      try {
        const parsed = JSON.parse(stored)
        userId = parsed?.id || null
      } catch {
        userId = null
      }
      if (!userId) return

      setIsLoading(true)
      try {
        const query = `
          query GetTasksByUser($userId: UUID!) {
            tasksByUser(userId: $userId) {
              id
              title
              description
              status
              priority
              dueDate
              assignedUserId
              assignedUserName
              regionId
              region { x y width height }
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

        const res = await graphqlRequest<{ tasksByUser: TaskDto[] }>(query, { userId }, true)
        if (res.errors) throw new Error(res.errors[0].message)
        setTasks(res.data?.tasksByUser || [])
      } catch (error) {
        console.error('Error fetching tasks:', error)
        setTasks([])
      } finally {
        setIsLoading(false)
      }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleSubmitResult = async () => {
    if (!selectedTask) return
    if (!resultFile) return

    setIsSubmittingResult(true)
    try {
      const formData = new FormData()
      formData.append('TaskId', selectedTask.id)
      formData.append('File', resultFile)

      const uploadRes = await restRequest<any>('/Upload/task-result', {
        method: 'POST',
        body: formData,
        isFormData: true,
        requireAuth: true,
      })

      const resultFileUrl = uploadRes?.urls?.original || uploadRes?.urls?.Original
      if (!resultFileUrl) {
        throw new Error('Upload failed: missing file URL')
      }

      const mutation = `
        mutation SubmitTaskResult($taskId: UUID!, $input: UpdateTaskStatusRequestInput!) {
          updateTaskStatus(taskId: $taskId, input: $input) {
            id
            status
            resultFileUrl
            resultNote
            completedAt
          }
        }
      `

      const updateRes = await graphqlRequest<any>(
        mutation,
        {
          taskId: selectedTask.id,
          input: {
            newStatus: 'REVIEW',
            resultFileUrl,
            resultNote: resultNote.trim() || null,
          },
        },
        true
      )
      if (updateRes.errors) throw new Error(updateRes.errors[0].message)

      setIsSubmitDialogOpen(false)
      setResultFile(null)
      setResultNote('')
      await fetchTasks()
    } catch (error) {
      console.error('Submit task result failed:', error)
    } finally {
      setIsSubmittingResult(false)
    }
  }

  const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'Todo'), [tasks])
  const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'InProgress'), [tasks])
  const submittedTasks = useMemo(() => tasks.filter(t => t.status === 'Review'), [tasks])
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'Done' || t.status === 'NeedsRevision'), [tasks])

  const getFilenameFromUrl = (url: string, fallbackName: string) => {
    try {
      const parsed = new URL(url)
      const name = parsed.pathname.split('/').pop() || ''
      return name ? decodeURIComponent(name) : fallbackName
    } catch {
      const name = url.split('?')[0].split('/').pop() || ''
      return name || fallbackName
    }
  }

  const handleDownload = async (taskId: string, url: string, fallbackName: string) => {
    setDownloadTaskId(taskId)
    try {
      const token = getAccessToken()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = getFilenameFromUrl(url, fallbackName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Download error:', error)
    } finally {
      setDownloadTaskId(null)
    }
  }

  const TaskCard = ({ task }: { task: TaskDto }) => {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
    const isUrgent = daysLeft !== null && daysLeft <= 2
    const previewSrc = task.pageImageUrl || ''
    const downloadSrc = task.resourceUrl || task.pageImageUrl || ''
    const submittedSrc = task.resultFileUrl || ''
    const taskTypeLabel = taskTypeLabels[(task.title || '').toLowerCase()] || task.title
    const downloadName = `task-${task.id}.png`

    return (
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {previewSrc ? (
                  <img src={previewSrc} alt="Page preview" className="h-full w-full object-cover" />
                ) : (
                  <FileImage className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{taskTypeLabel}</h3>
                  <Badge variant={
                    task.status === 'Done' ? 'default' :
                    task.status === 'InProgress' ? 'secondary' :
                    task.status === 'NeedsRevision' ? 'destructive' : 'outline'
                  }>
                    {statusLabels[task.status] || task.status}
                  </Badge>
                  {isUrgent && task.status !== 'Done' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Deadline: {task.dueDate || 'Chưa đặt'}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-foreground">{formatCurrency(task.reward)}</span>
                </div>
              </div>
            </div>
          </div>

          {task.status === 'NeedsRevision' && task.resultNote && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Yêu cầu chỉnh sửa:</p>
              <p className="text-sm text-destructive/80 mt-1">{task.resultNote}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {(task.status === 'Todo' || task.status === 'InProgress' || task.status === 'NeedsRevision') && (
              <>
                {downloadSrc ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleDownload(task.id, downloadSrc, downloadName)}
                    disabled={downloadTaskId === task.id}
                  >
                    <Download className="h-4 w-4" />
                    {downloadTaskId === task.id ? 'Đang tải...' : 'Tải file'}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1" disabled>
                    <Download className="h-4 w-4" />
                    Tải file
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    if (!previewSrc) return
                    setPreviewUrl(previewSrc)
                    setPreviewRegion(task.region || null)
                    setIsPreviewOpen(true)
                  }}
                  disabled={!previewSrc}
                >
                  <Eye className="h-4 w-4" />
                  Xem trang
                </Button>
                <Button 
                  size="sm" 
                  className="gap-1"
                  onClick={() => {
                    setSelectedTask(task)
                    setIsSubmitDialogOpen(true)
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Nộp kết quả
                </Button>
              </>
            )}
            {task.status === 'Review' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  if (!submittedSrc) return
                  setPreviewUrl(submittedSrc)
                  setPreviewRegion(null)
                  setIsPreviewOpen(true)
                }}
                disabled={!submittedSrc}
              >
                <Eye className="h-4 w-4" />
                Xem bản nộp
              </Button>
            )}
            {task.status === 'Done' && (
              <Button variant="outline" size="sm" className="gap-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Đã hoàn thành
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Công việc được giao</h1>
          <p className="text-muted-foreground">Quản lý và theo dõi tất cả các công việc</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Chờ làm ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              Đang làm ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Đã nộp ({submittedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Hoàn thành ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="mt-2 text-muted-foreground">Đang tải công việc...</p>
                </CardContent>
              </Card>
            ) : pendingTasks.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có công việc chờ làm</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            {inProgressTasks.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có công việc đang làm</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="submitted" className="space-y-4">
            {submittedTasks.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có công việc đã nộp</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submittedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Chưa có công việc hoàn thành</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Submit Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nộp kết quả công việc</DialogTitle>
              <DialogDescription>
                {selectedTask && (taskTypeLabels[(selectedTask.title || '').toLowerCase()] || selectedTask.title)} - {selectedTask?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tải lên file kết quả</Label>
                <label
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-muted/50"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const file = event.dataTransfer.files?.[0]
                    if (file) setResultFile(file)
                  }}
                >
                  <input
                    type="file"
                    accept=".psd,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null
                      setResultFile(file)
                    }}
                  />
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {resultFile ? `Đã chọn: ${resultFile.name}` : 'Kéo thả file hoặc click để tải lên'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hỗ trợ: PSD, PNG, JPG (tối đa 100MB)
                    </p>
                  </div>
                </label>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú (tuỳ chọn)</Label>
                <Textarea 
                  placeholder="Thêm ghi chú về công việc đã hoàn thành..."
                  rows={3}
                  value={resultNote}
                  onChange={(event) => setResultNote(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                Huỷ
              </Button>
              <Button className="gap-1" onClick={handleSubmitResult} disabled={!resultFile || isSubmittingResult}>
                <Upload className="h-4 w-4" />
                {isSubmittingResult ? 'Đang nộp...' : 'Nộp kết quả'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="fixed inset-0 h-screen w-screen max-w-none !rounded-none !border-0 !p-0 !gap-0 !translate-x-0 !translate-y-0">
            <div className="relative h-screen w-screen bg-black">
              <DialogClose className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background">
                <span className="text-lg leading-none">×</span>
              </DialogClose>
              <div className="flex h-full w-full items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <div className="relative inline-block max-h-full max-w-full">
                    <img src={previewUrl} alt="Task preview" className="max-h-screen max-w-screen object-contain" />
                    {previewRegion && (
                      <div
                        className="pointer-events-none absolute border-2 border-amber-400/90 bg-amber-400/10"
                        style={{
                          left: `${previewRegion.x}%`,
                          top: `${previewRegion.y}%`,
                          width: `${previewRegion.width}%`,
                          height: `${previewRegion.height}%`,
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-lg bg-muted">
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
