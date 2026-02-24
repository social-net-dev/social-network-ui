import { customHandlers } from './customHandlers';
import { getAuthMock } from '@/lib/api/generated/auth/auth.msw';
import { getCommentsMock } from '@/lib/api/generated/comments/comments.msw';
import { getFeedMock } from '@/lib/api/generated/feed/feed.msw';
import { getFriendsMock } from '@/lib/api/generated/friends/friends.msw';
import { getMediaMock } from '@/lib/api/generated/media/media.msw';
import { getNotificationsMock } from '@/lib/api/generated/notifications/notifications.msw';
import { getPostsMock } from '@/lib/api/generated/posts/posts.msw';
import { getProfilesMock } from '@/lib/api/generated/profiles/profiles.msw';
import { getReactionsMock } from '@/lib/api/generated/reactions/reactions.msw';
import { getRecommendationsMock } from '@/lib/api/generated/recommendations/recommendations.msw';
import { getSearchMock } from '@/lib/api/generated/search/search.msw';
import { getSharesMock } from '@/lib/api/generated/shares/shares.msw';
import { getUsersMock } from '@/lib/api/generated/users/users.msw';

export const handlers = [
  ...customHandlers,
  ...getAuthMock(),
  ...getCommentsMock(),
  ...getFeedMock(),
  ...getFriendsMock(),
  ...getMediaMock(),
  ...getNotificationsMock(),
  ...getPostsMock(),
  ...getProfilesMock(),
  ...getReactionsMock(),
  ...getRecommendationsMock(),
  ...getSearchMock(),
  ...getSharesMock(),
  ...getUsersMock(),
];
