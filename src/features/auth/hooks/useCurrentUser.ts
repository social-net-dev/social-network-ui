import { useUser } from '@/lib/api/hooks/useUser'

export function useCurrentUser() {
  const { user, isLoading, isError, error, refetch } = useUser('me')
  
  return {
    data: user,
    isLoading,
    isError,
    error,
    refetch
  }
}
