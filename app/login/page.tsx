'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, setAccessToken, setRefreshToken, setUserRoles, isAuthenticated, graphqlRequest, restRequest } from '@/lib/api'
import { BookOpen, Eye, EyeOff, Loader2, AlertCircle, Sparkles, UserPlus, LogIn, CheckCircle2, KeyRound, Upload, FileText } from 'lucide-react'

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
  const [registerType, setRegisterType] = useState<'mangaka' | 'assistant'>('mangaka')
  const [regToken, setRegToken] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Mangaka application state
  const [appEmail, setAppEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [appConfirmPassword, setAppConfirmPassword] = useState('')
  const [appFullName, setAppFullName] = useState('')
  const [appSeriesTitle, setAppSeriesTitle] = useState('')
  const [appFiles, setAppFiles] = useState<File[]>([])

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

    if (registerType === 'mangaka') {
      if (appPassword !== appConfirmPassword) {
        setError('Mật khẩu xác nhận không khớp!')
        return
      }

      if (appPassword.length < 8) {
        setError('Mật khẩu phải có ít nhất 8 ký tự!')
        return
      }

      if (appFiles.length === 0) {
        setError('Vui lòng chọn ít nhất một file ảnh bản thảo tác phẩm!')
        return
      }

      setIsLoading(true)

      try {
        const formData = new FormData()
        formData.append('Email', appEmail.trim())
        formData.append('Password', appPassword)
        formData.append('FullName', appFullName.trim())
        formData.append('SeriesTitle', appSeriesTitle.trim())
        appFiles.forEach((file) => {
          formData.append('Files', file)
        })

        const response = await restRequest<any>('/candidate-application/submit', {
          method: 'POST',
          body: formData,
          isFormData: true,
          requireAuth: false,
        })

        if (response && response.succeeded) {
          setSuccessMsg(response.message || 'Đơn ứng tuyển đã được gửi thành công. Vui lòng chờ phản hồi qua email.')
          // Reset form fields
          setAppEmail('')
          setAppPassword('')
          setAppConfirmPassword('')
          setAppFullName('')
          setAppSeriesTitle('')
          setAppFiles([])
        } else {
          setError(response?.message || 'Gửi đơn ứng tuyển thất bại.')
        }
      } catch (err: any) {
        console.error('Mangaka register error:', err)
        setError(err.message || 'Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.')
      } finally {
        setIsLoading(false)
      }
    } else {
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
            {/* Sub-tab selection */}
            <div className="login-role-selector" style={{ marginBottom: '8px' }}>
              <button
                type="button"
                className={`login-role-btn ${registerType === 'mangaka' ? 'login-role-btn--active' : ''}`}
                onClick={() => {
                  setRegisterType('mangaka')
                  setError(null)
                  setSuccessMsg(null)
                }}
              >
                🎨 Tác giả (Mangaka)
              </button>
              <button
                type="button"
                className={`login-role-btn ${registerType === 'assistant' ? 'login-role-btn--active' : ''}`}
                onClick={() => {
                  setRegisterType('assistant')
                  setError(null)
                  setSuccessMsg(null)
                }}
              >
                ✍️ Trợ lý (Assistant)
              </button>
            </div>

            {registerType === 'mangaka' ? (
              <>
                {/* Mangaka Registration Form */}
                <div className="login-invite-notice" style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.15)' }}>
                  <Sparkles className="login-invite-notice-icon" style={{ color: '#60a5fa' }} />
                  <p style={{ color: '#93c5fd' }}>
                    Đăng ký tài khoản tác giả bằng cách nộp **tác phẩm đầu tay**. Đơn của bạn sẽ được gửi tới **Hội đồng biên tập** xét duyệt.
                  </p>
                </div>

                <div className="login-field">
                  <label htmlFor="app-email" className="login-label">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <input
                      id="app-email"
                      type="email"
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      placeholder="author@example.com"
                      required
                      disabled={isLoading}
                      className="login-input"
                    />
                    <div className="login-input-focus" />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="app-fullname" className="login-label">
                    Họ tên / Bút danh <span className="text-red-500">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <input
                      id="app-fullname"
                      type="text"
                      value={appFullName}
                      onChange={(e) => setAppFullName(e.target.value)}
                      placeholder="Tên tác giả hiển thị..."
                      required
                      disabled={isLoading}
                      className="login-input"
                    />
                    <div className="login-input-focus" />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="app-seriestitle" className="login-label">
                    Tên tác phẩm đầu tay <span className="text-red-500">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <input
                      id="app-seriestitle"
                      type="text"
                      value={appSeriesTitle}
                      onChange={(e) => setAppSeriesTitle(e.target.value)}
                      placeholder="Nhập tên series truyện đầu tay..."
                      required
                      disabled={isLoading}
                      className="login-input"
                    />
                    <div className="login-input-focus" />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="app-password" className="login-label">
                    Mật khẩu đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <input
                      id="app-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="login-input login-input--password"
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
                  <label htmlFor="app-confirm-password" className="login-label">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <input
                      id="app-confirm-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={appConfirmPassword}
                      onChange={(e) => setAppConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      required
                      disabled={isLoading}
                      className="login-input"
                    />
                    <div className="login-input-focus" />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Ảnh trang bản thảo (Nộp nhiều ảnh) <span className="text-red-500">*</span></span>
                    <span className="text-xs opacity-60">JPG, PNG, WEBP</span>
                  </label>
                  <div className="relative hover:border-primary/50 bg-secondary/15 rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer" style={{ position: 'relative', border: '2px dashed rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setAppFiles(Array.from(e.target.files))
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      disabled={isLoading}
                      required
                    />
                    <Upload className="h-8 w-8 text-primary mb-2 opacity-70" style={{ width: '32px', height: '32px', color: '#6366f1', marginBottom: '8px', opacity: 0.7 }} />
                    <span className="text-sm font-semibold text-foreground">Chọn các file ảnh để tải lên</span>
                    <span className="text-xs text-muted-foreground mt-1" style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)', marginTop: '4px' }}>Hội đồng sẽ đánh giá dựa trên bản thảo này</span>
                  </div>
                  {appFiles.length > 0 && (
                    <div className="p-3 bg-secondary/35 rounded-xl border border-border/50 space-y-1.5 mt-2" style={{ padding: '12px', background: 'rgba(30, 30, 60, 0.4)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)', marginTop: '8px' }}>
                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5" style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <CheckCircle2 className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
                        Đã chọn {appFiles.length} file hình ảnh:
                      </p>
                      <div className="max-h-24 overflow-y-auto text-[11px] text-muted-foreground space-y-0.5" style={{ maxHeight: '96px', overflowY: 'auto', fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)', marginTop: '6px' }}>
                        {appFiles.map((file, i) => (
                          <div key={i} className="truncate flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText className="h-3 w-3 flex-shrink-0" style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                            <span className="truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !appEmail || !appPassword || !appConfirmPassword || !appFullName || !appSeriesTitle || appFiles.length === 0}
                  className="login-submit login-submit--register"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="login-submit-spinner" />
                      <span>Đang nộp đơn ứng tuyển...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="login-submit-icon" />
                      <span>Nộp đơn ứng tuyển Mangaka</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Assistant Registration Form */}
                <div className="login-invite-notice">
                  <KeyRound className="login-invite-notice-icon" />
                  <p>Bạn cần có <strong>mã mời (Invite Token)</strong> được gửi qua email bởi Mangaka hoặc Admin để đăng ký tài khoản.</p>
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
                      <span>Đăng ký tài khoản Trợ lý</span>
                    </>
                  )}
                </button>
              </>
            )}
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
