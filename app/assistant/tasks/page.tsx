'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppShell } from '@/components/app-shell'
import { mockTasks, getTaskTypeLabel, getStatusLabel, formatCurrency } from '@/lib/mock-data'
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
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function AssistantTasksPage() {
  const [selectedTask, setSelectedTask] = useState<typeof mockTasks[0] | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  const myTasks = mockTasks.filter(t => t.assignedTo === 'u2')
  const pendingTasks = myTasks.filter(t => t.status === 'pending')
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress')
  const submittedTasks = myTasks.filter(t => t.status === 'submitted')
  const completedTasks = myTasks.filter(t => t.status === 'approved' || t.status === 'revision')

  const TaskCard = ({ task }: { task: typeof mockTasks[0] }) => {
    const deadline = new Date(task.deadline)
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const isUrgent = daysLeft <= 2

    return (
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-muted">
                <FileImage className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {getTaskTypeLabel(task.type)}
                  </h3>
                  <Badge variant={
                    task.status === 'approved' ? 'default' :
                    task.status === 'in_progress' ? 'secondary' :
                    task.status === 'revision' ? 'destructive' : 'outline'
                  }>
                    {getStatusLabel(task.status)}
                  </Badge>
                  {isUrgent && task.status !== 'approved' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Deadline: {task.deadline}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-foreground">{formatCurrency(task.payment)}</span>
                </div>
              </div>
            </div>
          </div>

          {task.status === 'revision' && task.feedback && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">Yêu cầu chỉnh sửa:</p>
              <p className="text-sm text-destructive/80 mt-1">{task.feedback}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {(task.status === 'pending' || task.status === 'in_progress' || task.status === 'revision') && (
              <>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Tải file
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
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
            {task.status === 'submitted' && (
              <Button variant="outline" size="sm" className="gap-1">
                <Eye className="h-4 w-4" />
                Xem bản nộp
              </Button>
            )}
            {task.status === 'approved' && (
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
            {pendingTasks.length === 0 ? (
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
                {selectedTask && getTaskTypeLabel(selectedTask.type)} - {selectedTask?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tải lên file kết quả</Label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Kéo thả file hoặc click để tải lên
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ: PSD, PNG, JPG (tối đa 100MB)
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú (tuỳ chọn)</Label>
                <Textarea 
                  placeholder="Thêm ghi chú về công việc đã hoàn thành..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                Huỷ
              </Button>
              <Button className="gap-1">
                <Upload className="h-4 w-4" />
                Nộp kết quả
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
