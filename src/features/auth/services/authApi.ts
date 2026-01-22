import api from '@/lib/axios'
import type { AuthResponse, LoginFormData, RegisterFormData } from '../types/auth.types'
import type { User } from '@/types'

export const authApi = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    // 1. Call login endpoint to get token
    // Backend expects x-www-form-urlencoded typically for OAuth2, but let's check if it accepts JSON
    // Checking main.py -> auth_router -> login. It uses OAuth2PasswordRequestForm which expects form data
    // But let's try JSON first as it's cleaner, if not we switch to FormData.
    // Wait, FastAPI OAuth2PasswordRequestForm strictly requires form data.
    
    const formData = new URLSearchParams()
    formData.append('username', data.email)
    formData.append('password', data.password)
    if (data.rememberMe) {
      formData.append('remember_me', 'true')
    }

    const tokenResponse = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const { access_token, refresh_token } = tokenResponse.data

    // 2. Save token temporarily to localStorage so the next request's interceptor can pick it up
    // Note: The store will also save this, but we need it immediately for the next call
    localStorage.setItem('auth_token', access_token)
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token)
    }

    // 3. Get current user profile
    const userResponse = await api.get<User>('/users/me')
    
    return {
      user: userResponse.data,
      token: access_token,
      refreshToken: refresh_token || '',
    }
  },

  register: async (data: RegisterFormData): Promise<User> => {
    // Backend expects: email, password, display_name (optional), phone (optional), consent
    // Frontend provides: firstName, lastName, email, password, acceptedTerms
    
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('display_name', `${data.firstName} ${data.lastName}`.trim())
    formData.append('consent', String(data.acceptedTerms))
    // phone is not in the form yet, optional

    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': null, // Force remove Content-Type to let browser set boundary
      },
    })
    return response.data
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    // Optionally call backend logout endpoint if it exists
    // await api.post('/auth/logout') 
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me')
    return response.data
  },
}
