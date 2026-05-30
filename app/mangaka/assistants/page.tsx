'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/app-shell'
import { graphqlRequest } from '@/lib/api'
import { toast } from 'sonner'
import {
  UserPlus,
  Mail,
  User,
  Copy,
  CheckCircle,
  ExternalLink,
  Users,
  Shield,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface AssistantDto {
  id: string
  username: string
  email: string
  baseSalary?: number
}

interface InviteResultDto {
  email: string
  token: string
  roleName: string
  expiryDate: string
}

export default function MangakaAssistantsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [assistants, setAssistants] = useState<AssistantDto[]>([])
  const [loading, setLoading] = useState(true)

  // Invite states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<InviteResultDto | null>(null)



  // Load User
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser')
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored))
        } catch {}
      }
    }
  }, [])

  // Fetch assistants
  const fetchAssistants = async () => {
    setLoading(true)
    try {
      const query = `
        query GetMyAssistants {
          myAssistants {
            id
            username
            email
          }
        }
      `
      const res = await graphqlRequest<{ myAssistants: AssistantDto[] }>(query, {}, true)
      if (res.errors) throw new Error(res.errors[0].message)
      setAssistants(res.data?.myAssistants || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi tải danh sách trợ lý: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchAssistants()
    }
  }, [currentUser])

  // Handle send invite
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.warning('Vui lòng nhập địa chỉ Email.')
      return
    }
    setInviting(true)
    try {
      const mutation = `
        mutation InviteUser($request: InviteRequestInput!) {
          inviteUser(request: $request) {
            succeeded
            message
            data {
              email
              token
              roleName
              expiryDate
            }
          }
        }
      `
      const res = await graphqlRequest<any>(
        mutation,
        {
          request: {
            email: inviteEmail.trim(),
            roleName: 'Assistant',
          },
        },
        true
      )

      if (res.errors && res.errors.length > 0) {
        throw new Error(res.errors[0].message)
      }

      const result = res.data?.inviteUser
      if (!result?.succeeded) {
        throw new Error(result?.message || 'Không thể tạo lời mời.')
      }

      toast.success('Gửi lời mời trợ lý thành công!')
      setInviteResult(result.data)
      setInviteEmail('')
      // Refresh assistant list in case they are already registered (though normally they need to sign up first)
      fetchAssistants()
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi gửi lời mời: ' + err.message)
    } finally {
      setInviting(false)
    }
  }



  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 p-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Quản lý Trợ lý
            </h1>
            <p className="text-muted-foreground text-sm">
              Xem danh sách trợ lý hiện có hoặc gửi lời mời đăng ký tài khoản trợ lý để làm việc cùng bạn.
            </p>
          </div>
          <Button
            onClick={() => {
              setInviteResult(null)
              setInviteDialogOpen(true)
            }}
            className="rounded-xl font-bold gap-2 bg-primary text-primary-foreground shadow-sm"
          >
            <UserPlus className="h-5 w-5" />
            Mời Trợ lý Mới
          </Button>
        </div>

        {/* Assistants List */}
        <Card className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/60 py-4 bg-muted/20">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Trợ lý đang cộng tác ({assistants.length})
            </CardTitle>
            <CardDescription>
              Các trợ lý đã chấp nhận lời mời và được liên kết trực tiếp với tài khoản của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground font-medium">Đang tải danh sách trợ lý...</span>
              </div>
            ) : assistants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl text-center bg-card">
                <User className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <CardTitle className="text-xl font-bold text-foreground">Chưa có trợ lý nào</CardTitle>
                <CardDescription className="max-w-md mt-1">
                  Bạn chưa có trợ lý nào liên kết. Hãy mời các trợ lý tham gia vào dự án của bạn để bắt đầu phân công công việc.
                </CardDescription>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assistants.map((assistant) => (
                  <Card
                    key={assistant.id}
                    className="bg-secondary/20 hover:bg-secondary/40 border border-border/60 rounded-xl overflow-hidden transition-all duration-300"
                  >
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0 border border-primary/20">
                        {assistant.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="font-bold text-foreground truncate">
                          {assistant.username}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5" />
                          {assistant.email}
                        </p>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary rounded-full mt-2">
                          Assistant
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Invite Dialog ─── */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Mời Trợ lý
            </DialogTitle>
            <DialogDescription>
              Nhập địa chỉ email trợ lý để gửi lời mời liên kết.
            </DialogDescription>
          </DialogHeader>

          {!inviteResult ? (
            <div className="space-y-4 my-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Email trợ lý <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  placeholder="assistant@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="rounded-xl border-border bg-background"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setInviteDialogOpen(false)}
                  disabled={inviting}
                >
                  Hủy bỏ
                </Button>
                <Button
                  className="rounded-xl bg-primary text-primary-foreground font-bold gap-2"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Gửi lời mời
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 my-2">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl space-y-1 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Gửi lời mời thành công!</h4>
                  <p className="text-xs opacity-90">Hệ thống đã gửi email hướng dẫn đăng ký đến trợ lý.</p>
                </div>
              </div>

              <div className="p-4 bg-secondary/30 rounded-xl space-y-2 text-sm text-muted-foreground">
                <p>
                  📧 Thư mời đã được gửi tới địa chỉ: <strong className="text-foreground">{inviteResult.email}</strong>
                </p>
                <p>
                  Trợ lý có thể nhấp vào liên kết trong email để hoàn tất đăng ký tài khoản và tự động liên kết với bạn.
                </p>
              </div>

              <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/15 text-yellow-600 rounded-xl text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Thời hạn liên kết
                </p>
                <p className="opacity-90">
                  Lời mời này sẽ có hiệu lực đến hết ngày {new Date(inviteResult.expiryDate).toLocaleString('vi-VN')}.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  className="rounded-xl w-full font-bold gap-2"
                  onClick={() => setInviteDialogOpen(false)}
                >
                  Hoàn tất
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
