import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { ProfileHeader } from '../components/ProfileHeader'
import { ProfileStats } from '../components/ProfileStats'
import { EditProfileForm } from '../components/EditProfileForm'
import { MainLayout } from '@/features/shared/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import type { EditProfileFormData } from '../types/profile.types'

function ProfilePage() {
  const { profile, isLoading, error, updateProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuthStore()

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b7a78]"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Lỗi</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {error instanceof Error ? error.message : 'Không tìm thấy hồ sơ'}
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Thử lại
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const isCurrentUser = user?.id === profile.id
  const stats = {
    posts: profile.postsCount,
    followers: profile.followers || 0,
    following: profile.following || 0,
  }

  const handleEditProfile = async (data: EditProfileFormData) => {
    try {
      setIsSaving(true)
      await updateProfile(data)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <EditProfileForm
            profile={profile}
            onSubmit={handleEditProfile}
            onCancel={() => setIsEditing(false)}
            isLoading={isSaving}
          />
        ) : (
          <>
            <ProfileHeader
              profile={profile}
              isCurrentUser={isCurrentUser}
              onEdit={() => isCurrentUser && setIsEditing(true)}
            />
            <div className="mt-6">
              <ProfileStats stats={stats} />
            </div>
            <div className="mt-6 bg-white dark:bg-[#0A2737] rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bài viết</h2>
              <p className="text-gray-500 dark:text-gray-400">Chưa có bài viết nào</p>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

export { ProfilePage }
