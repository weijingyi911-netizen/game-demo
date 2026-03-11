import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  merchantId: string
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  collapsed: boolean
  setMerchantId: (id: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: 'zh-CN' | 'en-US') => void
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      merchantId: '550e8400-e29b-41d4-a716-446655440000',
      theme: 'light',
      language: 'zh-CN',
      collapsed: false,
      setMerchantId: (id) => set({ merchantId: id }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: 'settings-storage',
    }
  )
)
