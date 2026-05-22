"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Eye,
  Clock,
  User,
  Layers,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download
} from "lucide-react"
import { mockTasks, getTaskTypeLabel, formatCurrency } from "@/lib/mock-data"

interface Submission {
  id: string
  taskId: string
  pageNumber: number
  taskType: string
  assistant: string
  submittedAt: string
  originalImage: string
  resultImage: string
  status: 'pending' | 'approved' | 'revision'
  feedback?: string
}

const mockSubmissions: Submission[] = [
  {
    id: 'sub1',
    taskId: 't3',
    pageNumber: 3,
    taskType: 'screentone',
    assistant: 'Sato Emi',
    submittedAt: '2026-05-20 14:30',
    originalImage: '/pages/ch46-p3-original.jpg',
    resultImage: '/pages/ch46-p3-screentone.jpg',
    status: 'pending',
  },
  {
    id: 'sub2',
    taskId: 't4',
    pageNumber: 4,
    taskType: 'effects',
    assistant: 'Yamamoto Ken',
    submittedAt: '2026-05-21 09:15',
    originalImage: '/pages/ch46-p4-original.jpg',
    resultImage: '/pages/ch46-p4-effects.jpg',
    status: 'approved',
    feedback: 'Perfect speed lines! Great work.'
  },
  {
    id: 'sub3',
    taskId: 't5',
    pageNumber: 5,
    taskType: 'background',
    assistant: 'Sato Emi',
    submittedAt: '2026-05-19 16:45',
    originalImage: '/pages/ch46-p5-original.jpg',
    resultImage: '/pages/ch46-p5-bg.jpg',
    status: 'revision',
    feedback: 'The perspective on the building needs adjustment. Please fix the vanishing point.'
  },
]

export default function MangakaReviewPage() {
  const [submissions, setSubmissions] = useState(mockSubmissions)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [viewMode, setViewMode] = useState<'original' | 'result' | 'compare'>('result')
  const [zoom, setZoom] = useState(100)

  const pendingSubmissions = submissions.filter(s => s.status === 'pending')
  const reviewedSubmissions = submissions.filter(s => s.status !== 'pending')

  const handleApprove = (submissionId: string) => {
    setSubmissions(submissions.map(s => 
      s.id === submissionId 
        ? { ...s, status: 'approved' as const, feedback: feedback || 'Approved' }
        : s
    ))
    setReviewDialogOpen(false)
    setFeedback("")
    setSelectedSubmission(null)
  }

  const handleRequestRevision = (submissionId: string) => {
    if (!feedback.trim()) return
    setSubmissions(submissions.map(s => 
      s.id === submissionId 
        ? { ...s, status: 'revision' as const, feedback }
        : s
    ))
    setReviewDialogOpen(false)
    setFeedback("")
    setSelectedSubmission(null)
  }

  const openReview = (submission: Submission) => {
    setSelectedSubmission(submission)
    setFeedback(submission.feedback || "")
    setReviewDialogOpen(true)
  }

  return (
    <AppShell role="mangaka">
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
                      <div className="w-40 h-48 bg-muted flex items-center justify-center border-r border-border shrink-0">
                        <div className="text-center text-muted-foreground">
                          <Layers className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-xs">Page {submission.pageNumber}</p>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">Page {submission.pageNumber} - {getTaskTypeLabel(submission.taskType as any)}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <User className="h-3 w-3" />
                              {submission.assistant}
                              <span className="text-muted-foreground/50">|</span>
                              <Clock className="h-3 w-3" />
                              {submission.submittedAt}
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
                          <Button variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message Assistant
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
                    <div className="w-40 h-40 bg-muted flex items-center justify-center border-r border-border shrink-0">
                      <div className="text-center text-muted-foreground">
                        <Layers className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">Page {submission.pageNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">Page {submission.pageNumber} - {getTaskTypeLabel(submission.taskType as any)}</h3>
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

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                Review: Page {selectedSubmission?.pageNumber} - {selectedSubmission && getTaskTypeLabel(selectedSubmission.taskType as any)}
              </DialogTitle>
              <DialogDescription>
                Submitted by {selectedSubmission?.assistant} on {selectedSubmission?.submittedAt}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Image Viewer */}
              <div className="col-span-2 space-y-4">
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
                      <div className="bg-muted h-80 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <p className="text-xs mb-2">Original</p>
                          <Layers className="h-16 w-16 mx-auto opacity-50" />
                        </div>
                      </div>
                      <div className="bg-muted h-80 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <p className="text-xs mb-2">Result</p>
                          <Layers className="h-16 w-16 mx-auto opacity-50" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Layers className="h-16 w-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{viewMode === 'original' ? 'Original Image' : 'Result Image'}</p>
                        <p className="text-xs mt-1">Page {selectedSubmission?.pageNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Feedback Panel */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Task Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span>{selectedSubmission && getTaskTypeLabel(selectedSubmission.taskType as any)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Page</span>
                      <span>{selectedSubmission?.pageNumber}</span>
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
                
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Files
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
