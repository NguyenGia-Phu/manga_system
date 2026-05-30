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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (customToken) {
    headers['Authorization'] = `Bearer ${customToken}`
  } else if (requireAuth) {
    const token = getAccessToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
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

  const headers: Record<string, string> = {}

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (requireAuth) {
    const token = getAccessToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${REST_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
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
  localStorage.removeItem('userRoles')
  localStorage.removeItem('mangakaId')
  localStorage.removeItem('currentUser')
  window.location.href = '/login'
}
