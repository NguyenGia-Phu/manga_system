'use client'

import { useEffect } from 'react'
import { AppSidebar } from './app-sidebar'
import { useAppStore } from '@/lib/store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const mySeries = useAppStore((state) => state.mySeries)
  const setMySeries = useAppStore((state) => state.setMySeries)

  useEffect(() => {
    if (mySeries.length > 0) return;

    const loadMangaSeries = async () => {
      localStorage.setItem("mangakaId", "4CFCCE27-EEDD-41F6-9F1E-00FB03EF866D");
      const mangakaIdFromStorage = localStorage.getItem('mangakaId')
      
      if (!mangakaIdFromStorage) {
        console.error("Chưa đăng nhập hoặc chưa có mangakaId trong LocalStorage!")
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
        const response = await fetch('https://localhost:7242/graphql', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: GRAPHQL_QUERY,
            variables: {
              MangakaId: mangakaIdFromStorage
            }
          })
        })

        const result = await response.json()
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

