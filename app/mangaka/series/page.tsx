'use client'

import { useState } from 'react'
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
import { mockSeries, getStatusLabel } from '@/lib/mock-data'
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
  const mySeries = mockSeries.filter(s => s.authorId === 'u1')

  const filteredSeries = mySeries.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.titleJp.includes(searchQuery)
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
                    <Label htmlFor="titleJp">Tên series (Tiếng Nhật)</Label>
                    <Input id="titleJp" placeholder="VD: 永遠の刃" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Thể loại</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thể loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="romance">Romance</SelectItem>
                        <SelectItem value="comedy">Comedy</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                        <SelectItem value="horror">Horror</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Lịch xuất bản</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lịch xuất bản" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Hàng tuần</SelectItem>
                        <SelectItem value="biweekly">2 tuần/lần</SelectItem>
                        <SelectItem value="monthly">Hàng tháng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="synopsis">Tóm tắt nội dung</Label>
                  <Textarea
                    id="synopsis"
                    placeholder="Mô tả ngắn gọn về nội dung và cốt truyện của series..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bản thảo sơ bộ</Label>
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

function SeriesCard({ series }: { series: typeof mockSeries[0] }) {
  const rankChange = series.previousRank - series.rank

  return (
    <Card className="bg-card overflow-hidden">
      <div className="flex">
        <div className="flex h-full w-32 flex-shrink-0 items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">Cover Image</span>
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
              <p className="text-sm text-muted-foreground">{series.titleJp}</p>
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

          <div className="mt-3 flex flex-wrap gap-1">
            {series.genre.map((g) => (
              <Badge key={g} variant="outline" className="text-xs">
                {g}
              </Badge>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Chương</p>
              <p className="font-medium text-foreground">{series.currentChapter}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Xếp hạng</p>
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">#{series.rank}</span>
                {rankChange > 0 && (
                  <span className="flex items-center text-xs text-success">
                    <TrendingUp className="h-3 w-3" />
                    {rankChange}
                  </span>
                )}
                {rankChange < 0 && (
                  <span className="flex items-center text-xs text-destructive">
                    <TrendingDown className="h-3 w-3" />
                    {Math.abs(rankChange)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Bình chọn</p>
              <p className="font-medium text-foreground">{series.votes.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" className="flex-1">
              Quản lý chương
            </Button>
            <Button size="sm" variant="outline">
              Xem thống kê
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
