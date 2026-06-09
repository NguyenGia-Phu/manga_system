// API Client for MMS Backend
// GraphQL: https://localhost:7242/graphql
// REST: https://localhost:7242/api/...

const GRAPHQL_URL = 'https://localhost:7242/graphql'
const REST_BASE_URL = 'https://localhost:7242/api'

// --- Token Management ---
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

export function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token)
}

export function removeAccessToken(): void {
  localStorage.removeItem('accessToken')
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refreshToken')
}

export function setRefreshToken(token: string): void {
  localStorage.setItem('refreshToken', token)
}

export function removeRefreshToken(): void {
  localStorage.removeItem('refreshToken')
}

export function getUserRoles(): string[] {
  if (typeof window === 'undefined') return []
  const roles = localStorage.getItem('userRoles')
  return roles ? JSON.parse(roles) : []
}

export function setUserRoles(roles: string[]): void {
  localStorage.setItem('userRoles', JSON.stringify(roles))
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

// --- Token Refresh State & Queue ---
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(newAccessToken: string) {
  refreshSubscribers.forEach((cb) => cb(newAccessToken))
  refreshSubscribers = []
}

async function performRefreshToken(): Promise<string | null> {
  const currentRefreshToken = getRefreshToken()
  if (!currentRefreshToken) return null

  const query = `
    mutation RefreshToken($refreshToken: String!) {
      refreshToken(refreshToken: $refreshToken) {
        succeeded
        message
        data {
          accessToken
          refreshToken
        }
      }
    }
  `

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { refreshToken: currentRefreshToken },
      }),
    })

    if (!response.ok) return null

    const result = await response.json()
    const refreshResult = result.data?.refreshToken

    if (refreshResult?.succeeded && refreshResult.data) {
      const { accessToken, refreshToken } = refreshResult.data
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      return accessToken
    }
  } catch (err) {
    console.error('Error refreshing token:', err)
  }

  return null
}

// --- GraphQL Client ---
export interface GraphQLResponse<T = any> {
  data?: T
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>
}

export async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
  requireAuth: boolean = false,
  customToken?: string
): Promise<GraphQLResponse<T>> {
  const getHeaders = (tokenToUse?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (customToken) {
      headers['Authorization'] = `Bearer ${customToken}`
    } else if (requireAuth) {
      const token = tokenToUse || getAccessToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  const runFetch = async (headers: Record<string, string>) => {
    return fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    })
  }

  let response = await runFetch(getHeaders())

  // Bắt lỗi 401 Unauthorized để refresh token
  if (response.status === 401 && requireAuth && !customToken) {
    if (!isRefreshing) {
      isRefreshing = true
      const newAccessToken = await performRefreshToken()
      isRefreshing = false

      if (newAccessToken) {
        onTokenRefreshed(newAccessToken)
      } else {
        refreshSubscribers = []
        if (typeof window !== 'undefined') {
          logout()
        }
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }
    } else {
      // Đợi token mới và chạy lại request
      return new Promise<GraphQLResponse<T>>((resolve, reject) => {
        subscribeTokenRefresh(async (newAccessToken) => {
          try {
            const retryResponse = await runFetch(getHeaders(newAccessToken))
            if (!retryResponse.ok) {
              throw new Error(`HTTP Error: ${retryResponse.status}`)
            }
            resolve(retryResponse.json())
          } catch (err) {
            reject(err)
          }
        })
      })
    }

    // Chạy lại request hiện tại với token mới vừa được refresh
    const token = getAccessToken()
    if (token) {
      response = await runFetch(getHeaders(token))
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        logout()
      }
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    const errText = await response.text().catch(() => '')
    console.error('GraphQL Error Response:', errText)
    throw new Error(`HTTP Error: ${response.status} ${response.statusText} - ${errText}`)
  }

  return response.json()
}

// --- REST Client ---
export async function restRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: any
    isFormData?: boolean
    requireAuth?: boolean
  } = {}
): Promise<T> {
  const { method = 'GET', body, isFormData = false, requireAuth = true } = options

  const getHeaders = (tokenToUse?: string) => {
    const headers: Record<string, string> = {}
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }
    if (requireAuth) {
      const token = tokenToUse || getAccessToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  const runFetch = async (headers: Record<string, string>) => {
    return fetch(`${REST_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    })
  }

  let response = await runFetch(getHeaders())

  if (response.status === 401 && requireAuth) {
    if (!isRefreshing) {
      isRefreshing = true
      const newAccessToken = await performRefreshToken()
      isRefreshing = false

      if (newAccessToken) {
        onTokenRefreshed(newAccessToken)
      } else {
        refreshSubscribers = []
        if (typeof window !== 'undefined') {
          logout()
        }
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }
    } else {
      // Đợi token mới và chạy lại request
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newAccessToken) => {
          try {
            const retryResponse = await runFetch(getHeaders(newAccessToken))
            if (!retryResponse.ok) {
              throw new Error(`HTTP Error: ${retryResponse.status}`)
            }
            const contentType = retryResponse.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              resolve(retryResponse.json())
            } else {
              resolve(retryResponse.text() as unknown as T)
            }
          } catch (err) {
            reject(err)
          }
        })
      })
    }

    // Chạy lại request hiện tại với token mới vừa được refresh
    const token = getAccessToken()
    if (token) {
      response = await runFetch(getHeaders(token))
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        logout()
      }
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    const errorText = await response.text()
    throw new Error(`HTTP Error: ${response.status} - ${errorText}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  return response.text() as unknown as T
}

// --- Auth API ---
export interface LoginResponse {
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

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const query = `
    mutation Login($request: LoginRequestInput!) {
      login(request: $request) {
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

  const result = await graphqlRequest<{ login: LoginResponse }>(query, {
    request: { email, password },
  })

  if (result.errors && result.errors.length > 0) {
    return {
      succeeded: false,
      message: result.errors[0].message,
      errors: null,
      data: null,
    }
  }

  return result.data!.login
}

export function logout(): void {
  removeAccessToken()
  removeRefreshToken()
  localStorage.removeItem('userRoles')
  localStorage.removeItem('mangakaId')
  localStorage.removeItem('currentUser')
  window.location.href = '/login'
}
