import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        const { data } = await api.post('/auth/login', { email, password })
        set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        return data
      },

      register: async (name, email, password, role) => {
        set({ isLoading: true })
        const { data } = await api.post('/auth/register', { name, email, password, role })
        set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        return data
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        delete api.defaults.headers.common['Authorization']
      },

      updateUser: (user) => set({ user }),

      refreshUser: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.user })
        } catch {
          get().logout()
        }
      },

      setTheme: async (theme) => {
        const { data } = await api.put('/auth/update-profile', { preferences: { theme } })
        set({ user: data.user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)

export default useAuthStore
