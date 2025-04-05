import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Item } from "./types"

interface ItemState {
  items: Item[]
  universityItems: Item[] // 대학별 아이템
  addItem: (item: Item) => void
  updateItem: (item: Item) => void
  removeItem: (id: string) => void
  getMyItems: (userId: string) => Item[]
  syncWithServer: () => Promise<void>
  setItems: (items: Item[]) => void
  setUniversityItems: (items: Item[]) => void // 대학별 아이템 설정 함수
  mergeItems: (serverItems: Item[]) => void // 서버 아이템과 병합 함수
}

export const useItemStore = create<ItemState>()(
  persist(
    (set, get) => ({
      items: [],
      universityItems: [], // 대학별 아이템 초기화
      addItem: (item) => {
        set((state) => ({ items: [item, ...state.items] }))
        // 서버와 동기화 시도
        get().syncWithServer()
      },
      updateItem: (updatedItem) => {
        set((state) => ({
          items: state.items.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
          // 대학 아이템도 업데이트
          universityItems: state.universityItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
        }))
        // 서버와 동기화 시도
        get().syncWithServer()
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          // 대학 아이템에서도 제거
          universityItems: state.universityItems.filter((item) => item.id !== id),
        }))
        // 서버와 동기화 시도
        get().syncWithServer()
      },
      getMyItems: (userId) => {
        return get().items.filter((item) => item.seller.id === userId)
      },
      // 서버와 동기화하는 함수
      syncWithServer: async () => {
        try {
          // 로그인 상태 확인
          const user = localStorage.getItem("user")
          if (!user) return

          const userData = JSON.parse(user)
          if (!userData.id) return

          // 현재 아이템 가져오기
          const items = get().items.filter((item) => item.seller.id === userData.id)

          // 서버에 동기화 요청
          const response = await fetch("/api/sync/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items }),
          })

          if (response.ok) {
            const data = await response.json()

            // 서버에서 받은 아이템으로 로컬 아이템 업데이트
            if (data.items) {
              const otherItems = get().items.filter((item) => item.seller.id !== userData.id)
              set({ items: [...otherItems, ...data.items] })
            }

            // 대학 아이템 업데이트
            if (data.universityItems) {
              set({ universityItems: data.universityItems })
            }
          }
        } catch (error) {
          console.error("서버 동기화 오류:", error)
        }
      },
      // 아이템 목록을 직접 설정하는 함수
      setItems: (items) => set({ items }),
      // 대학별 아이템 설정 함수
      setUniversityItems: (items) => set({ universityItems: items }),
      // 서버 아이템과 병합 함수
      mergeItems: (serverItems) => {
        set((state) => {
          // 기존 아이템 ID 맵 생성
          const existingItemMap = new Map(state.items.map((item) => [item.id, item]))

          // 서버 아이템 추가 또는 업데이트
          serverItems.forEach((serverItem) => {
            existingItemMap.set(serverItem.id, serverItem)
          })

          return { items: Array.from(existingItemMap.values()) }
        })
      },
    }),
    {
      name: "item-storage",
    },
  ),
)

