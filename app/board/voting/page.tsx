"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Sparkles,
  Loader2,
  Mail,
  Layers,
  MessageSquare
} from "lucide-react"
import { graphqlRequest } from "@/lib/api"
import { toast } from "sonner"
import { mockSeriesForDecision } from "@/lib/mock-data"

type VoteStatus = "pending" | "approved" | "rejected"

interface ApplicationAsset {
  id: string
  name: string
  type: string
  fileUrl: string
}

interface ApplicationVote {
  id: string
  boardMemberId: string
  boardMemberName: string
  voteType: string
  proposedTantouId: string | null
  comment: string | null
  createdAt: string
}

interface CandidateApplication {
  id: string
  fullName: string
  email: string
  seriesTitle: string
  status: string
  createdAt: string
  reviewedAt?: string
  assets: ApplicationAsset[]
  votes: ApplicationVote[]
}

export interface SeriesDecision {
  id: string
  title: string
  author: string
  rank: number
  currentSchedule: string
  consecutiveBottom: number
  decision: string | null
  schedule: string | null
}

export default function BoardVotingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [applications, setApplications] = useState<CandidateApplication[]>([])
  const [editors, setEditors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Decisions list (Mock data)
  const [seriesDecisions, setSeriesDecisions] = useState<SeriesDecision[]>(mockSeriesForDecision as SeriesDecision[])

  // Dialog & Form states for candidate application voting
  const [selectedApp, setSelectedApp] = useState<CandidateApplication | null>(null)
  const [appDetailsOpen, setAppDetailsOpen] = useState(false)
  const [voteDialogOpen, setVoteDialogOpen] = useState(false)
  const [voteType, setVoteType] = useState<"APPROVE" | "REJECT">("APPROVE")
  const [selectedTantouId, setSelectedTantouId] = useState<string>("")
  const [voteComment, setVoteComment] = useState<string>("")
  const [voting, setVoting] = useState(false)

  // Dialog & Form states for publication decisions
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<SeriesDecision | null>(null)
  const [decision, setDecision] = useState<string>("")
  const [schedule, setSchedule] = useState<string>("")

  // Load User
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser')
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored))
        } catch { }
      }
    }
  }, [])

  // Fetch real candidate applications & editors
  const fetchAllData = async () => {
    setLoading(true)
    try {
      // 1. Fetch pending candidate applications
      const appQuery = `
        query GetPendingApplications {
          pendingApplications {
            succeeded
            message
            data {
              id
              fullName
              email
              seriesTitle
              status
              createdAt
              assets {
                id
                name
                type
                fileUrl
              }
              votes {
                id
                boardMemberId
                boardMemberName
                voteType
                proposedTantouId
                comment
                createdAt
              }
            }
          }
        }
      `
      const appRes = await graphqlRequest<any>(appQuery, {}, true)
      if (appRes.errors && appRes.errors.length > 0) {
        throw new Error(appRes.errors[0].message)
      }
      setApplications(appRes.data?.pendingApplications?.data || [])

      // 2. Fetch users to filter Editors
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
      const usersRes = await graphqlRequest<any>(usersQuery, {}, true)
      if (usersRes.errors && usersRes.errors.length > 0) {
        throw new Error(usersRes.errors[0].message)
      }
      const allUsers = usersRes.data?.users || []
      const filteredEditors = allUsers.filter((u: any) => u.roles?.includes('Tantou Editor'))
      setEditors(filteredEditors)
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tải dữ liệu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchAllData()
    }
  }, [currentUser])

  // Handle voting on candidate application
  const handleVoteSubmit = async () => {
    if (!selectedApp) return

    if (voteType === 'APPROVE' && !selectedTantouId) {
      toast.warning('Vui lòng đề xuất Biên tập viên (Tantou Editor) phụ trách.')
      return
    }

    setVoting(true)
    try {
      const mutation = `
        mutation VoteApplication($applicationId: UUID!, $vote: VoteType!, $proposedTantouId: UUID, $comment: String) {
          voteApplication(applicationId: $applicationId, vote: $vote, proposedTantouId: $proposedTantouId, comment: $comment) {
            succeeded
            message
          }
        }
      `

      // Backend VoteType is a HotChocolate enum: APPROVE / REJECT / NEUTRAL (SCREAMING_CASE)
      const res = await graphqlRequest<any>(mutation, {
        applicationId: selectedApp.id,
        vote: voteType,
        proposedTantouId: voteType === 'APPROVE' ? selectedTantouId : null,
        comment: voteComment.trim() || null
      }, true)

      if (res.errors && res.errors.length > 0) {
        throw new Error(res.errors[0].message)
      }

      const result = res.data?.voteApplication
      if (!result?.succeeded) {
        throw new Error(result?.message || 'Không thể ghi nhận phiếu bầu.')
      }

      toast.success(result.message || 'Bỏ phiếu thành công!')
      setVoteDialogOpen(false)
      setAppDetailsOpen(false)
      setVoteComment("")
      setSelectedTantouId("")
      fetchAllData() // Refresh candidates list
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi bỏ phiếu: ' + err.message)
    } finally {
      setVoting(false)
    }
  }

  // Handle decisions on publication schedules (Mock flow)
  const handleDecision = () => {
    if (selectedSeries && decision) {
      setSeriesDecisions(seriesDecisions.map(s => {
        if (s.id === selectedSeries.id) {
          return { ...s, decision, schedule }
        }
        return s
      }))
      setDecisionDialogOpen(false)
      setSelectedSeries(null)
      setDecision("")
      setSchedule("")
      toast.success("Ghi nhận quyết định thành công!")
    }
  }

  // Check if current user already voted on an application
  const getMyVote = (app: CandidateApplication) => {
    if (!currentUser || !app.votes) return null
    return app.votes.find(v => v.boardMemberId === currentUser.id)
  }

  // Counts
  const pendingApplications = applications.filter(a => a.status.toUpperCase() === "PENDING")
  const resolvedApplications = applications.filter(a => a.status.toUpperCase() !== "PENDING")

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              Bỏ phiếu & Quyết định
            </h1>
            <p className="text-muted-foreground text-sm">
              Đánh giá tác phẩm đầu tay ứng tuyển Mangaka hoặc đưa ra quyết định xuất bản cho các Series hiện tại.
            </p>
          </div>
        </div>

        <Tabs defaultValue="new-series" className="space-y-6">
          <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-xl">
            <TabsTrigger value="new-series" className="gap-2 rounded-lg font-semibold px-4">
              <Sparkles className="h-4 w-4" />
              Xét duyệt Tác giả Mới ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2 rounded-lg font-semibold px-4">
              <BookOpen className="h-4 w-4" />
              Quyết định Xuất bản ({seriesDecisions.filter(s => !s.decision).length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 rounded-lg font-semibold px-4">
              <Clock className="h-4 w-4" />
              Lịch sử duyệt ứng tuyển
            </TabsTrigger>
          </TabsList>

          {/* ===== 1. NEW CANDIDATE APPLICATIONS TAB ===== */}
          <TabsContent value="new-series" className="space-y-4 outline-none">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Đang tải danh sách đơn ứng tuyển...</span>
              </div>
            ) : pendingApplications.length === 0 ? (
              <Card className="border-dashed border-2 border-border/80 rounded-2xl bg-card">
                <CardContent className="py-16 text-center space-y-2">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground/35 mb-2" />
                  <CardTitle className="text-xl font-bold">Không có hồ sơ chờ duyệt</CardTitle>
                  <CardDescription className="max-w-md mx-auto">
                    Hiện tại chưa có tác phẩm đầu tay nào được gửi lên chờ duyệt. Tất cả các hồ sơ ứng tuyển đã được xử lý xong.
                  </CardDescription>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingApplications.map((app) => {
                  const myVote = getMyVote(app)
                  const approveCount = app.votes?.filter(v => v.voteType.toUpperCase() === "APPROVE").length || 0
                  const rejectCount = app.votes?.filter(v => v.voteType.toUpperCase() === "REJECT").length || 0

                  return (
                    <Card key={app.id} className="border border-border/80 bg-card rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
                      <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                {app.fullName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <CardTitle className="text-base font-bold truncate text-foreground">{app.fullName}</CardTitle>
                              <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                <Mail className="h-3.5 w-3.5" />
                                {app.email}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-primary/30 text-primary text-xs font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap bg-primary/5">
                            New Author
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-5 flex-1 space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tác phẩm đầu tay đề xuất</p>
                          <h4 className="font-bold text-foreground text-lg mt-0.5">{app.seriesTitle}</h4>
                        </div>

                        <div className="flex items-center gap-6 py-2 px-3 bg-secondary/15 rounded-xl border border-border/40 text-xs">
                          <div className="flex items-center gap-1 text-emerald-400 font-bold">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{approveCount} Duyệt</span>
                          </div>
                          <div className="flex items-center gap-1 text-destructive font-bold">
                            <ThumbsDown className="h-4 w-4" />
                            <span>{rejectCount} Từ chối</span>
                          </div>
                          <span className="text-muted-foreground/70 ml-auto">
                            Đã có {app.votes?.length || 0} thành viên bỏ phiếu
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2">
                          <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <Calendar className="h-4 w-4" />
                            Nộp ngày: {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                          </div>

                          <div className="flex items-center gap-2">
                            {myVote && (
                              <Badge variant="outline" className={`rounded-full px-2.5 ${myVote.voteType.toUpperCase() === "APPROVE"
                                  ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                                  : "border-red-500/30 text-red-500 bg-red-500/5"
                                }`}>
                                {myVote.voteType.toUpperCase() === "APPROVE" ? "Bạn: Duyệt" : "Bạn: Từ chối"}
                              </Badge>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedApp(app)
                                setAppDetailsOpen(true)
                              }}
                              className="rounded-xl font-bold"
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              Chi tiết & Bỏ phiếu
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== 2. PUBLICATION DECISIONS TAB ===== */}
          <TabsContent value="decisions" className="space-y-4 outline-none">
            <Card className="border border-border/80 bg-card rounded-2xl shadow-sm">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-lg font-bold">Series cần hội đồng ra quyết định</CardTitle>
                <CardDescription>Các tác phẩm thuộc top dưới nhiều tuần liên tục cần xem xét điều chỉnh lịch hoặc dừng xuất bản.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {seriesDecisions.map((series) => (
                    <div
                      key={series.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-muted/40 border border-border/40 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{series.title}</h4>
                          <p className="text-xs text-muted-foreground">Tác giả: {series.author}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant={series.rank <= 5 ? "default" : series.rank <= 10 ? "secondary" : "destructive"}
                              className={series.rank <= 5 ? "bg-success text-success-foreground" : ""}
                            >
                              Hạng #{series.rank}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              Lịch hiện tại: {series.currentSchedule}
                            </span>
                            {series.consecutiveBottom > 0 && (
                              <span className="text-[11px] text-destructive font-semibold">
                                ({series.consecutiveBottom} tuần bét bảng)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        {series.decision ? (
                          <Badge variant="outline" className="gap-1 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 rounded-full px-2.5 py-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã quyết định: {series.decision.toUpperCase()}
                          </Badge>
                        ) : (
                          <Dialog open={decisionDialogOpen && selectedSeries?.id === series.id} onOpenChange={(open) => {
                            setDecisionDialogOpen(open)
                            if (open) setSelectedSeries(series)
                          }}>
                            <DialogTrigger asChild>
                              <Button className="rounded-xl font-bold" size="sm">Đưa ra Quyết định</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-2xl bg-card border-border p-6">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Quyết định cho {series.title}</DialogTitle>
                                <DialogDescription>
                                  Hạng hiện tại: #{series.rank} | Lịch phát hành: {series.currentSchedule}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 my-2">
                                <div className="space-y-2.5">
                                  <Label className="font-semibold text-sm">Hành động quyết định</Label>
                                  <RadioGroup value={decision} onValueChange={setDecision} className="space-y-2">
                                    <div className="flex items-center space-x-2.5 p-2 bg-secondary/15 rounded-lg border border-border/40 hover:bg-secondary/30 cursor-pointer">
                                      <RadioGroupItem value="continue" id="continue" />
                                      <Label htmlFor="continue" className="font-normal cursor-pointer flex-1 text-sm text-foreground">Tiếp tục phát hành bình thường</Label>
                                    </div>
                                    <div className="flex items-center space-x-2.5 p-2 bg-secondary/15 rounded-lg border border-border/40 hover:bg-secondary/30 cursor-pointer">
                                      <RadioGroupItem value="change-schedule" id="change-schedule" />
                                      <Label htmlFor="change-schedule" className="font-normal cursor-pointer flex-1 text-sm text-foreground">Thay đổi tần suất phát hành</Label>
                                    </div>
                                    <div className="flex items-center space-x-2.5 p-2 bg-secondary/15 rounded-lg border border-border/40 hover:bg-secondary/30 cursor-pointer">
                                      <RadioGroupItem value="hiatus" id="hiatus" />
                                      <Label htmlFor="hiatus" className="font-normal cursor-pointer flex-1 text-sm text-foreground">Tạm dừng phát hành (Hiatus)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2.5 p-2 bg-destructive/5 rounded-lg border border-destructive/15 hover:bg-destructive/10 cursor-pointer">
                                      <RadioGroupItem value="cancel" id="cancel" />
                                      <Label htmlFor="cancel" className="font-normal cursor-pointer flex-1 text-sm text-destructive">Kết thúc/Huỷ bỏ bộ truyện này</Label>
                                    </div>
                                  </RadioGroup>
                                </div>

                                {decision === "change-schedule" && (
                                  <div className="space-y-2">
                                    <Label className="font-semibold text-sm">Lịch phát hành mới</Label>
                                    <Select value={schedule} onValueChange={setSchedule}>
                                      <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Chọn lịch mới..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="weekly">Hàng tuần (Weekly)</SelectItem>
                                        <SelectItem value="biweekly">2 tuần/tập (Bi-weekly)</SelectItem>
                                        <SelectItem value="monthly">Hàng tháng (Monthly)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label className="font-semibold text-sm">Lý do đưa ra quyết định (Không bắt buộc)</Label>
                                  <Textarea placeholder="Ghi nhận phản hồi hoặc lý do cụ thể..." className="rounded-xl min-h-20" />
                                </div>
                              </div>

                              <DialogFooter className="gap-2">
                                <Button variant="outline" className="rounded-xl" onClick={() => setDecisionDialogOpen(false)}>
                                  Hủy bỏ
                                </Button>
                                <Button className="rounded-xl font-bold bg-primary text-primary-foreground" onClick={handleDecision} disabled={!decision}>
                                  Xác nhận Quyết định
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== 3. RESOLVED CANDIDATE APPLICATIONS TAB (VOTE HISTORY) ===== */}
          <TabsContent value="history" className="space-y-4 outline-none">
            <Card className="border border-border/80 bg-card rounded-2xl shadow-sm">
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-lg font-bold">Lịch sử đánh giá đơn ứng tuyển</CardTitle>
                <CardDescription>Các đơn đăng ký của ứng viên Tác giả đã hoàn thành biểu quyết duyệt hoặc từ chối.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {resolvedApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Clock className="h-10 w-10 text-muted-foreground/35 mb-2" />
                    <p className="text-muted-foreground text-sm">Chưa có đơn ứng tuyển nào được giải quyết gần đây.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resolvedApplications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {app.status.toUpperCase() === "APPROVED" ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <div>
                            <p className="font-bold text-foreground">{app.fullName} - {app.seriesTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              Email: {app.email} • Cập nhật: {app.reviewedAt ? new Date(app.reviewedAt).toLocaleString('vi-VN') : new Date(app.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={app.status.toUpperCase() === "APPROVED" ? "default" : "destructive"} className={app.status.toUpperCase() === "APPROVED" ? "bg-success text-success-foreground rounded-full" : "rounded-full"}>
                          {app.status.toUpperCase() === "APPROVED" ? "Đã Duyệt (Active)" : "Đã Từ Chối"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Candidate Application Details Dialog ─── */}
      <Dialog open={appDetailsOpen} onOpenChange={setAppDetailsOpen}>
        <DialogContent className="max-w-4xl rounded-2xl bg-card border-border p-6 shadow-lg overflow-y-auto max-h-[90vh]">
          {selectedApp && (
            <>
              <DialogHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                      {selectedApp.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl font-bold text-foreground">Hồ sơ ứng tuyển: {selectedApp.fullName}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedApp.email}
                      <span className="text-muted-foreground/50">|</span>
                      <Calendar className="h-3.5 w-3.5" />
                      Nộp ngày: {new Date(selectedApp.createdAt).toLocaleString('vi-VN')}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 my-4">
                {/* Proposed Work Details */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tên tác phẩm đầu tay ứng tuyển</span>
                  <h4 className="text-lg font-bold text-foreground">{selectedApp.seriesTitle}</h4>
                </div>

                {/* Submitted Pages Gallery */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" />
                    Trang bản thảo đầu tay ({selectedApp.assets?.length || 0} trang)
                  </span>
                  {selectedApp.assets?.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground text-sm bg-muted/10">
                      Không có tệp hình ảnh đính kèm.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1.5 bg-secondary/15 rounded-xl border border-border/40">
                      {selectedApp.assets.map((asset, i) => (
                        <a
                          key={asset.id}
                          href={asset.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border/60 hover:border-primary/50 bg-muted/40 transition-all group flex flex-col justify-end"
                        >
                          <img
                            src={asset.fileUrl}
                            alt={asset.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] text-white truncate font-medium w-full">Trang {i + 1}: {asset.name}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other votes list */}
                <div className="space-y-2.5 border-t border-border/40 pt-4">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Ý kiến phản hồi từ Hội đồng ({selectedApp.votes?.length || 0})
                  </span>
                  {selectedApp.votes?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic bg-muted/5 p-3 rounded-lg border border-border/30">Chưa có thành viên nào của Hội đồng bỏ phiếu cho hồ sơ này.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedApp.votes.map((v) => (
                        <div key={v.id} className="text-xs p-3 bg-secondary/20 rounded-xl border border-border/40 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground">{v.boardMemberName}</span>
                            <Badge variant={v.voteType.toUpperCase() === 'APPROVE' ? 'default' : 'destructive'} className={v.voteType.toUpperCase() === 'APPROVE' ? 'bg-success text-success-foreground rounded-full px-2' : 'rounded-full px-2'}>
                              {v.voteType.toUpperCase() === 'APPROVE' ? 'Duyệt' : 'Từ chối'}
                            </Badge>
                          </div>
                          {v.proposedTantouId && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Đề xuất Tantou: <span className="text-primary font-semibold">{editors.find(e => e.id === v.proposedTantouId)?.username || 'Biên tập viên'}</span>
                            </p>
                          )}
                          {v.comment && <p className="italic text-foreground/80 mt-1 text-[11.5px] border-l-2 border-border/80 pl-2">"{v.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vote Action Area */}
                <div className="border-t border-border/40 pt-4 space-y-3">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Lượt bỏ phiếu của bạn</span>

                  {getMyVote(selectedApp) ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">Bạn đã bỏ phiếu cho hồ sơ này</h4>
                        <p className="text-xs opacity-90 mt-0.5">
                          Ý kiến: <strong className="uppercase">{getMyVote(selectedApp)?.voteType?.toUpperCase() === "APPROVE" ? "Duyệt" : "Từ chối"}</strong>.
                          {getMyVote(selectedApp)?.proposedTantouId && (
                            <span> Đề xuất Tantou: <strong>{editors.find(e => e.id === getMyVote(selectedApp)?.proposedTantouId)?.username}</strong>.</span>
                          )}
                          {getMyVote(selectedApp)?.comment && <span> Nhận xét: <em>"{getMyVote(selectedApp)?.comment}"</em>.</span>}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        {/* Vote Type selection */}
                        <div className="space-y-2">
                          <Label className="font-semibold text-xs text-muted-foreground uppercase">Hành động</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={voteType === "APPROVE" ? "default" : "outline"}
                              onClick={() => setVoteType("APPROVE")}
                              className={`rounded-xl font-bold px-4 gap-1.5 ${voteType === "APPROVE" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}`}
                              size="sm"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Phê duyệt (Approve)
                            </Button>
                            <Button
                              type="button"
                              variant={voteType === "REJECT" ? "default" : "outline"}
                              onClick={() => setVoteType("REJECT")}
                              className={`rounded-xl font-bold px-4 gap-1.5 ${voteType === "REJECT" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                              size="sm"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              Từ chối (Reject)
                            </Button>
                          </div>
                        </div>

                        {/* Proposed Tantou Editor dropdown */}
                        {voteType === "APPROVE" && (
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="proposed-tantou" className="font-semibold text-xs text-muted-foreground uppercase">Đề xuất Tantou Editor <span className="text-red-500">*</span></Label>
                            <Select value={selectedTantouId} onValueChange={setSelectedTantouId}>
                              <SelectTrigger id="proposed-tantou" className="rounded-xl h-9 bg-background">
                                <SelectValue placeholder="Chọn Biên tập viên..." />
                              </SelectTrigger>
                              <SelectContent>
                                {editors.map((editor) => (
                                  <SelectItem key={editor.id} value={editor.id}>
                                    {editor.username} ({editor.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Comment text area */}
                      <div className="space-y-2">
                        <Label htmlFor="vote-comment" className="font-semibold text-xs text-muted-foreground uppercase">Ý kiến nhận xét (Không bắt buộc)</Label>
                        <Textarea
                          id="vote-comment"
                          value={voteComment}
                          onChange={(e) => setVoteComment(e.target.value)}
                          placeholder={voteType === "APPROVE" ? "Nhập nhận xét (ví dụ: Bản vẽ tốt, cốt truyện tiềm năng...)" : "Vui lòng nhập lý do từ chối cụ thể..."}
                          className="rounded-xl min-h-16 bg-background"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={handleVoteSubmit}
                          disabled={voting || (voteType === "APPROVE" && !selectedTantouId)}
                          className="rounded-xl font-bold"
                          size="sm"
                        >
                          {voting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                              Đang ghi nhận...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Xác nhận gửi phiếu bầu
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-border/40 pt-4">
                <Button variant="outline" className="rounded-xl" onClick={() => setAppDetailsOpen(false)}>
                  Đóng
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
