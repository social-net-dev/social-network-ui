import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LoginPage, RegisterPage, OTPVerifyPage, ForgotPasswordPage } from '@/features/auth';
import { FeedPage } from '@/features/home/pages/FeedPage';
import { ExplorePage } from '@/features/home/pages/ExplorePage';
import { RecommendationPage } from '@/features/recommendation/pages/RecommendationPage';
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage';
import { GroupsPage } from '@/features/groups/pages/GroupsPage';
import { MarketplacePage } from '@/features/marketplace/pages/MarketplacePage';
import { SearchPage } from '@/features/search/pages/SearchPage';
import { ProfilePage, ProfileSettingsPage } from '@/features/profile/routes';
import { FieldDetailPage } from '@/features/fields/pages/FieldDetailPage';
import { AdminAccountsPage } from '@/features/admin/pages/AdminAccountsPage';
import { AdminVerificationPage } from '@/features/admin/pages/VerificationPage';
import { ConversationPage } from '@/features/message/routes';
import { FriendRequestsPage } from '@/features/friends/pages/FriendRequestsPage';
import { FriendsListPage } from '@/features/friends/pages/FriendsListPage';
import { useAuthStore } from '@/stores/authStore';
import { useE2EEStore } from '@/stores/e2eeStore';
import { AppLayout } from '@/features/shared/layouts/AppLayout';
import { GlobalLoading } from '@/components/ui/global-loading';
import { ProtectedRoute, PublicRoute, AdminRoute } from '@/components/auth';

function App() {
  const { isLoading, isAuthenticated, getUserId } = useAuthStore();
  const { initialize, isInitialized } = useE2EEStore();

  // Initialize E2EE when app mounts and user is authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isInitialized) {
      const userId = getUserId();
      if (userId) {
        console.log('[App] 🔐 Auto-initializing E2EE for logged-in user:', userId);
        initialize(userId).catch(error => {
          console.error('[App] ❌ E2EE auto-initialization failed:', error);
        });
      }
    }
  }, [isLoading, isAuthenticated, isInitialized, getUserId, initialize]);

  if (isLoading) {
    return <GlobalLoading />;
  }

  return (
    <>
      <Routes>
        {/* Public Routes - Only accessible when NOT logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OTPVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected Routes - Only accessible when logged in */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/fields/:fieldId" element={<FieldDetailPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />

            {/* Message routes */}
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

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/accounts" element={<AdminAccountsPage />} />
              <Route path="/admin/verification" element={<AdminVerificationPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
