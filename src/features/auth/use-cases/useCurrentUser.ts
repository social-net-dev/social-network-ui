import { useUsersGetMe } from '@/lib/api/hooks/users.hooks'

export function useCurrentUser() {
  const { data, isLoading, isError, error, refetch } = useUsersGetMe()
  
  return {
    data,
    isLoading,
    isError,
    error,
    refetch
  }
}
