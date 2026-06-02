'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AppShell } from '@/components/app-shell'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { graphqlRequest, restRequest } from '@/lib/api'
import { toast } from 'sonner'
import {
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  FileImage,
  History,
  RotateCcw,
  AlertCircle,
  Plus,
  Eye,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  BookOpen,
  Layers,
  Maximize2,
  MessageSquare,
  Type,
  Pencil
} from 'lucide-react'
import Link from 'next/link'
import { getOptimizedImageUrl } from '@/lib/image-utils'

interface PageResponseDto {
  id: string
  pageNumber: number
  imageUrl: string
  version: number
  isCurrentVersion: boolean
  cloudinaryPublicId?: string
  width: number
  height: number
  fileSizeBytes: number
  createdAt: string
}

interface ChapterDetail {
  id: string
  title: string
  chapterNumber: number
  isPublished: boolean
  seriesId: string
  status?: string
}

interface AnnotationItem {
  id: string
  content: string
  category: string
  shape: string
  x: number
  y: number
  width: number
  height: number
  resolved: boolean
  createdAt: string
}

function MangakaWorkspaceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chapterId = searchParams.get('chapterId')

  const [chapter, setChapter] = useState<ChapterDetail | null>(null)
  const [pages, setPages] = useState<PageResponseDto[]>([])
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(-1)
  const [loading, setLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [zoom, setZoom] = useState(100)

  // Version History States
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyPages, setHistoryPages] = useState<PageResponseDto[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyPageNum, setHistoryPageNum] = useState<number>(-1)

  // Annotation States
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationItem | null>(null)
  const [pageAnnotationCounts, setPageAnnotationCounts] = useState<Record<string, number>>({})
  const [showAnnotations, setShowAnnotations] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Fetch data on load
  useEffect(() => {
    if (!chapterId) {
      toast.error('Không tìm thấy Chapter ID.')
      setLoading(false)
      return
    }

    const fetchWorkspaceData = async () => {
      setLoading(true)
      try {
        const pagesQuery = `
          query GetPagesByChapter($chapterId: UUID!) {
            pagesByChapter(chapterId: $chapterId) {
              id
              pageNumber
              imageUrl
              version
              isCurrentVersion
              cloudinaryPublicId
              width
              height
              fileSizeBytes
              createdAt
            }
          }
        `
        const pagesRes = await graphqlRequest<{ pagesByChapter: PageResponseDto[] }>(
          pagesQuery,
          { chapterId },
          true
        )

        if (pagesRes.errors) throw new Error(pagesRes.errors[0].message)
        const sortedPages = (pagesRes.data?.pagesByChapter || []).sort((a, b) => a.pageNumber - b.pageNumber)
        setPages(sortedPages)
        if (sortedPages.length > 0) {
          setSelectedPageIndex(0)
        }

        const chapterQuery = `
          query GetChapterById($id: UUID!) {
            chapterById(id: $id) {
              id
              title
              chapterNumber
              isPublished
              seriesId
            }
          }
        `
        const chapterRes = await graphqlRequest<{ chapterById: ChapterDetail | null }>(
          chapterQuery,
          { id: chapterId },
          true
        )

        if (chapterRes.errors) throw new Error(chapterRes.errors[0].message)
        const foundChapter = chapterRes.data?.chapterById

        if (foundChapter) {
          setChapter(foundChapter)
        } else {
          setChapter({
            id: chapterId,
            title: 'Bản vẽ chương truyện',
            chapterNumber: 1,
            isPublished: false,
            seriesId: ''
          })
        }
      } catch (err: any) {
        console.error(err)
        toast.error('Lỗi nạp dữ liệu workspace: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaceData()
  }, [chapterId])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const filesArray = Array.from(files)
    setUploading(true)
    setUploadProgress(5)

    try {
      let currentMaxPageNum = pages.length > 0 ? Math.max(...pages.map(p => p.pageNumber)) : 0
      
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i]
        if (!file.type.startsWith('image/')) {
          toast.warning(`Bỏ qua tệp không phải ảnh: ${file.name}`)
          continue
        }

        const pageNum = currentMaxPageNum + 1
        currentMaxPageNum++

        setUploadProgress(Math.round(((i + 0.1) / filesArray.length) * 100))

        const formData = new FormData()
        formData.append('File', file)
        formData.append('ChapterId', chapterId!)
        formData.append('PageNumber', pageNum.toString())

        await restRequest<any>('/Upload/page', {
          method: 'POST',
          body: formData,
          isFormData: true,
          requireAuth: true
        })
      }

      toast.success(`Đã tải lên thành công toàn bộ ${filesArray.length} trang bản thảo!`)

      const pagesQuery = `
        query GetPagesByChapter($chapterId: UUID!) {
          pagesByChapter(chapterId: $chapterId) {
            id
            pageNumber
            imageUrl
            version
            isCurrentVersion
            cloudinaryPublicId
            width
            height
            fileSizeBytes
            createdAt
          }
        }
      `
      const pagesRes = await graphqlRequest<{ pagesByChapter: PageResponseDto[] }>(
        pagesQuery,
        { chapterId: chapterId! },
        true
      )
      const sortedPages = (pagesRes.data?.pagesByChapter || []).sort((a, b) => a.pageNumber - b.pageNumber)
      setPages(sortedPages)

      if (sortedPages.length > 0) {
        setSelectedPageIndex(sortedPages.length - 1)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tải tệp bản thảo: ' + err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const uploadPageFile = async (file: File, pageNum: number) => {
    setUploading(true)
    setUploadProgress(10)
    try {
      const formData = new FormData()
      formData.append('File', file)
      formData.append('ChapterId', chapterId!)
      formData.append('PageNumber', pageNum.toString())

      setUploadProgress(40)
      const res = await restRequest<any>('/Upload/page', {
        method: 'POST',
        body: formData,
        isFormData: true,
        requireAuth: true
      })

      setUploadProgress(90)
      toast.success(`Tải lên Trang ${pageNum} thành công!`)

      const pagesQuery = `
        query GetPagesByChapter($chapterId: UUID!) {
          pagesByChapter(chapterId: $chapterId) {
            id
            pageNumber
            imageUrl
            version
            isCurrentVersion
            cloudinaryPublicId
            width
            height
            fileSizeBytes
            createdAt
          }
        }
      `
      const pagesRes = await graphqlRequest<{ pagesByChapter: PageResponseDto[] }>(
        pagesQuery,
        { chapterId: chapterId! },
        true
      )
      const sortedPages = (pagesRes.data?.pagesByChapter || []).sort((a, b) => a.pageNumber - b.pageNumber)
      setPages(sortedPages)

      const newIndex = sortedPages.findIndex(p => p.pageNumber === pageNum)
      if (newIndex !== -1) {
        setSelectedPageIndex(newIndex)
      } else if (sortedPages.length > 0) {
        setSelectedPageIndex(sortedPages.length - 1)
      }

    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tải tệp lên Cloudinary: ' + err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUpdatePageFile = async (e: React.ChangeEvent<HTMLInputElement>, pageNum: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    await uploadPageFile(file, pageNum)
  }

  const viewPageHistory = async (pageNum: number) => {
    setHistoryPageNum(pageNum)
    setHistoryLoading(true)
    setHistoryOpen(true)
    try {
      const historyQuery = `
        query GetPageHistory($chapterId: UUID!, $pageNumber: Int!) {
          pageHistory(chapterId: $chapterId, pageNumber: $pageNumber) {
            succeeded
            message
            data {
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
        }
      `
      const res = await graphqlRequest<any>(
        historyQuery,
        { chapterId, pageNumber: pageNum },
        true
      )

      if (res.errors) throw new Error(res.errors[0].message)
      const result = res.data?.pageHistory
      if (!result?.succeeded) {
        throw new Error(result?.message || 'Không thể lấy lịch sử phiên bản.')
      }

      setHistoryPages(result.data || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi lấy lịch sử: ' + err.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Fetch annotations for the active page
  const fetchAnnotations = async (pageId: string) => {
    try {
      const query = `
        query GetAnnotationsByPage($pageId: UUID!) {
          annotationsByPage(pageId: $pageId) {
            id
            content
            category
            shape
            x
            y
            width
            height
            status
            createdAt
          }
        }
      `
      const res = await graphqlRequest<{ annotationsByPage: any[] }>(query, { pageId }, true)
      if (res.errors) throw new Error(res.errors[0].message)

      const mapped = (res.data?.annotationsByPage || []).map(item => ({
        ...item,
        resolved: item.status !== 'Open'
      }))
      setAnnotations(mapped)
      setSelectedAnnotation(null)
    } catch (err: any) {
      console.error('Error fetching annotations:', err)
      setAnnotations([])
    }
  }

  // Fetch annotation counts for all pages (to show badges) - SINGLE QUERY
  const fetchAllAnnotationCounts = async (pagesList: PageResponseDto[]) => {
    if (!chapterId) return
    try {
      const query = `
        query GetUnresolvedCountByChapter($chapterId: UUID!) {
          unresolvedCountByChapter(chapterId: $chapterId) {
            pageId
            unresolvedCount
          }
        }
      `
      const res = await graphqlRequest<{ unresolvedCountByChapter: any[] }>(
        query,
        { chapterId },
        true
      )
      if (res.errors) throw new Error(res.errors[0].message)

      const list = res.data?.unresolvedCountByChapter || []
      const counts: Record<string, number> = {}
      for (const item of list) {
        if (item.unresolvedCount > 0) {
          counts[item.pageId] = item.unresolvedCount
        }
      }
      setPageAnnotationCounts(counts)
    } catch (err) {
      console.error('Error fetching annotation counts:', err)
    }
  }

  // Fetch annotations when selected page changes - CLEAR STATE IMMEDIATELY
  useEffect(() => {
    // Clear stale annotations instantly before fetching new ones
    setAnnotations([])
    setSelectedAnnotation(null)

    if (selectedPageIndex >= 0 && selectedPageIndex < pages.length) {
      fetchAnnotations(pages[selectedPageIndex].id)
    }
  }, [selectedPageIndex, pages])

  // Set image loading state and preload adjacent page images for instant switching
  useEffect(() => {
    if (selectedPageIndex >= 0 && selectedPageIndex < pages.length) {
      setImageLoading(true)
      
      // Preload next and previous page images
      const pagesToPreload = [selectedPageIndex - 1, selectedPageIndex + 1]
      pagesToPreload.forEach(idx => {
        if (idx >= 0 && idx < pages.length) {
          const url = pages[idx].imageUrl
          if (url) {
            const optimizedUrl = getOptimizedImageUrl(url, 'large')
            const img = new Image()
            img.src = optimizedUrl
          }
        }
      })
    }
  }, [selectedPageIndex, pages])

  // Fetch annotation counts for all pages once pages are loaded
  useEffect(() => {
    if (pages.length > 0) {
      fetchAllAnnotationCounts(pages)
    }
  }, [pages])

  const activePage = selectedPageIndex >= 0 && selectedPageIndex < pages.length ? pages[selectedPageIndex] : null
  const unresolvedCount = annotations.filter(a => !a.resolved).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground font-medium">Đang tải dữ liệu vẽ tranh của chương...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold">
            <Link href="/mangaka/chapters" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Chương truyện
            </Link>
            <span>/</span>
            <span className="text-foreground">Workspace Vẽ Tranh</span>
          </div>
          {chapter && (
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              Chương {chapter.chapterNumber}: {chapter.title}
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-semibold gap-2"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <UploadCloud className="h-5 w-5" />
            Tải lên Trang mới
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            multiple
          />
        </div>
      </div>

      {uploading && (
        <Card className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
                Đang tải lên và tối ưu hóa bản vẽ qua Cloudinary...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2 bg-secondary" />
          </div>
        </Card>
      )}

      <div className={`grid grid-cols-1 ${annotations.length > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6 items-start`}>
        <Card className="bg-card rounded-2xl border border-border/80 overflow-hidden lg:col-span-1 shadow-sm">
          <CardHeader className="border-b border-border/60 py-4 bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Trang truyện ({pages.length})
            </CardTitle>
            <CardDescription>Chọn trang truyện để xem hoặc cập nhật</CardDescription>
          </CardHeader>
          <CardContent className="p-3 max-h-[580px] overflow-y-auto space-y-2">
            {pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-xl bg-card">
                <FileImage className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground font-semibold">Chưa có trang vẽ nào</p>
                <Button variant="ghost" size="sm" className="mt-2 text-primary text-xs" onClick={handleUploadClick}>
                  Tải trang đầu tiên
                </Button>
              </div>
            ) : (
              pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                    selectedPageIndex === idx
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
                    {pageAnnotationCounts[p.id] && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm animate-pulse">
                        {pageAnnotationCounts[p.id]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">Trang {p.pageNumber}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>Phiên bản V{p.version}</span>
                      <span>•</span>
                      <span>{(p.fileSizeBytes / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Annotation sidebar panel - only show when there are annotations */}
        {annotations.length > 0 && (
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-card rounded-2xl border border-border/80 overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 py-3 bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-destructive" />
                  Ghi chú BTV ({annotations.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  {unresolvedCount > 0 ? (
                    <span className="text-destructive font-semibold">{unresolvedCount} ghi chú chưa sửa</span>
                  ) : (
                    <span className="text-green-600 font-semibold">Tất cả đã giải quyết ✓</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 max-h-[350px] overflow-y-auto space-y-2">
                {annotations.map((anno) => (
                  <button
                    key={anno.id}
                    onClick={() => setSelectedAnnotation(anno)}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${
                      selectedAnnotation?.id === anno.id
                        ? 'bg-primary/10 border-primary/40 shadow-sm'
                        : 'bg-secondary/30 hover:bg-secondary/60 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className={`text-[10px] py-0 rounded-full font-bold ${
                        anno.category === 'DIALOGUE' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
                        anno.category === 'ARTWORK' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
                        'border-red-500/30 text-red-500 bg-red-500/5'
                      }`}>
                        {anno.category === 'DIALOGUE' ? 'Lời thoại' :
                         anno.category === 'ARTWORK' ? 'Hình vẽ' :
                         anno.category === 'PACING' ? 'Nhịp độ' :
                         anno.category === 'STORY' ? 'Cốt truyện' : anno.category}
                      </Badge>
                      {anno.resolved ? (
                        <Badge variant="outline" className="text-[10px] py-0 border-green-500/20 text-green-500 font-bold bg-green-500/5 rounded-full">
                          Đã sửa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 border-destructive/20 text-destructive font-bold bg-destructive/5 rounded-full">
                          Chưa sửa
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground font-semibold line-clamp-2 leading-relaxed">{anno.content}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Annotation detail card */}
            {selectedAnnotation && (
              <Card className="bg-card rounded-2xl border border-primary/30 overflow-hidden shadow-sm">
                <CardHeader className="py-3 px-4 bg-primary/5 border-b border-border/60">
                  <CardTitle className="text-xs font-bold text-foreground">Chi tiết ghi chú BTV</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                  <p className="font-semibold text-muted-foreground flex justify-between">
                    <span>Phân loại:</span>
                    <span className="text-foreground font-bold">
                      {selectedAnnotation.category === 'DIALOGUE' ? 'Lời thoại / Câu chữ' :
                       selectedAnnotation.category === 'ARTWORK' ? 'Hình vẽ / Phối cảnh' :
                       selectedAnnotation.category === 'PACING' ? 'Nhịp độ / Chia Panel' :
                       selectedAnnotation.category === 'STORY' ? 'Cốt truyện / Plot' : selectedAnnotation.category}
                    </span>
                  </p>
                  <p className="font-semibold text-muted-foreground flex justify-between">
                    <span>Trạng thái:</span>
                    <span className={selectedAnnotation.resolved ? 'text-green-500 font-bold' : 'text-destructive font-bold'}>
                      {selectedAnnotation.resolved ? 'Đã sửa đổi ✓' : '⚠ Chưa sửa đổi'}
                    </span>
                  </p>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-foreground font-semibold">
                    <p className="text-[10px] text-yellow-600 font-bold mb-1">Nội dung góp ý:</p>
                    {selectedAnnotation.content}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="lg:col-span-3 space-y-4">
          {activePage ? (
            <Card className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
              <CardHeader className="border-b border-border/60 py-4 px-6 flex flex-row justify-between items-center bg-muted/20">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    Trang {activePage.pageNumber}
                    <Badge variant="outline" className="border-primary/20 text-primary font-semibold rounded-full bg-primary/5 py-0">
                      Bản thảo V{activePage.version}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cập nhật cuối: {new Date(activePage.createdAt).toLocaleString('vi-VN')}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl border-border" onClick={() => setZoom(z => Math.max(50, z - 10))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-bold w-12 text-center text-foreground">{zoom}%</span>
                  <Button variant="outline" size="icon" className="rounded-xl border-border" onClick={() => setZoom(z => Math.min(200, z + 10))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>

                  <Button 
                    variant="outline" 
                    className="rounded-xl border-border gap-1 text-xs font-semibold ml-2"
                    onClick={() => viewPageHistory(activePage.pageNumber)}
                  >
                    <History className="h-4 w-4" />
                    Lịch sử V{activePage.version}
                  </Button>

                  {annotations.length > 0 && (
                    <Button 
                      variant={showAnnotations ? 'default' : 'outline'}
                      className="rounded-xl gap-1 text-xs font-semibold"
                      onClick={() => setShowAnnotations(!showAnnotations)}
                    >
                      <Pencil className="h-4 w-4" />
                      {showAnnotations ? 'Ẩn ghi chú' : 'Hiện ghi chú'} ({annotations.length})
                    </Button>
                  )}

                  <div className="relative">
                    <Button variant="outline" className="rounded-xl border-border gap-1 text-xs font-semibold" onClick={() => document.getElementById(`update-file-${activePage.pageNumber}`)?.click()}>
                      <UploadCloud className="h-4 w-4" />
                      Tải đè vẽ lại
                    </Button>
                    <input
                      type="file"
                      id={`update-file-${activePage.pageNumber}`}
                      onChange={(e) => handleUpdatePageFile(e, activePage.pageNumber)}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-slate-950/40 flex items-center justify-center min-h-[500px]">
                <div 
                  className="relative border border-border/50 rounded-xl overflow-hidden bg-background shadow-md transition-all duration-300 max-h-[700px] flex justify-center"
                  style={{ width: `${zoom}%` }}
                >
                  <img 
                    src={getOptimizedImageUrl(activePage.imageUrl, 'large')} 
                    alt={`Bản vẽ Trang ${activePage.pageNumber}`} 
                    className={`max-h-[680px] object-contain w-auto h-auto transition-all duration-200 ${imageLoading ? 'opacity-30 blur-[2px]' : 'opacity-100 blur-0'}`}
                    onLoad={() => setImageLoading(false)}
                  />

                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px] z-20">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  )}

                  {/* Annotation dots overlay */}
                  {showAnnotations && annotations.map((anno) => (
                    <button
                      key={anno.id}
                      onClick={() => setSelectedAnnotation(anno)}
                      className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-125 shadow-lg border-2 border-white z-10 ${
                        anno.resolved
                          ? 'bg-green-500 text-white'
                          : anno.category === 'DIALOGUE'
                            ? 'bg-blue-500 text-white'
                            : anno.category === 'ARTWORK'
                              ? 'bg-amber-500 text-white'
                              : 'bg-red-500 text-white'
                      }`}
                      style={{ left: `${anno.x}%`, top: `${anno.y}%` }}
                      title={anno.content}
                    >
                      {anno.category === 'DIALOGUE' ? <Type className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-2 border-dashed border-border/80 rounded-2xl flex flex-col items-center justify-center p-16 text-center min-h-[450px]">
              <UploadCloud className="h-16 w-16 text-muted-foreground opacity-55 mb-4 animate-bounce" />
              <CardTitle className="text-xl font-bold text-foreground">Không có trang vẽ nào đang hiển thị</CardTitle>
              <CardDescription className="max-w-md mt-1">
                Chương truyện này chưa có trang bản thảo nào được vẽ. Hãy bắt đầu tải lên bản vẽ đầu tiên của bạn dưới dạng ảnh PNG/JPG.
              </CardDescription>
              <Button className="mt-6 rounded-xl font-bold gap-2" onClick={handleUploadClick}>
                <Plus className="h-5 w-5" />
                Bắt đầu tải ảnh trang
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[95vw] max-h-[95vh] flex flex-col rounded-2xl bg-card border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Lịch sử phiên bản Trang {historyPageNum}
            </DialogTitle>
            <DialogDescription>
              Xem lại các phiên bản vẽ cũ được lưu trữ trên Cloudinary.
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-sm text-muted-foreground font-semibold">Đang tải lịch sử phiên bản...</span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-4 p-1">
              {historyPages.map((hp) => (
                <Card key={hp.id} className={`bg-card/50 border border-border overflow-hidden rounded-xl ${hp.isCurrentVersion ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="aspect-[3/4] bg-slate-900 flex items-center justify-center relative border-b border-border overflow-hidden">
                    <img src={getOptimizedImageUrl(hp.imageUrl, 'medium')} alt={`V${hp.version}`} className="object-contain h-full w-full" />
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-foreground">
                      Phiên bản V{hp.version}
                    </div>
                    {hp.isCurrentVersion && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-[10px] font-bold">
                        Hiện tại
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 text-xs space-y-1">
                    <p className="font-bold flex items-center justify-between">
                      <span>Kích thước:</span>
                      <span className="text-muted-foreground">{hp.width} x {hp.height}</span>
                    </p>
                    <p className="font-bold flex items-center justify-between">
                      <span>Dung lượng:</span>
                      <span className="text-muted-foreground">{(hp.fileSizeBytes / 1024).toFixed(0)} KB</span>
                    </p>
                    <p className="font-bold flex items-center justify-between">
                      <span>Thời gian:</span>
                      <span className="text-muted-foreground">{new Date(hp.createdAt).toLocaleString('vi-VN')}</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button className="rounded-xl" onClick={() => setHistoryOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MangakaWorkspacePage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-semibold">Đang tải Workspace vẽ tranh...</p>
        </div>
      </AppShell>
    }>
      <AppShell>
        <MangakaWorkspaceContent />
      </AppShell>
    </Suspense>
  )
}
