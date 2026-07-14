'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  FileCheck, 
  Calendar, 
  User, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  Check, 
  MessageSquare,
  Sparkles,
  HelpCircle,
  Eye
} from 'lucide-react'
import { graphqlRequest } from '@/lib/api'
import { toast } from 'sonner'

interface SeriesVote {
  id: string
  seriesId: string
  boardMemberId: string
  boardMemberName: string
  voteType: string
  proposedTantouId: string | null
  comment: string | null
  createdAt: string
}

interface SeriesPending {
  id: string
  seriesId: string
  title: string
  alternativeTitle: string | null
  description: string
  coverImageUrl: string | null
  status: string
  authorId: string
  authorName: string
  createdAt: string
  votes: SeriesVote[]
}

interface EditorUser {
  id: string
  username: string
  email: string
  roles: string[]
}

export default function SeriesApprovalPage() {
  const [pendingSeries, setPendingSeries] = useState<SeriesPending[]>([])
  const [editors, setEditors] = useState<EditorUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeries, setSelectedSeries] = useState<SeriesPending | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)

  // Chapters & Pages dialog states
  const [chaptersDialogOpen, setChaptersDialogOpen] = useState(false)
  const [selectedSeriesForChapters, setSelectedSeriesForChapters] = useState<SeriesPending | null>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [selectedChapterForPages, setSelectedChapterForPages] = useState<any | null>(null)
  const [pages, setPages] = useState<any[]>([])
  const [pagesLoading, setPagesLoading] = useState(false)

  const fetchChapters = async (seriesId: string) => {
    setChaptersLoading(true)
    setChapters([])
    setSelectedChapterForPages(null)
    setPages([])
    try {
      const query = `
        query GetChaptersBySeries($seriesId: UUID!) {
          chaptersBySeries(seriesId: $seriesId) {
            id
            title
            chapterNumber
            createdAt
          }
        }
      `
      const res = await graphqlRequest<{ chaptersBySeries: any[] }>(query, { seriesId }, true)
      if (res.errors) throw new Error(res.errors[0].message)
      setChapters(res.data?.chaptersBySeries || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tải danh sách chương: ' + err.message)
    } finally {
      setChaptersLoading(false)
    }
  }

  const fetchPages = async (chapterId: string) => {
    setPagesLoading(true)
    setPages([])
    try {
      const query = `
        query GetPagesByChapter($chapterId: UUID!) {
          pagesByChapter(chapterId: $chapterId) {
            id
            pageNumber
            imageUrl
          }
        }
      `
      const res = await graphqlRequest<{ pagesByChapter: any[] }>(query, { chapterId }, true)
      if (res.errors) throw new Error(res.errors[0].message)
      setPages((res.data?.pagesByChapter || []).sort((a, b) => a.pageNumber - b.pageNumber))
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tải trang bản thảo: ' + err.message)
    } finally {
      setPagesLoading(false)
    }
  }
  
  // Form states
  const [selectedEditorId, setSelectedEditorId] = useState<string>('')
  const [comment, setComment] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [voteDecision, setVoteDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE')

  // 1. Fetch Pending Series & Editors
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Pending Submissions
      const seriesQuery = `
        query GetSubmissionInbox {
          submissionInbox(filter: FORWARDED_TO_BOARD) {
            id
            seriesId
            seriesTitle
            mangakaId
            mangakaName
            submittedAt
            status
            votes {
              id
              boardMemberId
              boardMemberName
              voteType
            }
          }
        }
      `
      const seriesRes = await graphqlRequest<{ submissionInbox: any[] }>(seriesQuery, {}, true)
      if (seriesRes.errors) {
        throw new Error(seriesRes.errors[0].message)
      }
      
      const mapped = (seriesRes.data?.submissionInbox || []).map(sub => ({
        id: sub.id,
        seriesId: sub.seriesId,
        title: sub.seriesTitle,
        alternativeTitle: null,
        description: 'Không có mô tả',
        coverImageUrl: null,
        status: sub.status,
        authorId: sub.mangakaId || '',
        authorName: sub.mangakaName || 'Unknown',
        createdAt: sub.submittedAt,
        votes: sub.votes || []
      }))
      setPendingSeries(mapped)

      // Fetch Users to filter Editors
      const usersQuery = `
        query GetUsers {
          users {
            id
            username
            email
            roles
          }
        }
      `
      const usersRes = await graphqlRequest<{ users: EditorUser[] }>(usersQuery, {}, true)
      if (usersRes.errors) {
        throw new Error(usersRes.errors[0].message)
      }
      
      const allUsers = usersRes.data?.users || []
      const filteredEditors = allUsers.filter(u => u.roles.includes('Tantou Editor'))
      setEditors(filteredEditors)

    } catch (err: any) {
      console.error(err)
      toast.error('Không thể tải dữ liệu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser))
        } catch (e) {
          console.error('Lỗi parse currentUser:', e)
        }
      }
    }
    fetchData()
  }, [])

  const hasUserVoted = (series: SeriesPending) => {
    if (!currentUser || !series.votes) return false
    return series.votes.some(v => v.boardMemberId === currentUser.id)
  }

  // 2. Open Approval Dialog
  const handleOpenApprove = (series: SeriesPending) => {
    setSelectedSeries(series)
    setSelectedEditorId('')
    setVoteDecision('APPROVE')
    setComment('')
    setApprovalDialogOpen(true)
  }

  // 3. Handle Submit Approval
  const handleSubmitApproval = async () => {
    if (!selectedSeries) return
    if (voteDecision === 'APPROVE' && !selectedEditorId) {
      toast.warning('Vui lòng chọn Tantou Editor phụ trách.')
      return
    }

    setSubmitting(true)
    try {
      const mutation = `
        mutation FinalizeBoardDecision($submissionId: UUID!, $decision: WorkflowStatus!, $comment: String!, $assignTantouId: UUID) {
          finalizeBoardDecision(submissionId: $submissionId, decision: $decision, comment: $comment, assignTantouId: $assignTantouId) {
            id
            status
          }
        }
      `
      const variables = {
        submissionId: selectedSeries.id,
        decision: voteDecision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        comment: comment || '',
        assignTantouId: voteDecision === 'APPROVE' ? (selectedEditorId || null) : null
      }

      const res = await graphqlRequest<any>(mutation, variables, true)
      
      if (res.errors) {
        throw new Error(res.errors[0].message)
      }

      const result = res.data?.finalizeBoardDecision
      if (result) {
        toast.success('Xét duyệt tác phẩm thành công.')
        setApprovalDialogOpen(false)
        setSelectedSeries(null)
        // Refresh list
        fetchData()
      } else {
        toast.error(result?.message || 'Có lỗi xảy ra khi xét duyệt.')
      }

    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi xét duyệt: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto p-1">
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
              Xét duyệt Series Mới
            </h1>
            <p className="text-muted-foreground mt-1">
              Phê duyệt các tác phẩm mới do Mangaka đăng ký và chỉ định Biên tập viên (Tantou Editor) phụ trách
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1 text-sm bg-background border-primary/20 text-primary font-medium">
            {pendingSeries.length} tác phẩm chờ duyệt
          </Badge>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground text-sm font-medium">Đang tải danh sách tác phẩm chờ duyệt...</p>
          </div>
        ) : pendingSeries.length === 0 ? (
          /* Empty State */
          <Card className="border-dashed bg-card/50 flex flex-col items-center justify-center p-12 text-center rounded-2xl min-h-[350px]">
            <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4 text-muted-foreground">
              <BookOpen className="h-8 w-8 opacity-75" />
            </div>
            <CardTitle className="text-xl font-bold mb-1">Không có tác phẩm nào chờ duyệt</CardTitle>
            <CardDescription className="max-w-md">
              Hiện tại tất cả đơn đăng ký bộ truyện mới đã được giải quyết hoặc chưa có Mangaka nào nộp bản thảo mới.
            </CardDescription>
          </Card>
        ) : (
          /* Grid list of Series */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingSeries.map((series) => (
              <Card key={series.id} className="bg-card border border-border/80 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col h-full overflow-hidden group">
                
                {/* Cover Image or Fallback */}
                <div className="relative aspect-[16/9] w-full bg-secondary overflow-hidden">
                  {series.coverImageUrl ? (
                    <img 
                      src={series.coverImageUrl} 
                      alt={series.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-secondary to-muted p-4">
                      <BookOpen className="h-12 w-12 opacity-30 mb-2" />
                      <span className="text-xs font-semibold">Chưa có ảnh bìa</span>
                    </div>
                  )}
                  
                  {hasUserVoted(series) && (
                    <Badge className="absolute top-3 left-3 bg-green-600/90 text-white font-medium">
                      Đã bỏ phiếu duyệt
                    </Badge>
                  )}

                  <Badge className="absolute top-3 right-3 bg-yellow-500/90 text-white font-medium">
                    {series.status}
                  </Badge>
                </div>

                <CardHeader className="pb-3 flex-none">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {series.title}
                    </CardTitle>
                    {series.alternativeTitle && (
                      <p className="text-xs text-muted-foreground italic line-clamp-1">
                        Tên khác: {series.alternativeTitle}
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 min-h-[60px]">
                    {series.description || 'Không có mô tả chi tiết cho tác phẩm này.'}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-primary/75" />
                      <span className="font-semibold text-foreground">{series.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary/75" />
                      <span>Đăng ký: {new Date(series.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Vote Count Summary */}
                  {series.votes && series.votes.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-border/80">
                      <p className="text-[11px] font-semibold text-muted-foreground">Phiếu bầu hiện tại:</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {series.votes.map((v, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className={`text-[10px] py-0 px-1.5 font-normal rounded-full ${
                              v.voteType === 'Approve' ? 'bg-green-500/10 text-green-600 border-green-500/15' : 
                              v.voteType === 'Reject' ? 'bg-red-500/10 text-red-600 border-red-500/15' : 
                              'bg-muted text-muted-foreground'
                            }`}
                          >
                            {v.boardMemberName}: {v.voteType === 'Approve' ? 'Đồng ý' : 'Từ chối'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-4 bg-secondary/10 border-t border-border/40 gap-2 flex-none flex-col sm:flex-row">
                  <Button 
                    variant="outline"
                    className="w-full sm:flex-1 rounded-xl border-border font-semibold text-foreground hover:bg-secondary/40 gap-2 text-xs"
                    onClick={() => {
                      setSelectedSeriesForChapters(series)
                      setChaptersDialogOpen(true)
                      fetchChapters(series.seriesId)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Xem bản thảo
                  </Button>

                  {hasUserVoted(series) ? (
                    <Button 
                      className="w-full sm:flex-1 rounded-xl bg-muted text-muted-foreground font-semibold cursor-not-allowed gap-2 text-xs"
                      disabled
                    >
                      <Check className="h-4 w-4" />
                      Đã bỏ phiếu
                    </Button>
                  ) : (
                    <Button 
                      className="w-full sm:flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm gap-2 text-xs"
                      onClick={() => handleOpenApprove(series)}
                    >
                      <FileCheck className="h-4 w-4" />
                      Xét duyệt
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Approval Modal */}
        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6">
            <DialogHeader className="pb-2 border-b border-border/60">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                Duyệt Đăng Ký Series Mới
              </DialogTitle>
              <DialogDescription>
                Phê duyệt tác phẩm đi vào hoạt động và bàn giao cho Biên tập viên phụ trách.
              </DialogDescription>
            </DialogHeader>

            {selectedSeries && (
              <div className="space-y-4 my-4">
                {/* Series Short Summary */}
                <div className="flex gap-4 p-3 bg-secondary/20 rounded-xl border border-border/50">
                  {selectedSeries.coverImageUrl ? (
                    <img 
                      src={selectedSeries.coverImageUrl} 
                      alt={selectedSeries.title}
                      className="w-16 h-20 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-secondary flex items-center justify-center rounded-lg text-muted-foreground">
                      <BookOpen className="h-6 w-6 opacity-30" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground line-clamp-1">{selectedSeries.title}</h4>
                    <p className="text-xs text-muted-foreground">Tác giả: <span className="font-semibold text-foreground">{selectedSeries.authorName}</span></p>
                    <Badge variant="outline" className="text-[10px] py-0.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Chờ Hội Đồng Duyệt
                    </Badge>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Select Vote Decision */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">
                      Quyết định của bạn <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={voteDecision === 'APPROVE' ? 'default' : 'outline'}
                        className={`flex-1 rounded-xl font-semibold gap-2 border-border ${
                          voteDecision === 'APPROVE' ? 'bg-green-600 hover:bg-green-600/90 text-white' : ''
                        }`}
                        onClick={() => setVoteDecision('APPROVE')}
                      >
                        <Check className="h-4 w-4" />
                        Đồng ý phê duyệt
                      </Button>
                      <Button
                        type="button"
                        variant={voteDecision === 'REJECT' ? 'default' : 'outline'}
                        className={`flex-1 rounded-xl font-semibold gap-2 border-border ${
                          voteDecision === 'REJECT' ? 'bg-red-600 hover:bg-red-600/90 text-white' : ''
                        }`}
                        onClick={() => setVoteDecision('REJECT')}
                      >
                        <AlertCircle className="h-4 w-4" />
                        Từ chối đăng ký
                      </Button>
                    </div>
                  </div>

                  {/* Select Tantou Editor (Only show if APPROVE) */}
                  {voteDecision === 'APPROVE' && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Chỉ định Tantou Editor phụ trách <span className="text-destructive">*</span>
                      </Label>
                      <Select value={selectedEditorId} onValueChange={setSelectedEditorId}>
                        <SelectTrigger className="w-full rounded-xl border-border bg-background focus:ring-primary">
                          <SelectValue placeholder="Chọn một Biên tập viên" />
                        </SelectTrigger>
                        <SelectContent>
                          {editors.length === 0 ? (
                            <SelectItem value="none" disabled>Không tìm thấy Tantou Editor nào</SelectItem>
                          ) : (
                            editors.map((editor) => (
                              <SelectItem key={editor.id} value={editor.id}>
                                {editor.username} ({editor.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground italic">
                        Biên tập viên được chỉ định sẽ đồng hành cùng tác giả và theo dõi toàn bộ quy trình gửi bản thảo.
                      </p>
                    </div>
                  )}

                  {/* Comment Area */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-foreground">
                      Góp ý / Nhận xét (Tùy chọn)
                    </Label>
                    <Textarea 
                      placeholder="Nhập nội dung nhận xét hoặc lời nhắn gửi đến tác giả và biên tập viên..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px] rounded-xl border-border bg-background resize-none focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-border/60 flex gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                className="rounded-xl border-border font-semibold text-muted-foreground hover:bg-secondary/40"
                onClick={() => setApprovalDialogOpen(false)}
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
              <Button 
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm gap-2"
                onClick={handleSubmitApproval}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    Đang duyệt...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Xác nhận duyệt
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Chapters & Manuscript Pages Modal */}
        <Dialog open={chaptersDialogOpen} onOpenChange={setChaptersDialogOpen}>
          <DialogContent className="max-w-[95vw] lg:max-w-7xl w-full rounded-2xl border-border bg-card p-0 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-secondary/10">
              <DialogTitle className="text-2xl font-black flex items-center gap-3 text-foreground tracking-tight">
                <BookOpen className="h-6 w-6 text-primary" />
                Bản Thảo Chương Truyện: <span className="text-primary/90">{selectedSeriesForChapters?.title}</span>
              </DialogTitle>
              <DialogDescription className="text-sm mt-1 text-muted-foreground/80">
                Xem chi tiết các chương và trang vẽ phác thảo của tác phẩm để đánh giá chất lượng toàn diện.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-0 overflow-hidden flex-1 min-h-0 bg-background">
              {/* Left Column: Chapters list */}
              <div className="md:col-span-1 lg:col-span-1 border-r border-border/60 p-4 bg-secondary/5 overflow-y-auto space-y-3 max-h-[40vh] md:max-h-none">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Danh sách chương
                  </h4>
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{chapters.length}</Badge>
                </div>
                
                {chaptersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary"></div>
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="flex flex-col items-center text-center p-4 bg-background rounded-xl border border-dashed border-border">
                    <BookOpen className="h-6 w-6 text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground italic">Bộ truyện này chưa được tạo chương nào.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chapters.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => {
                          setSelectedChapterForPages(ch)
                          fetchPages(ch.id)
                        }}
                        className={`w-full flex flex-col text-left p-3.5 rounded-xl border-2 transition-all duration-200 ${
                          selectedChapterForPages?.id === ch.id
                            ? 'bg-primary/5 border-primary text-primary shadow-sm scale-[1.02]'
                            : 'bg-card hover:bg-secondary/40 border-transparent hover:border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="font-bold text-sm">Chương {ch.chapterNumber}</span>
                        <span className="text-xs mt-1 line-clamp-2 opacity-90 leading-relaxed">{ch.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Page Gallery */}
              <div className="md:col-span-3 lg:col-span-4 overflow-y-auto flex flex-col max-h-[60vh] md:max-h-none min-h-0 flex-1 bg-secondary/5 p-6">
                {selectedChapterForPages ? (
                  <div className="space-y-6 flex flex-col flex-1 min-h-0">
                    <div className="flex justify-between items-center pb-3 border-b border-border/40">
                      <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                        Bản vẽ: Chương {selectedChapterForPages.chapterNumber} <span className="text-muted-foreground font-normal">- {selectedChapterForPages.title}</span>
                      </h4>
                      <Badge className="rounded-full px-4 py-1 text-sm bg-primary text-primary-foreground">{pages.length} trang</Badge>
                    </div>

                    {pagesLoading ? (
                      <div className="flex justify-center items-center py-20 flex-1">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary"></div>
                          <span className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải bản thảo...</span>
                        </div>
                      </div>
                    ) : pages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border-2 border-dashed border-border/80 flex-1 shadow-sm">
                        <div className="bg-secondary/50 p-4 rounded-full mb-4">
                          <AlertCircle className="h-10 w-10 text-muted-foreground opacity-60" />
                        </div>
                        <p className="text-sm text-foreground font-semibold mb-1">Chương này trống</p>
                        <p className="text-xs text-muted-foreground">Chưa có trang bản vẽ nào được tải lên cho chương này.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-4 flex-1">
                        {pages.map((p) => (
                          <div key={p.id} className="relative rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col aspect-[3/4.5]">
                            <div className="flex-1 overflow-hidden bg-slate-900/5 flex items-center justify-center relative p-1">
                              <img 
                                src={p.imageUrl} 
                                alt={`Trang ${p.pageNumber}`} 
                                className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500 rounded-lg"
                              />
                              {/* Overlay for view action */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                                <Button variant="secondary" size="sm" className="rounded-full shadow-lg gap-2 font-bold" onClick={() => window.open(p.imageUrl, '_blank')}>
                                  <Eye className="h-4 w-4" /> Xem ảnh lớn
                                </Button>
                              </div>
                            </div>
                            <div className="p-3 text-center bg-card border-t border-border/50">
                              <span className="text-xs font-bold text-foreground">Trang {p.pageNumber}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-2xl border border-border shadow-sm flex-1">
                    <div className="bg-primary/5 p-6 rounded-full mb-6">
                      <BookOpen className="h-12 w-12 text-primary/40 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Chưa chọn chương</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Vui lòng chọn một chương ở menu bên trái để xem trước chi tiết các trang bản thảo bên trong.</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 bg-secondary/10 p-4 px-6 flex justify-end">
              <Button 
                variant="outline"
                className="rounded-xl px-8 font-bold border-border/80 hover:bg-secondary/60 transition-colors" 
                onClick={() => setChaptersDialogOpen(false)}
              >
                Đóng cửa sổ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
