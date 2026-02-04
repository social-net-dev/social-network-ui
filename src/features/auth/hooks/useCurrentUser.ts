import { UsersAPI } from '@/lib/api/generated'
import { transformUserMe } from '@/lib/api/transforms'
import { useAuthStore } from '@/stores/authStore'

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore()

  return UsersAPI.useGetUsersMeUsersMeGet({
    query: {
      enabled: isAuthenticated,
      staleTime: 1000 * 60 * 10,
      select: (data: any) => transformUserMe(data.data || data)
    }
  })
}
