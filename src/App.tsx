import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RegisterPage, OTPVerifyPage, ForgotPasswordPage } from '@/features/auth/routes';
import { FeedPage } from '@/features/home/pages/FeedPage';
import { ExplorePage } from '@/features/home/pages/ExplorePage';
import { RecommendationPage } from '@/features/recommendation/pages/RecommendationPage';
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage';
import { GroupsPage } from '@/features/groups/pages/GroupsPage';
import { MarketplacePage } from '@/features/marketplace/pages/MarketplacePage';
import { SearchPage } from '@/features/search/pages/SearchPage';
import { ProfilePage, ProfileSettingsPage, PersonalProfilePage } from '@/features/profile/routes';
import { FieldDetailPage } from '@/features/fields/pages/FieldDetailPage';
import { AdminAccountsPage } from '@/features/admin/pages/AdminAccountsPage';
import { AdminVerificationPage } from '@/features/admin/pages/VerificationPage';
import { DevToolsPage } from '@/features/dev/pages/DevToolsPage';
import { ConversationPage } from '@/features/message/routes';
import { FriendRequestsPage } from '@/features/friends/pages/FriendRequestsPage';
import { FriendsListPage } from '@/features/friends/pages/FriendsListPage';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/features/shared/layouts/AppLayout';
import { GlobalLoading } from '@/components/ui/global-loading';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute, PublicRoute, AdminRoute } from '@/components/auth';

function App() {
  const { isLoading } = useAuthStore();

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

        {/* DevTools - accessible in development only */}
        {import.meta.env.DEV && <Route path="/devtools" element={<DevToolsPage />} />}

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
            <Route path="/me" element={<PersonalProfilePage />} />
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
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
