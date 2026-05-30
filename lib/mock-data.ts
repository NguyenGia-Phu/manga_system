// Mock data and types for the Manga Production Management System

export type UserRole = 'mangaka' | 'assistant' | 'editor' | 'board' | 'admin'

export interface User {
  id: string
  name: string
  avatar: string
  role: UserRole
  email: string
}

export interface Series {
  id: string
  title: string
  alternativeTitle: string | null
  description: string
  coverImageUrl: string | null
  status: 'draft' | 'pending' | 'ongoing' | 'hiatus' | 'cancelled' | 'completed' // Removed approved, adjusted to common states
  createdAt: string
  updatedAt: string
  authorEmail: string | null
  authorName: string
  authorId: string
  tantouEditorId: string | null
  rank?: number
  previousRank?: number
  votes?: number
}

export interface Chapter {
  id: string
  seriesId: string
  seriesTitle: string
  number: number
  title: string
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'published'
  pages: Page[]
  deadline: string
  createdAt: string
  submittedAt?: string
  approvedAt?: string
}

export interface Page {
  id: string
  chapterId: string
  pageNumber: number
  imageUrl: string
  status: 'pending' | 'assigned' | 'in_progress' | 'submitted' | 'revision' | 'approved'
  tasks: Task[]
}

export interface Task {
  id: string
  pageId: string
  type: 'background' | 'shading' | 'effects' | 'screentone' | 'cleanup' | 'lettering'
  description: string
  assignedTo: string
  assignedToName: string
  status: 'pending' | 'in_progress' | 'submitted' | 'revision' | 'approved'
  region?: { x: number; y: number; width: number; height: number }
  deadline: string
  payment: number
  createdAt: string
  submittedAt?: string
  feedback?: string
}

export interface Annotation {
  id: string
  pageId: string
  x: number
  y: number
  width: number
  height: number
  type: 'dialogue' | 'art' | 'pacing' | 'general'
  content: string
  author: string
  authorRole: UserRole
  createdAt: string
  resolved: boolean
}

export interface VoteSession {
  id: string
  seriesId: string
  seriesTitle: string
  type: 'new_series' | 'cancellation' | 'schedule_change'
  status: 'open' | 'closed'
  votes: { memberId: string; memberName: string; vote: 'approve' | 'reject' | 'abstain' }[]
  deadline: string
  result?: 'approved' | 'rejected'
  createdAt: string
}

export interface PollData {
  weekNumber: number
  year: number
  entries: { seriesId: string; seriesTitle: string; votes: number; rank: number }[]
  submittedAt: string
  submittedBy: string
}

// Mock Users
export const mockUsers: User[] = [
  { id: 'u1', name: 'Tanaka Yuki', avatar: '/avatars/mangaka.jpg', role: 'mangaka', email: 'tanaka@studio.jp' },
  { id: 'u2', name: 'Sato Emi', avatar: '/avatars/assistant1.jpg', role: 'assistant', email: 'sato@studio.jp' },
  { id: 'u3', name: 'Yamamoto Ken', avatar: '/avatars/assistant2.jpg', role: 'assistant', email: 'yamamoto@studio.jp' },
  { id: 'u4', name: 'Suzuki Hiro', avatar: '/avatars/editor.jpg', role: 'editor', email: 'suzuki@publisher.jp' },
  { id: 'u5', name: 'Watanabe Rei', avatar: '/avatars/board1.jpg', role: 'board', email: 'watanabe@publisher.jp' },
]

