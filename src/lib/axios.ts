import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (matching the key used in authStore)
    const token = localStorage.getItem('auth_token')
    if (token) {
      // Remove quotes if they exist (sometimes persist middleware adds them)
      const cleanToken = token.replace(/"/g, '')
      config.headers.Authorization = `Bearer ${cleanToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., clear storage, redirect to login)
      // We'll let the component/store handle the redirect for now
      // but we could clear local storage here if needed
      // localStorage.removeItem('auth_token')
    }
    return Promise.reject(error)
  }
)

export default api
