import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import type { EditProfileFormData } from '../types/profile.types'
import { useAuthStore } from '@/stores/authStore'
import {
  getUsersGetMeQueryKey,
  useUsersUploadAvatar,
  useUsersUploadBackground,
  useUsersGetMe,
  useUsersUpdatePrivacy,
  useUsersUpdateProfile,
} from '@/lib/api/generated/users/users'
import { useProfilesGetProfile, getProfilesGetProfileQueryKey } from '@/lib/api/generated/profiles/profiles'
import type { User } from '@/lib/api/generated/model'
import { PrivacyField } from '@/lib/api/generated/model/privacyField'
import type {
  PrivacyOverride,
  MediaInitUpload201,
  PresignedUploadCompleteRequest,
  PresignedUploadInitRequest,
  PresignedUploadInitResponse,
  UpdatePrivacyRequest,
  Visibility,
} from '@/lib/api/generated/model'
import {
  useMediaCompleteUpload,
  useMediaInitUpload,
} from '@/lib/api/generated/media/media'

export function useProfile(userIdParam?: string) {
  const params = useParams()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  let identifier = userIdParam || params.userId

  if (!identifier && isAuthenticated) {
    identifier = 'me'
  }

  if (identifier && currentUser?.username && identifier === currentUser.username) {
    identifier = 'me'
  }

  const isMe = identifier === 'me'

  const meQuery = useUsersGetMe({
    query: {
      enabled: isMe && isAuthenticated,
      staleTime: 1000 * 60 * 5,
      select: (resp): User => resp.data as User,
    },
  })

  const profileQuery = useProfilesGetProfile(String(identifier ?? ''), {
    query: {
      enabled: !isMe && !!identifier,
      select: (resp): User => resp.data as User,
    },
  })

  const query = isMe ? meQuery : profileQuery

  const updateProfileMutation = useUsersUpdateProfile()
  const updatePrivacyMutation = useUsersUpdatePrivacy()
  const uploadAvatarMutation = useUsersUploadAvatar()
  const uploadBackgroundMutation = useUsersUploadBackground()
  const initUploadMutation = useMediaInitUpload()
  const completeUploadMutation = useMediaCompleteUpload()

  const uploadFileToPresigned = async (init: {
    upload_url: string
    method: 'PUT' | 'POST'
    headers?: Array<{ name: string; value: string }>
  }, file: File) => {
    const headers = new Headers()
    for (const h of init.headers ?? []) {
      headers.set(h.name, h.value)
    }

    if (!headers.has('Content-Type') && file.type) {
      headers.set('Content-Type', file.type)
    }

    const resp = await fetch(init.upload_url, {
      method: init.method,
      headers,
      body: file,
    })

    if (!resp.ok) {
      throw new Error(`Upload failed: ${resp.status}`)
    }

    return resp.headers.get('etag') ?? resp.headers.get('ETag') ?? undefined
  }

  const uploadMediaAsset = async (
    purpose: PresignedUploadInitRequest['purpose'],
    file: File,
  ) => {
    const initReq: PresignedUploadInitRequest = {
      filename: file.name,
      content_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      purpose,
      access: 'public',
    }

    const initResp = await initUploadMutation.mutateAsync({ data: initReq })
    const init = (initResp as MediaInitUpload201).data as PresignedUploadInitResponse

    const etag = await uploadFileToPresigned(init, file)

    const completeReq: PresignedUploadCompleteRequest = {
      etag: etag || undefined,
      size_bytes: file.size,
    }
    await completeUploadMutation.mutateAsync({ uploadId: init.upload_id, data: completeReq })

    return init.asset_id
  }

  const handleUpdateProfile = async (data: EditProfileFormData) => {
    const res = await updateProfileMutation.mutateAsync({
      data: {
        display_name: data.displayName,
        username: data.username || undefined,
        birth_date: data.birthDate && data.birthDate.trim() !== '' ? data.birthDate : undefined,
        bio: data.bio,
      },
    })

    queryClient.invalidateQueries({ queryKey: getUsersGetMeQueryKey() })
    if (!isMe && identifier) {
      queryClient.invalidateQueries({ queryKey: getProfilesGetProfileQueryKey(String(identifier)) })
    }
    return res
  }

  const handleUpdatePrivacy = async (
    data: Partial<Record<string, Visibility>>,
  ) => {
    const validPrivacyFields = Object.values(PrivacyField) as string[];
    const overrides: PrivacyOverride[] = Object.entries(data ?? {})
      .filter(([key, visibility]) => key.endsWith('_visibility') && !!visibility)
      .map(([key, visibility]) => {
        const fieldKey = key.replace(/_visibility$/, '')
        if (!validPrivacyFields.includes(fieldKey) || !visibility) return null
        return { field: fieldKey as PrivacyOverride['field'], visibility } as PrivacyOverride
      })
      .filter((x): x is PrivacyOverride => !!x)

    const payload: UpdatePrivacyRequest = {
      overrides,
    }

    const res = await updatePrivacyMutation.mutateAsync({
      data: {
        ...payload,
      },
    })

    queryClient.invalidateQueries({ queryKey: getUsersGetMeQueryKey() })
    return res
  }

  const handleUploadAvatar = async (file: File) => {
    const assetId = await uploadMediaAsset('avatar', file)
    const res = await uploadAvatarMutation.mutateAsync({ data: { asset_id: assetId } })
    queryClient.invalidateQueries({ queryKey: getUsersGetMeQueryKey() })
    return res
  }

  const handleUploadBackground = async (file: File) => {
    const assetId = await uploadMediaAsset('background', file)
    const res = await uploadBackgroundMutation.mutateAsync({ data: { asset_id: assetId } })
    queryClient.invalidateQueries({ queryKey: getUsersGetMeQueryKey() })
    return res
  }

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isMe,
    updateProfile: handleUpdateProfile,
    updatePrivacy: handleUpdatePrivacy,
    uploadAvatar: handleUploadAvatar,
    uploadBackground: handleUploadBackground,
    isUpdating:
      updateProfileMutation.isPending ||
      updatePrivacyMutation.isPending ||
      uploadAvatarMutation.isPending ||
      uploadBackgroundMutation.isPending ||
      initUploadMutation.isPending ||
      completeUploadMutation.isPending,
  }
}
