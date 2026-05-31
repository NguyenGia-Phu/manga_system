"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle2, 
  XCircle, 
  Eye,
  Clock,
  User,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react"
import { getAccessToken, graphqlRequest, restRequest } from "@/lib/api"
import { toast } from "sonner"

interface AssistantDto {
  id: string
  username: string
  email: string
}

interface TaskDto {
  id: string
  title: string
  description: string
  status: string
  dueDate: string | null
  assignedUserName: string | null
  region: { pageId: string } | null
  pageImageUrl: string | null
  resourceUrl: string | null
  resultFileUrl: string | null
  resultNote: string | null
  completedAt: string | null
  createdAt: string
}

interface Submission {
  id: string
  taskId: string
  pageId: string | null
  pageLabel: string
  taskTitle: string
  assistant: string
  submittedAt: string
  originalImage: string
  resultImage: string
  status: 'pending' | 'approved' | 'revision'
  feedback?: string
}

export default function MangakaReviewPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [viewMode, setViewMode] = useState<'original' | 'result' | 'compare'>('result')
  const [zoom, setZoom] = useState(100)

  const pendingSubmissions = useMemo(() => submissions.filter(s => s.status === 'pending'), [submissions])
  const reviewedSubmissions = useMemo(() => submissions.filter(s => s.status !== 'pending'), [submissions])

  const mapStatus = (status: string): Submission['status'] => {
    if (status === 'Review') return 'pending'
    if (status === 'NeedsRevision') return 'revision'
    if (status === 'Done') return 'approved'
    return 'pending'
  }

  const fetchSubmissions = async () => {
    try {
      const tasksQuery = `
        query GetTasksByMangaka {
          tasksByMangaka {
            id
            title
            description
            status
            dueDate
            assignedUserName
            region { pageId }
            pageImageUrl
            resourceUrl
            resultFileUrl
            resultNote
            completedAt
            createdAt
          }
        }
      `
      const tasksRes = await graphqlRequest<{ tasksByMangaka: TaskDto[] }>(tasksQuery, {}, true)
      if (tasksRes.errors) throw new Error(tasksRes.errors[0].message)
      const allTasks = tasksRes.data?.tasksByMangaka || []

      const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values())
      const filtered = uniqueTasks.filter(t => t.status === 'Review' || t.status === 'Done' || t.status === 'NeedsRevision')

      const mapped: Submission[] = filtered.map((task) => ({
        id: task.id,
        taskId: task.id,
        pageId: task.region?.pageId || null,
        pageLabel: task.region?.pageId ? `Page ${task.region.pageId.slice(0, 8)}` : 'Page N/A',
        taskTitle: task.title,
        assistant: task.assignedUserName || 'Assistant',
        submittedAt: task.completedAt || task.createdAt,
        originalImage: task.pageImageUrl || task.resourceUrl || '',
        resultImage: task.resultFileUrl || '',
        status: mapStatus(task.status),
        feedback: task.resultNote || '',
      }))

      setSubmissions(mapped)
    } catch (error: any) {
      console.error('Error fetching submissions:', error)
      toast.error('Lỗi nạp danh sách review: ' + (error?.message || 'Unknown error'))
      setSubmissions([])
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchPageInfo = async (pageId: string) => {
    const query = `
      query GetPageById($id: UUID!) {
        pageById(id: $id) {
          id
          chapterId
          pageNumber
        }
      }
    `
    const res = await graphqlRequest<{ pageById: { id: string; chapterId: string; pageNumber: number } }>(
      query,
      { id: pageId },
      true
    )
    if (res.errors) throw new Error(res.errors[0].message)
    return res.data?.pageById || null
  }

  const handleApprove = async (submissionId: string) => {
    try {
      const submission = submissions.find(s => s.id === submissionId)
      if (!submission?.resultImage || !submission.pageId) {
        toast.error('Thiếu file kết quả hoặc trang cần ghi đè.')
        return
      }

      const pageInfo = await fetchPageInfo(submission.pageId)
      if (!pageInfo) {
        toast.error('Không tìm thấy thông tin trang.')
        return
      }

      const token = getAccessToken()
      const headers: Record<string, string> = {}
      if (token && (submission.resultImage.startsWith('/') || submission.resultImage.includes('localhost') || submission.resultImage.includes('127.0.0.1'))) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const fileRes = await fetch(submission.resultImage, Object.keys(headers).length > 0 ? { headers } : undefined)
      if (!fileRes.ok) throw new Error('Không thể tải file kết quả.')
      const blob = await fileRes.blob()
      let ext = '.png'
      if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') {
        ext = '.jpg'
      } else if (blob.type === 'image/webp') {
        ext = '.webp'
      }
      const fileName = `page_${pageInfo.pageNumber}_task_${submissionId}${ext}`
      const file = new File([blob], fileName, { type: blob.type || 'image/png' })

      const formData = new FormData()
      formData.append('ChapterId', pageInfo.chapterId)
      formData.append('PageNumber', pageInfo.pageNumber.toString())
      formData.append('File', file)

      await restRequest('/Upload/page', {
        method: 'POST',
        body: formData,
        isFormData: true,
        requireAuth: true,
      })

      const mutation = `
        mutation UpdateTaskStatus($taskId: UUID!, $input: UpdateTaskStatusRequestInput!) {
          updateTaskStatus(taskId: $taskId, input: $input) {
            id
            status
            resultNote
          }
        }
      `
      const res = await graphqlRequest<any>(
        mutation,
        {
          taskId: submissionId,
          input: { newStatus: 'DONE', resultNote: feedback.trim() || null },
        },
        true
      )
      if (res.errors) throw new Error(res.errors[0].message)

      setReviewDialogOpen(false)
      setFeedback("")
      setSelectedSubmission(null)
      await fetchSubmissions()
    } catch (error: any) {
      console.error('Approve failed:', error)
      toast.error('Không thể duyệt: ' + (error?.message || 'Unknown error'))
    }
  }

  const handleRequestRevision = async (submissionId: string) => {
    if (!feedback.trim()) return
    try {
      const mutation = `
        mutation UpdateTaskStatus($taskId: UUID!, $input: UpdateTaskStatusRequestInput!) {
          updateTaskStatus(taskId: $taskId, input: $input) {
            id
            status
            resultNote
          }
        }
      `
      const res = await graphqlRequest<any>(
        mutation,
        {
          taskId: submissionId,
          input: { newStatus: 'IN_PROGRESS', resultNote: feedback.trim() },
        },
        true
      )
      if (res.errors) throw new Error(res.errors[0].message)

      setReviewDialogOpen(false)
      setFeedback("")
      setSelectedSubmission(null)
      await fetchSubmissions()
    } catch (error: any) {
      console.error('Request revision failed:', error)
      toast.error('Không thể yêu cầu sửa: ' + (error?.message || 'Unknown error'))
    }
  }

  const openReview = (submission: Submission) => {
    setSelectedSubmission(submission)
    setFeedback(submission.feedback || "")
    setViewMode('result')
    setZoom(100)
    setReviewDialogOpen(true)
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Review Submissions</h1>
          <p className="text-muted-foreground">Review and approve work submitted by your assistants</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-warning">{pendingSubmissions.length}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved Today</p>
                  <p className="text-2xl font-bold text-success">{submissions.filter(s => s.status === 'approved').length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Revision</p>
                  <p className="text-2xl font-bold text-destructive">{submissions.filter(s => s.status === 'revision').length}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Reviewed ({reviewedSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingSubmissions.length > 0 ? (
              <div className="grid gap-4">
                {pendingSubmissions.map((submission) => (
                  <Card key={submission.id} className="overflow-hidden">
                    <div className="flex">
                      {/* Preview */}
                      <div className="w-40 h-48 bg-muted flex items-center justify-center border-r border-border shrink-0 relative overflow-hidden">
                        {submission.resultImage ? (
                          <img src={submission.resultImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : submission.originalImage ? (
                          <img src={submission.originalImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <Layers className="h-8 w-8 mx-auto mb-2" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1 text-center border-t border-border">
                          <p className="text-xs font-semibold">{submission.pageLabel}</p>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{submission.pageLabel} - {submission.taskTitle}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <User className="h-3 w-3" />
                              {submission.assistant}
                              <span className="text-muted-foreground/50">|</span>
                              <Clock className="h-3 w-3" />
                              {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                            Pending Review
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4">
                          <Button onClick={() => openReview(submission)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review Submission
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
                  <p className="text-muted-foreground">All submissions have been reviewed</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            <div className="grid gap-4">
              {reviewedSubmissions.map((submission) => (
                <Card key={submission.id} className="overflow-hidden">
                  <div className="flex">
                    <div className="w-40 h-40 bg-muted flex items-center justify-center border-r border-border shrink-0 relative overflow-hidden">
                      {submission.resultImage ? (
                        <img src={submission.resultImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : submission.originalImage ? (
                        <img src={submission.originalImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Layers className="h-8 w-8 mx-auto mb-2" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1 text-center border-t border-border">
                        <p className="text-xs font-semibold">{submission.pageLabel}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{submission.pageLabel} - {submission.taskTitle}</h3>
                          <p className="text-sm text-muted-foreground">{submission.assistant}</p>
                        </div>
                        <Badge 
                          variant={submission.status === 'approved' ? 'default' : 'destructive'}
                          className={submission.status === 'approved' ? 'bg-success text-success-foreground' : ''}
                        >
                          {submission.status === 'approved' ? 'Approved' : 'Needs Revision'}
                        </Badge>
                      </div>
                      
                      {submission.feedback && (
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Feedback:</span> {submission.feedback}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => openReview(submission)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[95vw] max-h-[95vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Review: {selectedSubmission?.pageLabel} - {selectedSubmission?.taskTitle}
              </DialogTitle>
              <DialogDescription>
                Submitted by {selectedSubmission?.assistant} on {selectedSubmission && new Date(selectedSubmission.submittedAt).toLocaleString('vi-VN')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-6 flex-1 min-h-0">
              {/* Image Viewer */}
              <div className="flex-1 space-y-4 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={viewMode === 'original' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setViewMode('original')}
                    >
                      Original
                    </Button>
                    <Button 
                      variant={viewMode === 'result' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setViewMode('result')}
                    >
                      Result
                    </Button>
                    <Button 
                      variant={viewMode === 'compare' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setViewMode('compare')}
                    >
                      Compare
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(50, z - 25))}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm w-12 text-center">{zoom}%</span>
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(200, z + 25))}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setZoom(100)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="border border-border rounded-lg bg-muted overflow-hidden">
                  {viewMode === 'compare' ? (
                    <div className="grid grid-cols-2 gap-px bg-border">
                      <div className="bg-muted h-[68vh] flex items-center justify-center overflow-hidden">
                        {selectedSubmission?.originalImage ? (
                          <img
                            src={selectedSubmission.originalImage}
                            alt="Original"
                            className="h-full w-full object-contain"
                            style={{ transform: `scale(${zoom / 100})` }}
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <p className="text-xs mb-2">Original</p>
                            <Layers className="h-16 w-16 mx-auto opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="bg-muted h-[68vh] flex items-center justify-center overflow-hidden">
                        {selectedSubmission?.resultImage ? (
                          <img
                            src={selectedSubmission.resultImage}
                            alt="Result"
                            className="h-full w-full object-contain"
                            style={{ transform: `scale(${zoom / 100})` }}
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <p className="text-xs mb-2">Result</p>
                            <Layers className="h-16 w-16 mx-auto opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[68vh] flex items-center justify-center overflow-hidden">
                      {viewMode === 'original' && selectedSubmission?.originalImage ? (
                        <img
                          src={selectedSubmission.originalImage}
                          alt="Original"
                          className="h-full w-full object-contain"
                          style={{ transform: `scale(${zoom / 100})` }}
                        />
                      ) : viewMode === 'result' && selectedSubmission?.resultImage ? (
                        <img
                          src={selectedSubmission.resultImage}
                          alt="Result"
                          className="h-full w-full object-contain"
                          style={{ transform: `scale(${zoom / 100})` }}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Layers className="h-16 w-16 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">{viewMode === 'original' ? 'Original Image' : 'Result Image'}</p>
                          <p className="text-xs mt-1">{selectedSubmission?.pageLabel}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Feedback Panel */}
              <div className="w-[350px] shrink-0 space-y-4 overflow-y-auto">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Task Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Task</span>
                      <span>{selectedSubmission?.taskTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Page</span>
                      <span>{selectedSubmission?.pageLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assistant</span>
                      <span>{selectedSubmission?.assistant}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-2">
                  <Label>Feedback / Notes</Label>
                  <Textarea 
                    placeholder="Add feedback for the assistant..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                  />
                </div>
                
                {selectedSubmission?.status === 'pending' && (
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => selectedSubmission && handleApprove(selectedSubmission.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => selectedSubmission && handleRequestRevision(selectedSubmission.id)}
                      disabled={!feedback.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Request Revision
                    </Button>
                    {!feedback.trim() && (
                      <p className="text-xs text-muted-foreground text-center">
                        Please add feedback to request revision
                      </p>
                    )}
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
