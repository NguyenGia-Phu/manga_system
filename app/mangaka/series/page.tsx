'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { AppShell } from '@/components/app-shell'
import { useAppStore } from '@/lib/store'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { graphqlRequest, restRequest } from '@/lib/api'
import Link from 'next/link'

interface Series {
  id: string
  title: string
  alternativeTitle: string | null
  description: string
  coverImageUrl: string | null
  status: 'draft' | 'pending' | 'ongoing' | 'hiatus' | 'cancelled' | 'completed'
  createdAt: string
  updatedAt: string
  authorEmail: string | null
  authorName: string
  authorId: string
  tantouEditorId: string | null
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    ongoing: 'Đang chạy',
    hiatus: 'Tạm ngưng',
    cancelled: 'Đã huỷ',
    completed: 'Hoàn thành',
    in_progress: 'Đang làm',
    review: 'Đang xét duyệt',
    published: 'Đã xuất bản',
    assigned: 'Đã giao',
    submitted: 'Đã nộp',
    revision: 'Cần chỉnh sửa',
  }

  return labels[status] || status
}

export default function MangakaSeriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const mySeries = useAppStore((state) => state.mySeries)
  const setMySeries = useAppStore((state) => state.setMySeries)

  // Form states for creating a new series
  const [newTitle, setNewTitle] = useState('')
  const [newAlternativeTitle, setNewAlternativeTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCoverImage, setNewCoverImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editTitle, setEditTitle] = useState('')
  const [editAlternativeTitle, setEditAlternativeTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCoverImage, setEditCoverImage] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const getStoredUser = () => {
    const storedUser = localStorage.getItem('currentUser')
    return storedUser ? JSON.parse(storedUser) : null
  }

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

  const fetchSeries = useCallback(async () => {
    const query = `
      query GetMySeries {
        mySeries {
          id
          title
          alternativeTitle
          description
          coverImageUrl
          status
          createdAt
          updatedAt
          authorName
          authorId
        }
      }
    `
    try {
      const res = await graphqlRequest<{ mySeries: any[] }>(query, {}, true)

      const backendSeries = (res.data?.mySeries || []).map((s: any) => ({
        ...s,
        status: (s.status || '').toLowerCase(),
        coverImageUrl: s.coverImageUrl === '/covers/default.jpg' ? null : s.coverImageUrl,
      }))

      setMySeries(backendSeries)
    } catch (error) {
      console.error('Error fetching series:', error)
      setMySeries([])
    }
  }, [setMySeries])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('create') === 'true') {
        setIsCreateDialogOpen(true)
      }
    }

    const user = getStoredUser()
    if (user?.id) {
      fetchSeries()
    }
  }, [fetchSeries])

  const handleCreateSeries = async () => {
    if (!newTitle.trim()) return

    setIsSubmitting(true)
    try {
      const user = getStoredUser()

      const formData = new FormData()
      formData.append('Title', newTitle.trim())
      formData.append('Description', newDescription.trim())
      if (newAlternativeTitle.trim()) formData.append('AlternativeTitle', newAlternativeTitle.trim())
      if (user?.email) formData.append('AuthorEmail', user.email)
      if (user?.username) formData.append('AuthorName', user.username)
      if (newCoverImage) formData.append('File', newCoverImage)

      const result = await restRequest<any>('/Upload/series', {
        method: 'POST',
        body: formData,
        isFormData: true,
        requireAuth: true,
      })

      const created = result?.data || result?.Data
      if (created && user?.id) {
        await fetchSeries()
      }

      setIsCreateDialogOpen(false)
      setNewTitle('')
      setNewAlternativeTitle('')
      setNewDescription('')
      setNewCoverImage(null)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (series: Series) => {
    setSelectedSeries(series)
    setEditTitle(series.title || '')
    setEditAlternativeTitle(series.alternativeTitle || '')
    setEditDescription(series.description || '')
    setEditCoverImage(null)
    setIsEditDialogOpen(true)
  }

  const handleUpdateSeries = async () => {
    if (!selectedSeries) return

    setIsUpdating(true)
    try {
      if (!isUuid(selectedSeries.id)) {
        console.warn('Invalid series id for update:', selectedSeries.id)
        return
      }

      const formData = new FormData()
      if (editTitle.trim()) formData.append('Title', editTitle.trim())
      if (editAlternativeTitle.trim()) formData.append('AlternativeTitle', editAlternativeTitle.trim())
      if (editDescription.trim()) formData.append('Description', editDescription.trim())
      if (editCoverImage) formData.append('File', editCoverImage)

      const result = await restRequest<any>(`/Upload/series/${selectedSeries.id}`, {
        method: 'PUT',
        body: formData,
        isFormData: true,
        requireAuth: true,
      })

      const updated = result.data || result.Data
      if (updated) {
        const normalized = {
          ...updated,
          status: (updated.status || updated.Status || '').toLowerCase(),
        }

        const nextSeries = mySeries.map((series) =>
          series.id === normalized.id ? { ...series, ...normalized } : series
        )

        setMySeries(nextSeries)

      }

      setIsEditDialogOpen(false)
      setSelectedSeries(null)
      setEditCoverImage(null)
    } catch (error) {
      console.error('Error updating series:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSeries = async (seriesId: string) => {
    try {
      if (!isUuid(seriesId)) {
        console.warn('Invalid series id for delete:', seriesId)
        return
      }

      await restRequest(`/Upload/series/${seriesId}`, {
        method: 'DELETE',
        requireAuth: true,
      })

      const nextSeries = mySeries.filter((series) => series.id !== seriesId)
      setMySeries(nextSeries)
    } catch (error) {
      console.error('Error deleting series:', error)
    }
  }

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
                  <SeriesCard
                    key={series.id}
                    series={series}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteSeries}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            <div className="flex justify-end">
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
                        <Input
                          id="title"
                          placeholder="VD: Blade of the Eternal"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alternativeTitle">Tên series (Tiếng Nhật)</Label>
                        <Input
                          id="alternativeTitle"
                          placeholder="VD: 永遠の刃"
                          value={newAlternativeTitle}
                          onChange={(e) => setNewAlternativeTitle(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Tóm tắt nội dung / Mô tả</Label>
                      <Textarea
                        id="description"
                        placeholder="Mô tả ngắn gọn về nội dung và cốt truyện của series..."
                        rows={4}
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverImage">Ảnh bìa (Cover Image)</Label>
                      <Input
                        id="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setNewCoverImage(e.target.files[0])
                          } else {
                            setNewCoverImage(null)
                          }
                        }}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">Khuyến nghị kích thước 16:9, tối đa 20MB.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                      Huỷ
                    </Button>
                    <Button className="gap-2" onClick={handleCreateSeries} disabled={isSubmitting || !newTitle.trim()}>
                      <Send className="h-4 w-4" />
                      {isSubmitting ? 'Đang nộp...' : 'Nộp xét duyệt'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {draftSeries.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Không có bản nháp nào</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {draftSeries.map((series) => (
                  <SeriesCard
                    key={series.id}
                    series={series}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteSeries}
                  />
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
                  <SeriesCard
                    key={series.id}
                    series={series}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteSeries}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa series</DialogTitle>
              <DialogDescription>Cập nhật thông tin series và lưu lại thay đổi</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editTitle">Tên series (Tiếng Anh)</Label>
                  <Input
                    id="editTitle"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAlternativeTitle">Tên series (Tiếng Nhật)</Label>
                  <Input
                    id="editAlternativeTitle"
                    value={editAlternativeTitle}
                    onChange={(e) => setEditAlternativeTitle(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Tóm tắt nội dung / Mô tả</Label>
                <Textarea
                  id="editDescription"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCoverImage">Ảnh bìa mới (Cover Image - Tùy chọn)</Label>
                <Input
                  id="editCoverImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setEditCoverImage(e.target.files[0])
                    } else {
                      setEditCoverImage(null)
                    }
                  }}
                  disabled={isUpdating}
                />
                <p className="text-xs text-muted-foreground">Khuyến nghị kích thước 16:9, tối đa 20MB. Để trống nếu giữ nguyên.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                Huỷ
              </Button>
              <Button className="gap-2" onClick={handleUpdateSeries} disabled={isUpdating || !editTitle.trim()}>
                <Send className="h-4 w-4" />
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}

function SeriesCard({
  series,
  onEdit,
  onDelete,
}: {
  series: Series
  onEdit: (series: Series) => void
  onDelete: (seriesId: string) => void
}) {
  return (
    <Card className="bg-card overflow-hidden">
      <div className="flex">
        <div className="flex h-full w-32 flex-shrink-0 items-center justify-center bg-muted">
          {series.coverImageUrl && series.coverImageUrl !== '/covers/default.jpg' ? (
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
                <DropdownMenuItem onClick={() => onEdit(series)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(series.id)}>
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
            <Link href={`/mangaka/chapters?seriesId=${series.id}`} className="flex-1">
              <Button size="sm" className="w-full">
                Quản lý
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

