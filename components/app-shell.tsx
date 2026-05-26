'use client'

import { useEffect } from 'react'
import { AppSidebar } from './app-sidebar'
import { useAppStore } from '@/lib/store'
import { graphqlRequest, isAuthenticated } from '@/lib/api'
import { useRouter } from 'next/navigation'

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const mySeries = useAppStore((state) => state.mySeries)
  const setMySeries = useAppStore((state) => state.setMySeries)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    if (mySeries.length > 0) return;

    const loadMangaSeries = async () => {
      const mangakaIdFromStorage = localStorage.getItem('mangakaId')
      
      if (!mangakaIdFromStorage) {
        console.warn("Chưa có mangakaId trong LocalStorage - có thể chưa phải Mangaka")
        return
      }

      const GRAPHQL_QUERY = `
        query GetSeries($MangakaId: UUID!) {
          mySeries(mangakaId: $MangakaId) {
            id
            status
          }
        }
      `;

      try {
        const result = await graphqlRequest(GRAPHQL_QUERY, {
          MangakaId: mangakaIdFromStorage
        }, true)

        console.log("🔍 KẾT QUẢ API TRẢ VỀ:", result)
        setMySeries(result.data?.mySeries || [])

      } catch (error) {
        console.error("Lỗi kết nối API:", error)
      }
    }

    loadMangaSeries()
  }, [])

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <main className="pl-64">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </main>
    </div>
  )
}