// Mock Series
export const mockSeries: Series[] = [
  {
    id: 's1',
    title: 'Blade of the Eternal',
    alternativeTitle: '永遠の刃',
    description: 'A young samurai embarks on a journey to find the legendary blade that can cut through dimensions.',
    coverImageUrl: '/covers/blade-eternal.jpg',
    status: 'ongoing',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    authorEmail: 'tanaka@studio.jp',
    authorName: 'Tanaka Yuki',
    authorId: 'u1',
    tantouEditorId: 'u4',
    rank: 1,
    previousRank: 2,
    votes: 15420
  },
  {
    id: 's2',
    title: 'Digital Hearts',
    alternativeTitle: 'デジタルハーツ',
    description: 'In a world where emotions can be digitized, two programmers discover love in the code.',
    coverImageUrl: '/covers/digital-hearts.jpg',
    status: 'ongoing',
    createdAt: '2024-03-20',
    updatedAt: '2024-03-20',
    authorEmail: 'tanaka@studio.jp',
    authorName: 'Tanaka Yuki',
    authorId: 'u1',
    tantouEditorId: 'u4',
    rank: 3,
    previousRank: 3,
    votes: 12100
  },
  {
    id: 's3',
    title: 'Shadow Academy',
    alternativeTitle: 'シャドウアカデミー',
    description: 'A prestigious academy hides a dark secret - students are trained to become elite assassins.',
    coverImageUrl: '/covers/shadow-academy.jpg',
    status: 'ongoing',
    createdAt: '2023-06-10',
    updatedAt: '2023-06-10',
    authorEmail: 'morita@studio.jp',
    authorName: 'Morita Kenji',
    authorId: 'u6',
    tantouEditorId: 'u4',
    rank: 2,
    previousRank: 1,
    votes: 14200
  },
  {
    id: 's4',
    title: 'Cooking Master Neo',
    alternativeTitle: '料理マスターネオ',
    description: 'A young chef enters the world of competitive cooking to save his grandmother\'s restaurant.',
    coverImageUrl: '/covers/cooking-master.jpg',
    status: 'ongoing',
    createdAt: '2022-11-05',
    updatedAt: '2022-11-05',
    authorEmail: 'hayashi@studio.jp',
    authorName: 'Hayashi Miku',
    authorId: 'u7',
    tantouEditorId: 'u4',
    rank: 5,
    previousRank: 6,
    votes: 9800
  },
  {
    id: 's5',
    title: 'Ghost Protocol',
    alternativeTitle: 'ゴーストプロトコル',
    description: 'A detective who can see ghosts investigates cases that blur the line between life and death.',
    coverImageUrl: '/covers/ghost-protocol.jpg',
    status: 'hiatus',
    createdAt: '2023-09-12',
    updatedAt: '2023-09-12',
    authorEmail: 'kimura@studio.jp',
    authorName: 'Kimura Sota',
    authorId: 'u8',
    tantouEditorId: 'u4',
    rank: 16,
    previousRank: 15,
    votes: 1200
  },
]

// Mock Chapters
export const mockChapters: Chapter[] = [
  {
    id: 'ch1',
    seriesId: 's1',
    seriesTitle: 'Blade of the Eternal',
    number: 46,
    title: 'The Awakening',
    status: 'in_progress',
    pages: [],
    deadline: '2026-05-28',
    createdAt: '2026-05-14',
  },
  {
    id: 'ch2',
    seriesId: 's1',
    seriesTitle: 'Blade of the Eternal',
    number: 45,
    title: 'Clash of Destinies',
    status: 'published',
    pages: [],
    deadline: '2026-05-21',
    createdAt: '2026-05-07',
    submittedAt: '2026-05-19',
    approvedAt: '2026-05-20',
  },
  {
    id: 'ch3',
    seriesId: 's2',
    seriesTitle: 'Digital Hearts',
    number: 29,
    title: 'Connection Lost',
    status: 'review',
    pages: [],
    deadline: '2026-06-05',
    createdAt: '2026-05-15',
    submittedAt: '2026-05-20',
  },
]

// Mock Tasks for Assistant
export const mockTasks: Task[] = [
  {
    id: 't1',
    pageId: 'p1',
    type: 'background',
    description: 'Draw detailed cityscape background for panel 1-3',
    assignedTo: 'u2',
    assignedToName: 'Sato Emi',
    status: 'in_progress',
    deadline: '2026-05-25',
    payment: 15000,
    createdAt: '2026-05-18',
  },
  {
    id: 't2',
    pageId: 'p2',
    type: 'shading',
    description: 'Add dramatic shading for the battle scene',
    assignedTo: 'u2',
    assignedToName: 'Sato Emi',
    status: 'pending',
    deadline: '2026-05-26',
    payment: 12000,
    createdAt: '2026-05-18',
  },
  {
    id: 't3',
    pageId: 'p3',
    type: 'screentone',
    description: 'Apply screentone patterns for all character clothes',
    assignedTo: 'u2',
    assignedToName: 'Sato Emi',
    status: 'submitted',
    deadline: '2026-05-24',
    payment: 8000,
    createdAt: '2026-05-17',
    submittedAt: '2026-05-20',
  },
  {
    id: 't4',
    pageId: 'p4',
    type: 'effects',
    description: 'Add speed lines and impact effects',
    assignedTo: 'u3',
    assignedToName: 'Yamamoto Ken',
    status: 'approved',
    deadline: '2026-05-22',
    payment: 10000,
    createdAt: '2026-05-16',
    submittedAt: '2026-05-21',
  },
]

