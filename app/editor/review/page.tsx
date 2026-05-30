'use client'

import { useState } from 'react'
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

// Mock annotations
const mockAnnotations = [
  { id: 'a1', x: 20, y: 15, type: 'dialogue', content: 'Câu thoại này hơi dài, cần cắt ngắn lại', resolved: false },
  { id: 'a2', x: 60, y: 45, type: 'art', content: 'Góc nhìn panel này chưa rõ ràng', resolved: false },
  { id: 'a3', x: 30, y: 70, type: 'pacing', content: 'Cảnh này nên kéo dài thêm 1 trang', resolved: true },
]

export default function EditorReviewPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [annotations, setAnnotations] = useState(mockAnnotations)
  const [selectedAnnotation, setSelectedAnnotation] = useState<typeof mockAnnotations[0] | null>(null)
  const [isAddAnnotationOpen, setIsAddAnnotationOpen] = useState(false)
  const [annotationMode, setAnnotationMode] = useState(false)

  const totalPages = 20
  const unresolvedCount = annotations.filter(a => !a.resolved).length

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Xét duyệt bản thảo</h1>
            <p className="text-muted-foreground">
              Digital Hearts - Chương 29: Connection Lost
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 text-destructive border-destructive">
              <XCircle className="h-4 w-4" />
              Yêu cầu chỉnh sửa
            </Button>
            <Button className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Phê duyệt
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Page Viewer */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-foreground">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={annotationMode ? 'default' : 'outline'}
                      onClick={() => setAnnotationMode(!annotationMode)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {annotationMode ? 'Đang đánh dấu' : 'Đánh dấu'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="relative aspect-[3/4] rounded-lg bg-muted overflow-hidden cursor-crosshair"
                  onClick={() => annotationMode && setIsAddAnnotationOpen(true)}
                >
                  {/* Manga page placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Trang manga sẽ hiển thị ở đây</p>
                      <p className="text-xs mt-1">Click để thêm ghi chú (khi đang ở chế độ đánh dấu)</p>
                    </div>
                  </div>

                  {/* Annotation markers */}
                  {annotations.map((anno) => (
                    <button
                      key={anno.id}
                      className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${anno.resolved
                        ? 'bg-success/80 text-success-foreground'
                        : anno.type === 'dialogue'
                          ? 'bg-primary/80 text-primary-foreground'
                          : anno.type === 'art'
                            ? 'bg-warning/80 text-warning-foreground'
                            : 'bg-accent/80 text-accent-foreground'
                        }`}
                      style={{ left: `${anno.x}%`, top: `${anno.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAnnotation(anno)
                      }}
                    >
                      {anno.type === 'dialogue' ? <Type className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Annotations Panel */}
          <div className="space-y-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">Ghi chú</CardTitle>
                <CardDescription>
                  {unresolvedCount} ghi chú chưa giải quyết
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {annotations.map((anno) => (
                  <button
                    key={anno.id}
                    className={`w-full text-left rounded-lg p-3 transition-colors ${selectedAnnotation?.id === anno.id
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                      }`}
                    onClick={() => setSelectedAnnotation(anno)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={
                        anno.type === 'dialogue' ? 'default' :
                          anno.type === 'art' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {anno.type === 'dialogue' ? 'Thoại' :
                          anno.type === 'art' ? 'Hình vẽ' : 'Nhịp truyện'}
                      </Badge>
                      {anno.resolved && (
                        <CheckCircle2 className="h-3 w-3 text-success" />
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{anno.content}</p>
                  </button>
                ))}

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setIsAddAnnotationOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Thêm ghi chú
                </Button>
              </CardContent>
            </Card>

            {selectedAnnotation && (
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Chi tiết ghi chú</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Loại</p>
                    <Badge className="mt-1">
                      {selectedAnnotation.type === 'dialogue' ? 'Thoại' :
                        selectedAnnotation.type === 'art' ? 'Hình vẽ' : 'Nhịp truyện'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nội dung</p>
                    <p className="text-foreground mt-1">{selectedAnnotation.content}</p>
                  </div>
                  <div className="flex gap-2">
                    {!selectedAnnotation.resolved ? (
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setAnnotations(prev =>
                            prev.map(a => a.id === selectedAnnotation.id ? { ...a, resolved: true } : a)
                          )
                          setSelectedAnnotation({ ...selectedAnnotation, resolved: true })
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Đánh dấu đã xử lý
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setAnnotations(prev =>
                            prev.map(a => a.id === selectedAnnotation.id ? { ...a, resolved: false } : a)
                          )
                          setSelectedAnnotation({ ...selectedAnnotation, resolved: false })
                        }}
                      >
                        Mở lại
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add Annotation Dialog */}
        <Dialog open={isAddAnnotationOpen} onOpenChange={setIsAddAnnotationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm ghi chú</DialogTitle>
              <DialogDescription>
                Thêm ghi chú cho vị trí đã chọn trên trang
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Loại ghi chú</Label>
                <Select defaultValue="dialogue">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dialogue">Thoại</SelectItem>
                    <SelectItem value="art">Hình vẽ</SelectItem>
                    <SelectItem value="pacing">Nhịp truyện</SelectItem>
                    <SelectItem value="general">Chung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nội dung ghi chú</Label>
                <Textarea
                  placeholder="Mô tả vấn đề hoặc yêu cầu chỉnh sửa..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddAnnotationOpen(false)}>
                Huỷ
              </Button>
              <Button className="gap-1">
                <Send className="h-4 w-4" />
                Thêm ghi chú
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
