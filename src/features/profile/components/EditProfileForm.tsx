import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Upload } from 'lucide-react'
import type { EditProfileFormData, ProfileData } from '../types/profile.types'
import { EditProfileFormDataSchema } from '../types/profile.types'

interface EditProfileFormProps {
  profile: ProfileData
  onSubmit: (data: EditProfileFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function EditProfileForm({ profile, onSubmit, onCancel, isLoading = false }: EditProfileFormProps) {
  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(EditProfileFormDataSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio || '',
      avatar: profile.avatar || '',
    },
  })

  const avatarValue = useWatch({ control: form.control, name: 'avatar' })

  const handleSubmit = async (data: EditProfileFormData) => {
    await onSubmit(data)
  }

  return (
    <div className="bg-white dark:bg-[#0A2737] rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chỉnh sửa hồ sơ</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="avatar">Ảnh đại diện</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {avatarValue ? (
                <img src={avatarValue} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Upload className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Input
                {...form.register('avatar')}
                placeholder="URL ảnh đại diện"
                className="mb-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nhập URL hình ảnh hoặc tải ảnh lên (mock)
              </p>
            </div>
          </div>
          {form.formState.errors.avatar && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.avatar.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Họ</Label>
            <Input
              {...form.register('firstName')}
              placeholder="Nguyễn"
              className="mt-2"
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Tên</Label>
            <Input
              {...form.register('lastName')}
              placeholder="Văn A"
              className="mt-2"
            />
            {form.formState.errors.lastName && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Giới thiệu</Label>
          <textarea
            {...form.register('bio')}
            placeholder="Giới thiệu bản thân..."
            className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0A2737] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1b7a78] focus:border-transparent resize-none"
            rows={4}
          />
          {form.formState.errors.bio && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.bio.message}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  )
}