// Mock Vote Sessions
export const mockVoteSessions: VoteSession[] = [
  {
    id: 'vs1',
    seriesId: 'new1',
    seriesTitle: 'Midnight Runners',
    type: 'new_series',
    status: 'open',
    votes: [
      { memberId: 'b1', memberName: 'Watanabe Rei', vote: 'approve' },
      { memberId: 'b2', memberName: 'Nakamura Taro', vote: 'approve' },
    ],
    deadline: '2026-05-25',
    createdAt: '2026-05-18',
  },
  {
    id: 'vs2',
    seriesId: 's5',
    seriesTitle: 'Ghost Protocol',
    type: 'cancellation',
    status: 'open',
    votes: [
      { memberId: 'b1', memberName: 'Watanabe Rei', vote: 'reject' },
    ],
    deadline: '2026-05-26',
    createdAt: '2026-05-19',
  },
]

// Mock Poll Data
export const mockPollData: PollData[] = [
  {
    weekNumber: 20,
    year: 2026,
    entries: [
      { seriesId: 's3', seriesTitle: 'Shadow Academy', votes: 4521, rank: 1 },
      { seriesId: 's4', seriesTitle: 'Cooking Master Neo', votes: 3892, rank: 2 },
      { seriesId: 's1', seriesTitle: 'Blade of the Eternal', votes: 2847, rank: 3 },
      { seriesId: 's2', seriesTitle: 'Digital Hearts', votes: 1523, rank: 12 },
      { seriesId: 's5', seriesTitle: 'Ghost Protocol', votes: 892, rank: 18 },
    ],
    submittedAt: '2026-05-19',
    submittedBy: 'Watanabe Rei',
  },
]

// Mock data for new series proposals (Board voting)
export const mockNewSeriesProposals = [
  {
    id: 'prop1',
    title: 'Midnight Runners',
    author: 'Ishikawa Ryo',
    authorAvatar: '/avatars/author1.jpg',
    genre: 'Sports',
    synopsis: 'A group of night-shift workers form an underground running club that becomes a sensation in Tokyo. They compete in secret races while dealing with their day-to-day struggles.',
    targetAudience: 'Seinen',
    submittedAt: '2026-05-15',
    manuscriptUrl: '/manuscripts/midnight-runners.pdf',
    votesFor: 3,
    votesAgainst: 1,
    totalVoters: 7,
    myVote: undefined,
    status: 'pending' as const,
  },
  {
    id: 'prop2',
    title: 'Witch of the Western Woods',
    author: 'Fujimoto Sakura',
    authorAvatar: '/avatars/author2.jpg',
    genre: 'Fantasy',
    synopsis: 'A young witch inherits her grandmother\'s cottage in a mysterious forest where magical creatures and humans coexist. She must navigate complex relationships while mastering her powers.',
    targetAudience: 'Shoujo',
    submittedAt: '2026-05-18',
    manuscriptUrl: '/manuscripts/witch-western.pdf',
    votesFor: 2,
    votesAgainst: 0,
    totalVoters: 7,
    myVote: undefined,
    status: 'pending' as const,
  },
  {
    id: 'prop3',
    title: 'Cyber Samurai 2099',
    author: 'Nakagawa Tetsuo',
    authorAvatar: '/avatars/author3.jpg',
    genre: 'Sci-Fi',
    synopsis: 'In a dystopian future Tokyo, a ronin with cybernetic enhancements seeks revenge against the mega-corporation that destroyed his clan.',
    targetAudience: 'Seinen',
    submittedAt: '2026-05-20',
    manuscriptUrl: '/manuscripts/cyber-samurai.pdf',
    votesFor: 1,
    votesAgainst: 2,
    totalVoters: 7,
    myVote: undefined,
    status: 'pending' as const,
  },
]

// Mock data for series requiring decisions
export const mockSeriesForDecision = [
  {
    id: 's5',
    title: 'Ghost Protocol',
    author: 'Kimura Sota',
    rank: 18,
    currentSchedule: 'Monthly',
    consecutiveBottom: 4,
    decision: null,
    schedule: null,
  },
  {
    id: 's6',
    title: 'Demon Chef',
    author: 'Ogawa Hana',
    rank: 16,
    currentSchedule: 'Weekly',
    consecutiveBottom: 3,
    decision: null,
    schedule: null,
  },
  {
    id: 's7',
    title: 'Time Slip High',
    author: 'Aoki Daichi',
    rank: 8,
    currentSchedule: 'Bi-weekly',
    consecutiveBottom: 0,
    decision: null,
    schedule: null,
  },
]

