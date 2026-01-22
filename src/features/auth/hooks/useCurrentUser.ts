import { useQuery } from '@tanstack/react-query'
import { authApi } from '../services/authApi'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/stores/authStore'

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  })
}
