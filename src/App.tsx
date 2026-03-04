import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useE2EEStore } from '@/stores/e2eeStore';
import { AppLayout } from '@/features/shared/layouts/AppLayout';
import { GlobalLoading } from '@/components/ui/global-loading';
import { ProtectedRoute, PublicRoute, AdminRoute } from '@/components/auth';

// Auth pages — small, needed early
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OTPVerifyPage = lazy(() => import('@/features/auth/pages/OTPVerifyPage').then(m => ({ default: m.OTPVerifyPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));

// App pages — loaded on demand
const FeedPage = lazy(() => import('@/features/home/pages/FeedPage').then(m => ({ default: m.FeedPage })));
const ExplorePage = lazy(() => import('@/features/home/pages/ExplorePage').then(m => ({ default: m.ExplorePage })));
const RecommendationPage = lazy(() => import('@/features/recommendation/pages/RecommendationPage').then(m => ({ default: m.RecommendationPage })));
const GroupsPage = lazy(() => import('@/features/groups/pages/GroupsPage').then(m => ({ default: m.GroupsPage })));
const GroupDetailPage = lazy(() => import('@/features/groups/pages/GroupDetailPage').then(m => ({ default: m.GroupDetailPage })));
const MarketplacePage = lazy(() => import('@/features/marketplace/pages/MarketplacePage').then(m => ({ default: m.MarketplacePage })));
const SearchPage = lazy(() => import('@/features/search/pages/SearchPage').then(m => ({ default: m.SearchPage })));
const FieldDetailPage = lazy(() => import('@/features/fields/pages/FieldDetailPage').then(m => ({ default: m.FieldDetailPage })));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ProfileSettingsPage = lazy(() => import('@/features/profile/pages/ProfileSettingsPage').then(m => ({ default: m.ProfileSettingsPage })));
const ConversationPage = lazy(() => import('@/features/message/pages/ConversationPage').then(m => ({ default: m.ConversationPage })));
const FriendsListPage = lazy(() => import('@/features/friends/pages/FriendsListPage').then(m => ({ default: m.FriendsListPage })));
const FriendRequestsPage = lazy(() => import('@/features/friends/pages/FriendRequestsPage').then(m => ({ default: m.FriendRequestsPage })));
const AdminAccountsPage = lazy(() => import('@/features/admin/pages/AdminAccountsPage').then(m => ({ default: m.AdminAccountsPage })));
const AdminVerificationPage = lazy(() => import('@/features/admin/pages/VerificationPage').then(m => ({ default: m.AdminVerificationPage })));

function SuspenseLayout() {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <Outlet />
    </Suspense>
  );
}

function App() {
  const { isLoading, isAuthenticated, getUserId } = useAuthStore();
  const { initialize, isInitialized } = useE2EEStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isInitialized) {
      const userId = getUserId();
      if (userId) {
        initialize(userId).catch(() => {});
      }
    }
  }, [isLoading, isAuthenticated, isInitialized, getUserId, initialize]);

  if (isLoading) {
    return <GlobalLoading />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route element={<SuspenseLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OTPVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<SuspenseLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/fields/:fieldId" element={<FieldDetailPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/messages" element={<ConversationPage />} />
            <Route path="/messages/:conversationId" element={<ConversationPage />} />
            <Route path="/friends" element={<FriendsListPage />} />
            <Route path="/friends/requests" element={<FriendRequestsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/me" element={<Navigate to="/profile" replace />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/recommendations" element={<RecommendationPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route path="/settings" element={<ProfileSettingsPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin/accounts" element={<AdminAccountsPage />} />
              <Route path="/admin/verification" element={<AdminVerificationPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
