'use client'

import { useState } from 'react'
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
import { Task, Page, User as UserType, getTaskTypeLabel, getStatusLabel, formatCurrency } from '@/lib/mock-data'
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MousePointer2,
  Layers,
} from 'lucide-react'

export default function MangakaTasksPage() {
  const [pages] = useState<Page[]>([])
  const [tasks] = useState<Task[]>([])
  const [assistants] = useState<UserType[]>([])
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)

  const currentPageTasks = tasks.filter(t => t.pageId === selectedPage)
  const currentPage = pages.find(p => p.id === selectedPage)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Phân công công việc</h1>
            <p className="text-muted-foreground">
              Blade of the Eternal - Chương 46: The Awakening
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectionMode ? 'default' : 'outline'}
              onClick={() => setSelectionMode(!selectionMode)}
              className="gap-2"
            >
              <MousePointer2 className="h-4 w-4" />
              {selectionMode ? 'Đang chọn vùng' : 'Chọn vùng'}
            </Button>
            <Button onClick={() => setIsAssignDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Giao việc mới
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Page List */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">Danh sách trang</CardTitle>
              <CardDescription>Chọn trang để xem và giao việc</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pages.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">Không có trang nào</p>
              ) : (
                pages.map((page) => {
                  const pageTasks = tasks.filter(t => t.pageId === page.id)
                  const completedTasks = pageTasks.filter(t => t.status === 'approved').length
                  
                  return (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPage(page.id)}
                      className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                        selectedPage === page.id
                          ? 'bg-primary/10 border border-primary'
                          : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                      }`}
                    >
                      <div className="flex h-12 w-9 items-center justify-center rounded bg-muted text-xs">
                        {page.pageNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">Trang {page.pageNumber}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{pageTasks.length} công việc</span>
                          {pageTasks.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{completedTasks}/{pageTasks.length} hoàn thành</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        page.status === 'approved' ? 'default' :
                        page.status === 'in_progress' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {getStatusLabel(page.status)}
                      </Badge>
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Page Preview with Selection */}
          <Card className="bg-card lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {currentPage ? `Trang ${currentPage.pageNumber}` : 'Chọn một trang'}
                  </CardTitle>
                  <CardDescription>
                    {selectionMode 
                      ? 'Click và kéo để chọn vùng cần giao việc'
                      : 'Xem trước trang và các công việc đã giao'
                    }
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Layers className="h-4 w-4" />
                    Xem layer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[3/4] rounded-lg bg-muted overflow-hidden">
                {/* This would be the actual manga page image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">Trang manga sẽ hiển thị ở đây</p>
                    <p className="text-xs mt-1">Click vào các vùng được đánh dấu để xem công việc</p>
                  </div>
                </div>
                
                {/* Example task regions could be rendered here based on tasks */}
                {currentPageTasks.map(task => task.region && (
                  <div 
                    key={task.id}
                    className="absolute border-2 border-primary/50 bg-primary/10 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                    style={{
                      top: `${task.region.y}%`,
                      left: `${task.region.x}%`,
                      width: `${task.region.width}%`,
                      height: `${task.region.height}%`
                    }}
                    title={task.description}
                  >
                    <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      {getTaskTypeLabel(task.type)} - {task.assignedToName}
                    </div>
                  </div>
                ))}

                {selectionMode && (
                  <div className="absolute inset-0 cursor-crosshair bg-primary/5" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks for current page */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Công việc của trang {currentPage?.pageNumber || '...'}</CardTitle>
                <CardDescription>Danh sách công việc đã giao và trạng thái</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentPageTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">Chưa có công việc nào được giao cho trang này</p>
                <Button 
                  className="mt-4 gap-2" 
                  onClick={() => setIsAssignDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Giao việc mới
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentPageTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        task.status === 'approved' ? 'bg-success/10 text-success' :
                        task.status === 'submitted' ? 'bg-primary/10 text-primary' :
                        task.status === 'in_progress' ? 'bg-accent/10 text-accent' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {task.status === 'approved' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : task.status === 'submitted' ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {getTaskTypeLabel(task.type)}
                          </span>
                          <Badge variant={
                            task.status === 'approved' ? 'default' :
                            task.status === 'submitted' ? 'secondary' : 'outline'
                          }>
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Giao cho: {task.assignedToName} • Deadline: {task.deadline}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{formatCurrency(task.payment)}</p>
                      </div>
                      <div className="flex gap-2">
                        {task.status === 'submitted' && (
                          <>
                            <Button size="sm" variant="outline" className="gap-1">
                              <XCircle className="h-4 w-4" />
                              Yêu cầu sửa
                            </Button>
                            <Button size="sm" className="gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Duyệt
                            </Button>
                          </>
                        )}
                        {task.status !== 'submitted' && task.status !== 'approved' && (
                          <Button size="sm" variant="outline">Xem</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Task Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Giao việc mới</DialogTitle>
              <DialogDescription>
                Giao công việc cho trợ lý thực hiện
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Loại công việc</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại công việc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="background">Vẽ nền</SelectItem>
                    <SelectItem value="shading">Tô bóng</SelectItem>
                    <SelectItem value="effects">Hiệu ứng</SelectItem>
                    <SelectItem value="screentone">Screentone</SelectItem>
                    <SelectItem value="cleanup">Làm sạch</SelectItem>
                    <SelectItem value="lettering">Chữ viết</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mô tả chi tiết</Label>
                <Textarea 
                  placeholder="Mô tả yêu cầu cụ thể cho công việc này..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Giao cho</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trợ lý" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Thù lao (¥)</Label>
                  <Input type="number" placeholder="10000" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Huỷ
              </Button>
              <Button>Giao việc</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
