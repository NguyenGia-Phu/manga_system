'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppShell } from '@/components/app-shell'
import { Series, getStatusLabel } from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Send,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function MangakaSeriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const mySeries = useAppStore((state) => state.mySeries)
  const setMySeries = useAppStore((state) => state.setMySeries)

  const filteredSeries = mySeries.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.alternativeTitle && s.alternativeTitle.includes(searchQuery))
  )

  const ongoingSeries = filteredSeries.filter(s => s.status === 'ongoing')
  const draftSeries = filteredSeries.filter(s => s.status === 'draft' || s.status === 'pending')
  const completedSeries = filteredSeries.filter(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'hiatus')

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Series của tôi</h1>
            <p className="text-muted-foreground">Quản lý và theo dõi tất cả các series manga</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo series mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo hồ sơ series mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin chi tiết về series mới để trình lên hội đồng xét duyệt
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tên series (Tiếng Anh)</Label>
                    <Input id="title" placeholder="VD: Blade of the Eternal" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alternativeTitle">Tên series (Tiếng Nhật)</Label>
                    <Input id="alternativeTitle" placeholder="VD: 永遠の刃" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Tóm tắt nội dung / Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả ngắn gọn về nội dung và cốt truyện của series..."
                    rows={4}
                  />
                </div>
                {/* Lịch xuất bản và Thể loại đã bị xóa vì không có trong DB tạm thời */}
                <div className="space-y-2">
                  <Label>Ảnh bìa (Cover Image)</Label>
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Kéo thả file hoặc click để tải lên
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Hỗ trợ: PDF, JPG, PNG (tối đa 50MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Huỷ
                </Button>
                <Button className="gap-2">
                  <Send className="h-4 w-4" />
                  Nộp xét duyệt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ongoing" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ongoing">
              Đang chạy ({ongoingSeries.length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Bản nháp ({draftSeries.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Lưu trữ ({completedSeries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing" className="space-y-4">
            {ongoingSeries.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Không có series nào đang chạy</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {ongoingSeries.map((series) => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            {draftSeries.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Không có bản nháp nào</p>
                  <Button className="mt-4 gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Tạo series mới
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {draftSeries.map((series) => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4">
            {completedSeries.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Không có series nào trong lưu trữ</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedSeries.map((series) => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

function SeriesCard({ series }: { series: Series }) {
  return (
    <Card className="bg-card overflow-hidden">
      <div className="flex">
        <div className="flex h-full w-32 flex-shrink-0 items-center justify-center bg-muted">
          {series.coverImageUrl ? (
            <img src={series.coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">No Cover</span>
          )}
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{series.title}</h3>
                <Badge variant={series.status === 'ongoing' ? 'default' : 'secondary'}>
                  {getStatusLabel(series.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{series.alternativeTitle}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xoá
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {series.description}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-sm border-t pt-3">
            <div>
              <p className="text-muted-foreground">Ngày tạo</p>
              <p className="font-medium text-foreground">{new Date(series.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tác giả</p>
              <p className="font-medium text-foreground">{series.authorName}</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" className="flex-1">
              Quản lý
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

