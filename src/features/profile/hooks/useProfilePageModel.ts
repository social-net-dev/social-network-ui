import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useProfile } from './useProfile'
import type { User } from '@/lib/api/types'

export type ProfilePageMode = 'me' | 'other'

export type ProfilePageModel = {
  mode: ProfilePageMode
  profile: User | null
  isLoading: boolean
  error: unknown
  canEdit: boolean
  subjectUserId: string | null
  currentUserId: string | null
}

export function useProfilePageModel(): ProfilePageModel {
  const params = useParams()
  const { user: currentUser } = useAuthStore()
  const { profile: rawProfile, isLoading, error, isMe } = useProfile(params.userId)

  const profile = (rawProfile as User | undefined) ?? null

  const currentUserId = currentUser?.id ?? null
  const mode: ProfilePageMode = isMe ? 'me' : 'other'

  const subjectUserId = useMemo(() => {
    if (mode === 'me') return currentUserId
    return profile?.id ?? null
  }, [currentUserId, mode, profile?.id])

  const canEdit = mode === 'me'

  return {
    mode,
    profile,
    isLoading,
    error,
    canEdit,
    subjectUserId,
    currentUserId,
  }
}
