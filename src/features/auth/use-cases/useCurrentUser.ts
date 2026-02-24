import { useUsersGetMe } from '@/lib/api/generated/users/users'

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