// Mock data for rankings page
export const mockRankings = [
  { id: 's3', title: 'Shadow Academy', author: 'Morita Kenji', genre: 'Action', votes: 4521, rank: 1, change: 0, consecutiveBottom: 0 },
  { id: 's4', title: 'Cooking Master Neo', author: 'Hayashi Miku', genre: 'Cooking', votes: 3892, rank: 2, change: 1, consecutiveBottom: 0 },
  { id: 's1', title: 'Blade of the Eternal', author: 'Tanaka Yuki', genre: 'Fantasy', votes: 2847, rank: 3, change: 2, consecutiveBottom: 0 },
  { id: 's8', title: 'Love in Tokyo', author: 'Yamada Rin', genre: 'Romance', votes: 2654, rank: 4, change: -1, consecutiveBottom: 0 },
  { id: 's9', title: 'Battle High', author: 'Suzuki Ken', genre: 'Action', votes: 2431, rank: 5, change: 0, consecutiveBottom: 0 },
  { id: 's10', title: 'Monster Tamer', author: 'Ito Yuma', genre: 'Fantasy', votes: 2298, rank: 6, change: 3, consecutiveBottom: 0 },
  { id: 's11', title: 'Detective Club', author: 'Sato Mei', genre: 'Mystery', votes: 2156, rank: 7, change: -2, consecutiveBottom: 0 },
  { id: 's7', title: 'Time Slip High', author: 'Aoki Daichi', genre: 'Sci-Fi', votes: 1987, rank: 8, change: 1, consecutiveBottom: 0 },
  { id: 's12', title: 'Soccer Dreams', author: 'Honda Kazu', genre: 'Sports', votes: 1845, rank: 9, change: -1, consecutiveBottom: 0 },
  { id: 's13', title: 'Idol Stars', author: 'Nakamura Yui', genre: 'Music', votes: 1723, rank: 10, change: 2, consecutiveBottom: 0 },
  { id: 's14', title: 'Space Pirates', author: 'Kondo Ryu', genre: 'Sci-Fi', votes: 1654, rank: 11, change: -3, consecutiveBottom: 1 },
  { id: 's2', title: 'Digital Hearts', author: 'Tanaka Yuki', genre: 'Romance', votes: 1523, rank: 12, change: -2, consecutiveBottom: 1 },
  { id: 's15', title: 'Ninja Academy', author: 'Watanabe Shin', genre: 'Action', votes: 1398, rank: 13, change: 0, consecutiveBottom: 0 },
  { id: 's16', title: 'Music Battle', author: 'Yoshida Aoi', genre: 'Music', votes: 1245, rank: 14, change: 1, consecutiveBottom: 1 },
  { id: 's17', title: 'Haunted School', author: 'Takeda Mio', genre: 'Horror', votes: 1098, rank: 15, change: -2, consecutiveBottom: 2 },
  { id: 's6', title: 'Demon Chef', author: 'Ogawa Hana', genre: 'Cooking', votes: 987, rank: 16, change: -1, consecutiveBottom: 3 },
  { id: 's18', title: 'Robot Friends', author: 'Ueda Taro', genre: 'Sci-Fi', votes: 923, rank: 17, change: -4, consecutiveBottom: 4 },
  { id: 's5', title: 'Ghost Protocol', author: 'Kimura Sota', genre: 'Thriller', votes: 892, rank: 18, change: -3, consecutiveBottom: 4 },
]

// Mock poll history
export const mockPollHistory = [
  { id: 'ph1', issue: 'Issue #21', date: '2026-05-19', totalVotes: 42567, seriesCount: 18, topSeries: 'Shadow Academy' },
  { id: 'ph2', issue: 'Issue #20', date: '2026-05-12', totalVotes: 41234, seriesCount: 18, topSeries: 'Shadow Academy' },
  { id: 'ph3', issue: 'Issue #19', date: '2026-05-05', totalVotes: 39876, seriesCount: 17, topSeries: 'Cooking Master Neo' },
  { id: 'ph4', issue: 'Issue #18', date: '2026-04-28', totalVotes: 40123, seriesCount: 17, topSeries: 'Shadow Academy' },
  { id: 'ph5', issue: 'Issue #17', date: '2026-04-21', totalVotes: 38765, seriesCount: 17, topSeries: 'Shadow Academy' },
]

// Utility functions
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    mangaka: 'Mangaka',
    assistant: 'Trợ lý',
    editor: 'Biên tập viên',
    board: 'Hội đồng biên tập',
    admin: 'Admin',
  }
  return labels[role]
}

export function getStatusLabel(status: string): string {
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

export function getTaskTypeLabel(type: Task['type']): string {
  const labels: Record<Task['type'], string> = {
    background: 'Vẽ nền',
    shading: 'Tô bóng',
    effects: 'Hiệu ứng',
    screentone: 'Screentone',
    cleanup: 'Làm sạch',
    lettering: 'Chữ viết',
  }
  return labels[type]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}
