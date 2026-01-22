import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/authApi'
import { RegisterFormDataSchema, type RegisterFormData } from '../types/auth.types'

export function useRegister() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterFormDataSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      acceptedTerms: false,
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null)
      await authApi.register(data)
      setIsSuccess(true)
      // Redirect to login instead of auto-login
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
      setIsSuccess(false)
    }
  }

  return {
    form,
    onSubmit,
    error,
    isSuccess,
    isLoading: form.formState.isSubmitting,
  }
}
