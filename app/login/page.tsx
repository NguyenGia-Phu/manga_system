'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, setAccessToken, setRefreshToken, setUserRoles, isAuthenticated, graphqlRequest } from '@/lib/api'
import { BookOpen, Eye, EyeOff, Loader2, AlertCircle, Sparkles, UserPlus, LogIn, CheckCircle2, KeyRound } from 'lucide-react'

type TabMode = 'login' | 'register'

interface RegisterResponse {
  succeeded: boolean
  message: string
  errors: Array<{ key: string; value: string }> | null
  data: {
    id: string
    username: string
    email: string
    accessToken: string
    refreshToken: string
    roles: string[]
  } | null
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<TabMode>('login')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register state
  const [regToken, setRegToken] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Test invite state
  const [testEmail, setTestEmail] = useState('')
  const [isSendingTestInvite, setIsSendingTestInvite] = useState(false)
  const [testInviteSuccess, setTestInviteSuccess] = useState<string | null>(null)
  const [testInviteError, setTestInviteError] = useState<string | null>(null)

  // Shared state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated()) {
      router.push('/')
    }

    // Check URL for invite token (e.g. /login?token=xxx)
    const params = new URLSearchParams(window.location.search)
    const tokenFromUrl = params.get('token')
    if (tokenFromUrl) {
      setRegToken(tokenFromUrl)
      setMode('register')
    }
  }, [router])

  const switchMode = (newMode: TabMode) => {
    setMode(newMode)
    setError(null)
    setSuccessMsg(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await loginUser(email, password)

      if (result.succeeded && result.data) {
        setAccessToken(result.data.accessToken)
        setRefreshToken(result.data.refreshToken)
        setUserRoles(result.data.roles)

        localStorage.setItem('currentUser', JSON.stringify({
          id: result.data.id,
          username: result.data.username,
          email: result.data.email,
          roles: result.data.roles,
        }))

        router.push('/')
      } else {
        setError(result.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }

    if (regPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự!')
      return
    }

    if (!regToken.trim()) {
      setError('Vui lòng nhập mã mời (Invite Token) bạn nhận được qua email!')
      return
    }

    setIsLoading(true)

    try {
      const query = `
        mutation Register($request: RegisterRequestInput!) {
          register(request: $request) {
            succeeded
            message
            errors {
              key
              value
            }
            data {
              id
              username
              email
              accessToken
              refreshToken
              roles
            }
          }
        }
      `

      const result = await graphqlRequest<{ register: RegisterResponse }>(query, {
        request: {
          token: regToken.trim(),
          username: regUsername,
          password: regPassword,
        },
      })

      if (result.errors && result.errors.length > 0) {
        setError(result.errors[0].message)
        return
      }

      const registerResult = result.data!.register

      if (registerResult.succeeded && registerResult.data) {
        // Register trả về accessToken luôn → đăng nhập tự động
        setAccessToken(registerResult.data.accessToken)
        setRefreshToken(registerResult.data.refreshToken)
        setUserRoles(registerResult.data.roles)

        localStorage.setItem('currentUser', JSON.stringify({
          id: registerResult.data.id,
          username: registerResult.data.username,
          email: registerResult.data.email,
          roles: registerResult.data.roles,
        }))

        setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...')

        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setError(registerResult.message || registerResult.errors?.join(', ') || 'Đăng ký thất bại.')
      }
    } catch (err) {
      console.error('Register error:', err)
      setError('Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestTestInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setTestInviteError(null)
    setTestInviteSuccess(null)
    setIsSendingTestInvite(true)

    try {
      // 1. Đăng nhập tài khoản Admin test trong hệ thống
      const loginRes = await loginUser('admin@mms.com', 'Admin@123')
      if (!loginRes.succeeded || !loginRes.data?.accessToken) {
        throw new Error(loginRes.message || 'Không thể đăng nhập tài khoản Admin test.')
      }

      const adminToken = loginRes.data.accessToken

      // 2. Gọi Mutation InviteUser để gửi mail và sinh mã mời
      const inviteMutation = `
        mutation InviteUser($request: InviteRequestInput!) {
          inviteUser(request: $request) {
            succeeded
            message
            errors {
              key
              value
            }
            data {
              email
              token
              roleName
              expiryDate
            }
          }
        }
      `

      const inviteResult = await graphqlRequest<{ inviteUser: any }>(
        inviteMutation,
        {
          request: {
            email: testEmail.trim(),
            roleName: 'Mangaka'
          }
        },
        false,
        adminToken
      )

      if (inviteResult.errors && inviteResult.errors.length > 0) {
        throw new Error(inviteResult.errors[0].message)
      }

      const inviteRes = inviteResult.data?.inviteUser
      if (inviteRes?.succeeded && inviteRes.data) {
        setTestInviteSuccess(`Mã mời đã được gửi tới mail ${testEmail}!`)
        // Điền luôn mã mời vào ô nhập phía dưới
        setRegToken(inviteRes.data.token)
      } else {
        throw new Error(inviteRes?.message || inviteRes?.errors?.join(', ') || 'Gửi lời mời thất bại.')
      }

    } catch (err: any) {
      console.error('Test invite error:', err)
      setTestInviteError(err.message || 'Có lỗi xảy ra khi gửi mã mời. Hãy kiểm tra kết nối Server/Email.')
    } finally {
      setIsSendingTestInvite(false)
    }
  }

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-bg">
        <div className="login-bg-grid" />
        <div className="login-bg-glow login-bg-glow--1" />
        <div className="login-bg-glow login-bg-glow--2" />
        <div className="login-bg-glow login-bg-glow--3" />
        <div className="floating-panels">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`floating-panel floating-panel--${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className={`login-card ${mounted ? 'login-card--visible' : ''}`}>
        {/* Logo Section */}
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">
              <BookOpen className="login-logo-svg" />
            </div>
            <div className="login-logo-ring" />
          </div>
          <h1 className="login-title">MangaFlow</h1>
          <p className="login-subtitle">Hệ thống quản lý sản xuất Manga</p>
        </div>

        {/* Tab Switcher */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${mode === 'login' ? 'login-tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            <LogIn className="login-tab-icon" />
            Đăng nhập
          </button>
          <button
            type="button"
            className={`login-tab ${mode === 'register' ? 'login-tab--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            <UserPlus className="login-tab-icon" />
            Đăng ký
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="login-success">
            <CheckCircle2 className="login-success-icon" />
            <p className="login-success-text">{successMsg}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="login-error">
            <AlertCircle className="login-error-icon" />
            <p className="login-error-text">{error}</p>
          </div>
        )}

        {/* ===== LOGIN FORM ===== */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="login-email" className="login-label">
                Tên đăng nhập / Email
              </label>
              <div className="login-input-wrap">
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mangaka_test"
                  required
                  disabled={isLoading}
                  className="login-input"
                  autoComplete="username"
                />
                <div className="login-input-focus" />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-label">
                Mật khẩu
              </label>
              <div className="login-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="login-input login-input--password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-eye-btn"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="login-eye-icon" /> : <Eye className="login-eye-icon" />}
                </button>
                <div className="login-input-focus" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="login-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="login-submit-spinner" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <Sparkles className="login-submit-icon" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ===== REGISTER FORM ===== */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="login-form">
            {/* Invite Token Notice */}
            <div className="login-invite-notice">
              <KeyRound className="login-invite-notice-icon" />
              <p>Bạn cần có <strong>mã mời (Invite Token)</strong> được gửi qua email bởi Mangaka hoặc Admin để đăng ký tài khoản.</p>
            </div>

            {/* Quick Test Invite Request */}
            <div className="login-test-invite-section">
              <div className="login-test-invite-header">
                <Sparkles className="login-test-invite-icon-sparkle" />
                <span>Nhận mã mời nhanh (Test)</span>
              </div>
              <p className="login-test-invite-desc">
                Nhập email của bạn để hệ thống gửi mã mời (vai trò Mangaka) về email, đồng thời tự động điền vào ô bên dưới.
              </p>
              <div className="login-test-invite-form">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="login-input login-test-invite-input"
                  disabled={isSendingTestInvite}
                />
                <button
                  type="button"
                  onClick={handleRequestTestInvite}
                  disabled={isSendingTestInvite || !testEmail}
                  className="login-test-invite-btn"
                >
                  {isSendingTestInvite ? (
                    <Loader2 className="login-submit-spinner" />
                  ) : (
                    'Gửi mã'
                  )}
                </button>
              </div>
              {testInviteSuccess && (
                <div className="login-test-invite-success">
                  <CheckCircle2 className="login-success-icon" style={{ width: '16px', height: '16px' }} />
                  <span>{testInviteSuccess}</span>
                </div>
              )}
              {testInviteError && (
                <div className="login-test-invite-error">
                  <AlertCircle className="login-error-icon" style={{ width: '16px', height: '16px' }} />
                  <span>{testInviteError}</span>
                </div>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="reg-token" className="login-label">
                Mã mời (Invite Token)
              </label>
              <div className="login-input-wrap">
                <input
                  id="reg-token"
                  type="text"
                  value={regToken}
                  onChange={(e) => setRegToken(e.target.value)}
                  placeholder="Dán mã mời từ email vào đây..."
                  required
                  disabled={isLoading}
                  className="login-input login-input--token"
                  autoComplete="off"
                />
                <div className="login-input-focus" />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="reg-username" className="login-label">
                Tên đăng nhập
              </label>
              <div className="login-input-wrap">
                <input
                  id="reg-username"
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Chọn tên đăng nhập"
                  required
                  disabled={isLoading}
                  className="login-input"
                  autoComplete="username"
                />
                <div className="login-input-focus" />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="reg-password" className="login-label">
                Mật khẩu
              </label>
              <div className="login-input-wrap">
                <input
                  id="reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự, chữ hoa + số + ký tự đặc biệt"
                  required
                  disabled={isLoading}
                  className="login-input login-input--password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="login-eye-btn"
                  tabIndex={-1}
                >
                  {showRegPassword ? <EyeOff className="login-eye-icon" /> : <Eye className="login-eye-icon" />}
                </button>
                <div className="login-input-focus" />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="reg-confirm-password" className="login-label">
                Xác nhận mật khẩu
              </label>
              <div className="login-input-wrap">
                <input
                  id="reg-confirm-password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  disabled={isLoading}
                  className="login-input"
                  autoComplete="new-password"
                />
                <div className="login-input-focus" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !regToken || !regUsername || !regPassword || !regConfirmPassword}
              className="login-submit login-submit--register"
            >
              {isLoading ? (
                <>
                  <Loader2 className="login-submit-spinner" />
                  <span>Đang tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <UserPlus className="login-submit-icon" />
                  <span>Đăng ký tài khoản</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Login Hints (only on login tab) */}
        {mode === 'login' && (
          <div className="login-hints">
            <p className="login-hints-title">Tài khoản test nhanh:</p>
            <div className="login-hints-list">
              <button
                type="button"
                onClick={() => { setEmail('mangaka_test'); setPassword('Password123!') }}
                className="login-hint-chip"
              >
                🎨 Mangaka
              </button>
              <button
                type="button"
                onClick={() => { setEmail('assistant_test'); setPassword('Password123!') }}
                className="login-hint-chip"
              >
                ✍️ Assistant
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="login-footer">
          © 2026 MangaFlow · Manga Management System
        </p>
      </div>
    </div>
  )
}
