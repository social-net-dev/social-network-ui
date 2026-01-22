import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, RegisterPage } from '@/features/auth/routes'
import { FeedPage } from '@/features/home/pages/FeedPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { useAuthStore } from '@/stores/authStore'

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={isLoading ? null : isAuthenticated ? <FeedPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={isLoading ? null : isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile/:userId"
        element={isLoading ? null : isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
