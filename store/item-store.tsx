import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Item } from "@/lib/types"

interface ItemState {
  items: Item[]
  addItem: (item: Item) => void
  updateItem: (item: Item) => void
  removeItem: (id: string) => void
  getMyItems: (userId: string) => Item[]
}

export const useItemStore = create<ItemState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
      updateItem: (updatedItem) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      getMyItems: (userId) => {
        return get().items.filter((item) => item.seller.id === userId)
      },
    }),
    {
      name: "item-storage",
    },
  ),
)

