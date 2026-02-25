import { delay, HttpResponse, http } from 'msw';
import type {
  AuthLogin200,
  Comment,
  CommentsCreateComment201,
  CommentsDeleteComment200,
  CommentsReplyToComment201,
  CommentsUpdateComment200,
  CreateCommentRequest,
  FeedGetFeed200,
  FriendshipStatus,
  LoginRequest,
  PostSummary,
  PostsGetPostComments200,
  UpdateCommentRequest,
  UserPublic,
  UsersGetMe200,
  UserMe,
} from '@/lib/api/generated/model';
import { PrivacyField } from '@/lib/api/generated/model/privacyField';

const now = new Date();

const studentUser: UserMe = {
  id: 'usr_student_001',
  username: 'hiru.dev',
  displayName: 'Hiru Nguyễn',
  email: 'hiru@example.com',
  avatar: 'https://i.pravatar.cc/160?img=12',
  background: null,
  bio: 'Full-stack developer passionate về TypeScript, React và system design. Đang học AI/ML.',
  birthDate: '2000-05-15',
  accountStatus: 'ACTIVE',
  role: 'USER',
  createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 280).toISOString(),
  followers: 128,
  following: 87,
  postsCount: 42,
  personalInfo: {
    educationLevel: 'university',
    school: 'Đại học Bách Khoa Hà Nội',
    major: 'Khoa học máy tính',
    class: 'K65-CS1',
    academicYear: '2023-2024',
    graduationYear: '2024',
    favoriteSubjects: ['Software Engineering', 'AI & Machine Learning', 'Cloud & DevOps'],
    hobbies: ['Coding', 'Reading tech blogs', 'Gaming', 'Photography'],
    location: 'Hà Nội, Việt Nam',
    projects: [
      {
        id: 'proj_001',
        title: 'Social Network Platform',
        category: 'Web Development',
        description: 'Nền tảng mạng xã hội với TypeSpec contract-first architecture, React, và MSW cho testing.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        sourceLink: 'https://github.com/hiru/social-network',
      },
      {
        id: 'proj_002',
        title: 'AI Chat Assistant',
        category: 'AI/ML',
        description: 'Chatbot thông minh sử dụng RAG và LangChain để trả lời câu hỏi về tài liệu kỹ thuật.',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
        sourceLink: 'https://github.com/hiru/ai-chat',
      },
    ],
  },
};

const adminUser: UserMe = {
  id: 'usr_admin_001',
  username: 'admin.etechs',
  displayName: 'Etechs Admin',
  email: 'admin@etechs.vn',
  avatar: 'https://i.pravatar.cc/160?img=50',
  background: null,
  bio: 'Platform administrator. Hỗ trợ cộng đồng và quản lý hệ thống.',
  birthDate: '1995-03-20',
  accountStatus: 'ACTIVE',
  role: 'ADMIN',
  createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 640).toISOString(),
  followers: 502,
  following: 16,
  postsCount: 8,
  personalInfo: {
    educationLevel: 'university',
    school: 'Đại học Công nghệ',
    major: 'Hệ thống thông tin',
    degree: 'Thạc sĩ',
    graduationYear: '2019',
    favoriteSubjects: ['System Architecture', 'Database Design', 'Security'],
    hobbies: ['Community building', 'Mentoring', 'Tech events'],
    location: 'Hà Nội, Việt Nam',
  },
};

let activeUser: UserMe = studentUser;

const commentAuthors = {
  mentor: {
    id: 'usr_mentor_001',
    displayName: 'Mentor Hoàng',
    username: 'mentor.hoang',
    avatar: 'https://i.pravatar.cc/160?img=65',
    role: 'INSTRUCTOR',
    accountStatus: 'VERIFIED',
  },
  student: {
    id: 'usr_student_001',
    displayName: 'Hiru Nguyễn',
    username: 'hiru.dev',
    avatar: 'https://i.pravatar.cc/160?img=12',
    role: 'STUDENT',
    accountStatus: 'VERIFIED',
  },
  peer: {
    id: 'usr_peer_001',
    displayName: 'Linh Trần',
    username: 'linh.ui',
    avatar: 'https://i.pravatar.cc/160?img=31',
    role: 'STUDENT',
    accountStatus: 'VERIFIED',
  },
} as const;

const allFeedPosts: PostSummary[] = [
  {
    id: 'post_001',
    author: {
      id: 'usr_student_001',
      displayName: 'Hiru Nguyễn',
      username: 'hiru.dev',
      avatar: 'https://i.pravatar.cc/160?img=12',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content:
      'Vừa hoàn thành luồng contract-first với TypeSpec + Orval + MSW. Dev experience mượt hơn hẳn 🔥',
    mediaUrls: [],
    stats: {
      reactions: 26,
      comments: 9,
      shares: 2,
    },
    userReaction: 'LIKE',
    visibility: 'PUBLIC',
    postType: 'SOCIAL',
    fieldId: 'software-engineering',
    createdAt: new Date(now.getTime() - 1000 * 60 * 22).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'post_002',
    author: {
      id: 'usr_design_001',
      displayName: 'Linh Trần',
      username: 'linh.ui',
      avatar: 'https://i.pravatar.cc/160?img=31',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'Case study mới: cải thiện onboarding từ 41% lên 68% bằng progressive disclosure.',
    mediaUrls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200'],
    stats: {
      reactions: 41,
      comments: 14,
      shares: 6,
    },
    userReaction: null,
    visibility: 'PUBLIC',
    postType: 'SOCIAL',
    fieldId: 'product-design',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'post_003',
    author: {
      id: 'usr_data_001',
      displayName: 'Phúc Lê',
      username: 'phucle.ai',
      avatar: 'https://i.pravatar.cc/160?img=19',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'Anh em cần tài liệu học RAG cho production không? Mình tổng hợp 1 checklist thực chiến rồi.',
    mediaUrls: [],
    stats: {
      reactions: 33,
      comments: 17,
      shares: 4,
    },
    userReaction: 'LOVE',
    visibility: 'PUBLIC',
    postType: 'QUESTION',
    fieldId: 'ai-ml',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'post_004',
    author: {
      id: 'usr_ops_001',
      displayName: 'An Vũ',
      username: 'an.devops',
      avatar: 'https://i.pravatar.cc/160?img=21',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'Bên mình đang tuyển Fresher DevOps intern (HCM, hybrid). Có mentor 1-1 và budget học cert.',
    mediaUrls: [],
    stats: {
      reactions: 12,
      comments: 5,
      shares: 10,
    },
    userReaction: null,
    visibility: 'PUBLIC',
    postType: 'JOB',
    fieldId: 'cloud-devops',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'post_005',
    author: {
      id: 'usr_pm_001',
      displayName: 'Mai Nguyễn',
      username: 'mai.pm',
      avatar: 'https://i.pravatar.cc/160?img=44',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'Weekly learning: 5 anti-pattern phổ biến khi scale micro-frontend và cách tránh.',
    mediaUrls: [],
    stats: {
      reactions: 18,
      comments: 7,
      shares: 3,
    },
    userReaction: 'WOW',
    visibility: 'PUBLIC',
    postType: 'SOCIAL',
    fieldId: 'frontend-architecture',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 11).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 'post_006',
    author: {
      id: 'usr_backend_001',
      displayName: 'Duy Phạm',
      username: 'duy.backend',
      avatar: 'https://i.pravatar.cc/160?img=7',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'So sánh 3 chiến lược cache invalidation cho social feed ở quy mô 100k DAU.',
    mediaUrls: [],
    stats: {
      reactions: 24,
      comments: 11,
      shares: 5,
    },
    userReaction: null,
    visibility: 'PUBLIC',
    postType: 'QUESTION',
    fieldId: 'backend',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 19).toISOString(),
  },
];

const profileSeeds: Record<string, UserPublic> = {
  'linh.ui': {
    id: 'usr_peer_001',
    username: 'linh.ui',
    displayName: 'Linh Trần',
    bio: 'Product designer tập trung vào trải nghiệm học tập và cộng đồng. Mê design systems và storytelling.',
    personalInfo: {
      school: 'Đại học Mỹ thuật Công nghiệp',
      major: 'Thiết kế sản phẩm số',
      academicYear: '2024',
      favoriteSubjects: ['Design Systems', 'UX Research', 'Motion'],
      hobbies: ['Sketching', 'Coffee brewing', 'Trail running'],
      location: 'TP.HCM, Việt Nam',
      projects: [
        {
          id: 'proj_linh_onboarding',
          title: 'Onboarding 2.0 Experience',
          category: 'Product Design',
          description: 'Thiết kế onboarding đa bước giúp tăng completion rate +41% cho app học online.',
          imageUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=800',
          sourceLink: 'https://dribbble.com/shots/linh-onboarding',
        },
      ],
    },
    birthDate: '1998-07-12',
    avatar: 'https://i.pravatar.cc/160?img=31',
    background: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
    accountStatus: 'ACTIVE',
    role: 'USER',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 620).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    followers: 1840,
    following: 326,
    postsCount: 72,
    viewer_context: { is_owner: false, is_friend: true },
    redacted_fields: [],
    friendshipStatus: 'FRIENDS',
    friendRequestId: null,
  },
  'duy.backend': {
    id: 'usr_backend_001',
    username: 'duy.backend',
    displayName: 'Duy Phạm',
    bio: 'Backend engineer @ScaleFlow. Nghĩ nhiều về caching, observability và resiliency.',
    personalInfo: undefined,
    birthDate: null,
    avatar: 'https://i.pravatar.cc/160?img=7',
    background: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200',
    accountStatus: 'ACTIVE',
    role: 'USER',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 780).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
    followers: 980,
    following: 210,
    postsCount: 54,
    viewer_context: { is_owner: false, is_friend: false },
    redacted_fields: [PrivacyField.personal_info, PrivacyField.birth_date],
    friendshipStatus: 'NONE',
    friendRequestId: null,
  },
};

const friendshipScenarioByUserId: Record<string, { detail: FriendshipStatus; label: 'FRIENDS' | 'NONE' | 'REQUEST_SENT' | 'REQUEST_RECEIVED'; friendRequestId?: string | null }> = {
  usr_peer_001: { detail: { is_friend: true }, label: 'FRIENDS', friendRequestId: null },
  usr_backend_001: { detail: { is_friend: false }, label: 'NONE', friendRequestId: null },
};

const getFriendshipScenario = (userId: string) =>
  friendshipScenarioByUserId[userId] ?? { detail: { is_friend: false }, label: 'NONE', friendRequestId: null };

const cloneProfileSeed = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const userMeToPublic = (user: UserMe): UserPublic => {
  const publicProfile: UserPublic = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    personalInfo: user.personalInfo,
    birthDate: user.birthDate ?? null,
    avatar: user.avatar ?? null,
    background: user.background ?? null,
    accountStatus: user.accountStatus,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    followers: user.followers,
    following: user.following,
    postsCount: user.postsCount,
    viewer_context: { is_owner: true, is_friend: true },
    redacted_fields: [],
    friendshipStatus: 'SELF',
    friendRequestId: null,
  };

  (publicProfile as UserPublic & { isFriend?: boolean }).isFriend = true;

  return publicProfile;
};

const buildProfileForViewer = (username: string): UserPublic | null => {
  const normalized = username?.toLowerCase().trim();
  if (!normalized) {
    return null;
  }

  if (normalized === activeUser.username.toLowerCase()) {
    return userMeToPublic(activeUser);
  }

  const seed = profileSeeds[normalized];
  if (!seed) {
    return null;
  }

  const profile = cloneProfileSeed(seed);
  const scenario = getFriendshipScenario(profile.id);

  profile.viewer_context = {
    is_owner: false,
    is_friend: scenario.detail.is_friend,
  };
  profile.friendshipStatus = scenario.label;
  profile.friendRequestId = scenario.friendRequestId ?? null;
  (profile as UserPublic & { isFriend?: boolean }).isFriend = scenario.detail.is_friend;

  if (!scenario.detail.is_friend) {
    const redacted = new Set(profile.redacted_fields ?? []);
    redacted.add(PrivacyField.personal_info);
    redacted.add(PrivacyField.birth_date);
    profile.redacted_fields = Array.from(redacted);
    profile.personalInfo = undefined;
    profile.birthDate = null;
  } else {
    profile.redacted_fields = profile.redacted_fields ?? [];
  }

  return profile;
};

// Field data for comprehensive seeding
const allFields = [
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    hashtag: '#SoftwareEngineering',
    description: 'Khám phá các phương pháp lập trình, kiến trúc phần mềm, và best practices trong phát triển phần mềm.',
    bannerUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    stats: { postsCount: 156, followersCount: 2847 },
    isFollowing: false,
  },
  {
    id: 'product-design',
    name: 'Product Design',
    hashtag: '#ProductDesign',
    description: 'UI/UX design, design systems, user research và product thinking cho digital products.',
    bannerUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=400',
    stats: { postsCount: 89, followersCount: 1923 },
    isFollowing: true,
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    hashtag: '#AIMachineLearning',
    description: 'Deep learning, NLP, computer vision và các ứng dụng AI trong thực tế.',
    bannerUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    stats: { postsCount: 234, followersCount: 3567 },
    isFollowing: false,
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    hashtag: '#CloudDevOps',
    description: 'Cloud architecture, CI/CD, Kubernetes và DevOps practices.',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    stats: { postsCount: 178, followersCount: 2145 },
    isFollowing: true,
  },
  {
    id: 'frontend-architecture',
    name: 'Frontend Architecture',
    hashtag: '#FrontendArchitecture',
    description: 'Modern frontend patterns, micro-frontends, performance optimization và scalability.',
    bannerUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400',
    stats: { postsCount: 92, followersCount: 1567 },
    isFollowing: false,
  },
  {
    id: 'backend',
    name: 'Backend Development',
    hashtag: '#BackendDevelopment',
    description: 'API design, database architecture, microservices và backend optimization.',
    bannerUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
    stats: { postsCount: 145, followersCount: 2341 },
    isFollowing: true,
  },
  {
    id: 'mobile-development',
    name: 'Mobile Development',
    hashtag: '#MobileDevelopment',
    description: 'iOS, Android, React Native, Flutter và mobile app development.',
    bannerUrl: 'https://images.unsplash.com/photo-1512941937609-7625e61fe288?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1512941937609-7625e61fe288?w=400',
    stats: { postsCount: 67, followersCount: 1234 },
    isFollowing: false,
  },
  {
    id: 'data-science',
    name: 'Data Science',
    hashtag: '#DataScience',
    description: 'Data analysis, visualization, statistics và business intelligence.',
    bannerUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    stats: { postsCount: 198, followersCount: 2890 },
    isFollowing: true,
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    hashtag: '#Cybersecurity',
    description: 'Network security, ethical hacking, cryptography và security best practices.',
    bannerUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    stats: { postsCount: 112, followersCount: 1678 },
    isFollowing: false,
  },
  {
    id: 'blockchain',
    name: 'Blockchain & Web3',
    hashtag: '#BlockchainWeb3',
    description: 'Cryptocurrency, smart contracts, DeFi và Web3 development.',
    bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200',
    avatarUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
    stats: { postsCount: 78, followersCount: 1456 },
    isFollowing: false,
  },
];

// Groups data for comprehensive seeding
const allGroups = [
  {
    id: 'react-vietnam',
    name: 'React Vietnam Community',
    description: 'Cộng đồng React developers Việt Nam. Chia sẻ kiến thức, kinh nghiệm và best practices về React, Next.js và ecosystem.',
    avatarUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
    stats: { membersCount: 3421, postsCount: 892, onlineCount: 156 },
    isJoined: true,
    tags: ['React', 'Next.js', 'JavaScript', 'Frontend'],
    type: 'PUBLIC',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365).toISOString(),
  },
  {
    id: 'ai-ml-vietnam',
    name: 'AI/ML Vietnam',
    description: 'Nhóm nghiên cứu và ứng dụng AI/ML tại Việt Nam. Deep learning, NLP, computer vision và các dự án thực tế.',
    avatarUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
    stats: { membersCount: 2856, postsCount: 1234, onlineCount: 89 },
    isJoined: false,
    tags: ['AI', 'Machine Learning', 'Deep Learning', 'Python'],
    type: 'PUBLIC',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 400).toISOString(),
  },
  {
    id: 'devops-vn',
    name: 'DevOps Vietnam',
    description: 'Cộng đồng DevOps Việt Nam. Chia sẻ về CI/CD, Kubernetes, Cloud architecture và monitoring.',
    avatarUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    stats: { membersCount: 1923, postsCount: 567, onlineCount: 67 },
    isJoined: true,
    tags: ['DevOps', 'Kubernetes', 'Docker', 'AWS'],
    type: 'PUBLIC',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 280).toISOString(),
  },
  {
    id: 'ux-design-vn',
    name: 'UX/UI Design Vietnam',
    description: 'Cộng đồng designer Việt Nam. UI/UX design, design systems, user research và product design.',
    avatarUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=1200',
    stats: { membersCount: 2678, postsCount: 445, onlineCount: 98 },
    isJoined: false,
    tags: ['UI/UX', 'Design', 'Figma', 'Research'],
    type: 'PUBLIC',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 320).toISOString(),
  },
  {
    id: 'mobile-dev-vn',
    name: 'Mobile Dev Vietnam',
    description: 'Cộng đồng mobile developers Việt Nam. iOS, Android, React Native, Flutter development.',
    avatarUrl: 'https://images.unsplash.com/photo-1512941937609-7625e61fe288?w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1512941937609-7625e61fe288?w=1200',
    stats: { membersCount: 1543, postsCount: 234, onlineCount: 45 },
    isJoined: false,
    tags: ['iOS', 'Android', 'React Native', 'Flutter'],
    type: 'PUBLIC',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 200).toISOString(),
  },
  {
    id: 'backend-vietnam',
    name: 'Backend Vietnam',
    description: 'Cộng đồng backend developers Việt Nam. API design, database, microservices và system architecture.',
    avatarUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200',
    stats: { membersCount: 2234, postsCount: 678, onlineCount: 112 },
    isJoined: true,
    tags: ['Backend', 'API', 'Database', 'Microservices'],
    type: 'PUBLIC',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 450).toISOString(),
  },
];

// Marketplace data for comprehensive seeding
const allMarketplaceItems = [
  {
    id: 'course-react-advanced',
    title: 'React Advanced Patterns',
    description: 'Khóa học chuyên sâu về React patterns, performance optimization và architecture best practices.',
    price: 2990000,
    type: 'COURSE',
    category: 'Frontend Development',
    seller: {
      id: 'usr_mentor_001',
      name: 'Mentor Hoàng',
      avatar: 'https://i.pravatar.cc/160?img=65',
      rating: 4.8,
      reviewsCount: 234,
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    tags: ['React', 'JavaScript', 'Frontend'],
    stats: { studentsCount: 1234, rating: 4.8, reviewsCount: 156 },
    isPurchased: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 'book-system-design',
    title: 'System Design Interview Guide',
    description: 'Ebook toàn tập về system design cho phỏng vấn kỹ thuật tại các công ty công nghệ.',
    price: 499000,
    type: 'EBOOK',
    category: 'Career Development',
    seller: {
      id: 'usr_backend_001',
      name: 'Duy Phạm',
      avatar: 'https://i.pravatar.cc/160?img=7',
      rating: 4.6,
      reviewsCount: 89,
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
    tags: ['System Design', 'Interview', 'Backend'],
    stats: { studentsCount: 892, rating: 4.6, reviewsCount: 78 },
    isPurchased: true,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
  {
    id: 'service-code-review',
    title: 'Code Review Service',
    description: 'Dịch vụ review code chuyên sâu cho frontend projects. Feedback chi tiết và best practices.',
    price: 500000,
    type: 'SERVICE',
    category: 'Code Review',
    seller: {
      id: 'usr_design_001',
      name: 'Linh Trần',
      avatar: 'https://i.pravatar.cc/160?img=31',
      rating: 4.9,
      reviewsCount: 67,
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=400',
    tags: ['Code Review', 'Frontend', 'Mentoring'],
    stats: { studentsCount: 234, rating: 4.9, reviewsCount: 45 },
    isPurchased: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'template-ui-kit',
    title: 'Modern UI Kit Template',
    description: 'Bộ UI components template với React, TypeScript, Tailwind CSS. Production-ready.',
    price: 1290000,
    type: 'TEMPLATE',
    category: 'UI/UX Design',
    seller: {
      id: 'usr_pm_001',
      name: 'Mai Nguyễn',
      avatar: 'https://i.pravatar.cc/160?img=44',
      rating: 4.7,
      reviewsCount: 123,
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400',
    tags: ['UI Kit', 'React', 'TypeScript'],
    stats: { studentsCount: 567, rating: 4.7, reviewsCount: 89 },
    isPurchased: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: 'workshop-devops',
    title: 'DevOps Hands-on Workshop',
    description: 'Workshop thực chiến về CI/CD, Docker, Kubernetes. Build và deploy production apps.',
    price: 1890000,
    type: 'WORKSHOP',
    category: 'DevOps',
    seller: {
      id: 'usr_ops_001',
      name: 'An Vũ',
      avatar: 'https://i.pravatar.cc/160?img=21',
      rating: 4.8,
      reviewsCount: 156,
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    tags: ['DevOps', 'Docker', 'Kubernetes'],
    stats: { studentsCount: 445, rating: 4.8, reviewsCount: 67 },
    isPurchased: true,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
];

// Friends data for comprehensive seeding
const allFriends = [
  {
    id: 'friend_001',
    user: {
      id: 'usr_mentor_001',
      displayName: 'Mentor Hoàng',
      username: 'mentor.hoang',
      avatar: 'https://i.pravatar.cc/160?img=65',
      role: 'INSTRUCTOR',
      accountStatus: 'VERIFIED',
    },
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120).toISOString(),
  },
  {
    id: 'friend_002',
    user: {
      id: 'usr_peer_001',
      displayName: 'Linh Trần',
      username: 'linh.ui',
      avatar: 'https://i.pravatar.cc/160?img=31',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    id: 'friend_003',
    user: {
      id: 'usr_data_001',
      displayName: 'Phúc Lê',
      username: 'phucle.ai',
      avatar: 'https://i.pravatar.cc/160?img=19',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
  {
    id: 'friend_004',
    user: {
      id: 'usr_ops_001',
      displayName: 'An Vũ',
      username: 'an.devops',
      avatar: 'https://i.pravatar.cc/160?img=21',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
];

const incomingFriendRequests = [
  {
    id: 'req_incoming_001',
    requester: {
      id: 'usr_backend_001',
      displayName: 'Duy Phạm',
      username: 'duy.backend',
      avatar: 'https://i.pravatar.cc/160?img=7',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    addressee: {
      id: 'usr_student_001',
      displayName: 'Hiru Nguyễn',
      username: 'hiru.dev',
      avatar: 'https://i.pravatar.cc/160?img=12',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    status: 'PENDING',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'req_incoming_002',
    requester: {
      id: 'usr_pm_001',
      displayName: 'Mai Nguyễn',
      username: 'mai.pm',
      avatar: 'https://i.pravatar.cc/160?img=44',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    addressee: {
      id: 'usr_student_001',
      displayName: 'Hiru Nguyễn',
      username: 'hiru.dev',
      avatar: 'https://i.pravatar.cc/160?img=12',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    status: 'PENDING',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

const outgoingFriendRequests = [
  {
    id: 'req_outgoing_001',
    requester: {
      id: 'usr_student_001',
      displayName: 'Hiru Nguyễn',
      username: 'hiru.dev',
      avatar: 'https://i.pravatar.cc/160?img=12',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    addressee: {
      id: 'usr_design_001',
      displayName: 'Linh Designer',
      username: 'linh.design',
      avatar: 'https://i.pravatar.cc/160?img=15',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    status: 'PENDING',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
];

// Messages and conversations data for comprehensive seeding
const allConversations = [
  {
    id: 'conv_001',
    type: 'DIRECT',
    name: 'Mentor Hoàng',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    other_user: {
      id: 'usr_mentor_001',
      displayName: 'Mentor Hoàng',
      username: 'mentor.hoang',
      avatar: 'https://i.pravatar.cc/160?img=65',
      role: 'INSTRUCTOR',
      accountStatus: 'VERIFIED',
    },
    last_message: {
      id: 'msg_001',
      sender_id: 'usr_mentor_001',
      created_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      snippet: 'Ok, để mình xem lại và feedback cho bạn nhé!',
    },
    unread: 2,
  },
  {
    id: 'conv_002',
    type: 'DIRECT',
    name: 'Linh Trần',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    other_user: {
      id: 'usr_peer_001',
      displayName: 'Linh Trần',
      username: 'linh.ui',
      avatar: 'https://i.pravatar.cc/160?img=31',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    last_message: {
      id: 'msg_002',
      sender_id: 'usr_student_001',
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      snippet: 'Cảm ơn bạn đã chia sẻ tài liệu!',
    },
    unread: 0,
  },
  {
    id: 'conv_003',
    type: 'GROUP',
    name: 'React Vietnam Team',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    last_message: {
      id: 'msg_003',
      sender_id: 'usr_data_001',
      created_at: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
      snippet: 'Anh em ơi, có ai biết khi nào React 19 release chính thức không?',
    },
    unread: 5,
  },
];

const allMessages = [
  {
    id: 'msg_001',
    room_id: 'conv_001',
    sender_id: 'usr_mentor_001',
    ciphertext: 'Ok, để mình xem lại và feedback cho bạn nhé!',
    created_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    attachment_urls: null,
    pinned: false,
    reactions: [],
  },
  {
    id: 'msg_002',
    room_id: 'conv_001',
    sender_id: 'usr_student_001',
    ciphertext: 'Dạ em gửi project qua cho mentor ạ',
    created_at: new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
    attachment_urls: ['https://example.com/project.zip'],
    pinned: false,
    reactions: [{ id: 'r_001', user_id: 'usr_mentor_001', emoji: '👍', created_at: new Date(now.getTime() - 1000 * 60 * 32).toISOString() }],
  },
  {
    id: 'msg_003',
    room_id: 'conv_002',
    sender_id: 'usr_student_001',
    ciphertext: 'Cảm ơn bạn đã chia sẻ tài liệu!',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    attachment_urls: null,
    pinned: false,
    reactions: [],
  },
  {
    id: 'msg_004',
    room_id: 'conv_002',
    sender_id: 'usr_peer_001',
    ciphertext: 'Không có gì, mong giúp được bạn nhiều hơn :)',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
    attachment_urls: null,
    pinned: false,
    reactions: [],
  },
  {
    id: 'msg_005',
    room_id: 'conv_003',
    sender_id: 'usr_data_001',
    ciphertext: 'Anh em ơi, có ai biết khi nào React 19 release chính thức không?',
    created_at: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
    attachment_urls: null,
    pinned: false,
    reactions: [],
  },
  {
    id: 'msg_006',
    room_id: 'conv_003',
    sender_id: 'usr_ops_001',
    ciphertext: 'Mình nghe nói là Q1 2025 này thôi',
    created_at: new Date(now.getTime() - 1000 * 60 * 20).toISOString(),
    attachment_urls: null,
    pinned: false,
    reactions: [{ id: 'r_002', user_id: 'usr_student_001', emoji: '🎉', created_at: new Date(now.getTime() - 1000 * 60 * 18).toISOString() }],
  },
];

// Notifications data for comprehensive seeding
const allNotifications = [
  {
    id: 'notif_001',
    type: 'like',
    title: 'Mentor Hoàng đã thích bài viết của bạn',
    message: '"Vừa hoàn thành luồng contract-first với TypeSpec + Orval + MSW..."',
    isRead: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
    avatar: 'https://i.pravatar.cc/160?img=65',
    postId: 'post_001',
    userId: 'usr_mentor_001',
    actionUrl: '/posts/post_001',
  },
  {
    id: 'notif_002',
    type: 'comment',
    title: 'Linh Trần đã bình luận về bài viết của bạn',
    message: 'Flow này sạch và dễ scale đó. Nhớ thêm case test cho refresh token nữa nhé.',
    isRead: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    avatar: 'https://i.pravatar.cc/160?img=31',
    postId: 'post_001',
    userId: 'usr_peer_001',
    actionUrl: '/posts/post_001',
  },
  {
    id: 'notif_003',
    type: 'follow',
    title: 'Phúc Lê đã theo dõi bạn',
    message: 'Hãy xem profile của Phúc để biết thêm thông tin!',
    isRead: true,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    avatar: 'https://i.pravatar.cc/160?img=19',
    userId: 'usr_data_001',
    actionUrl: '/profile/phucle.ai',
  },
  {
    id: 'notif_004',
    type: 'mention',
    title: 'An Vũ đã đề cập đến bạn trong một bình luận',
    message: '@hiru.dev bạn có kinh nghiệm với Kubernetes không?',
    isRead: true,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
    avatar: 'https://i.pravatar.cc/160?img=21',
    postId: 'post_004',
    userId: 'usr_ops_001',
    actionUrl: '/posts/post_004',
  },
  {
    id: 'notif_005',
    type: 'system',
    title: 'Chào mừng đến với Etechs Social Network!',
    message: 'Hoàn thành profile của bạn để kết nối với cộng đồng dễ dàng hơn.',
    isRead: true,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    avatar: undefined,
    actionUrl: '/settings',
  },
  {
    id: 'notif_006',
    type: 'like',
    title: 'Duy Phạm đã thích bình luận của bạn',
    message: '"Dạ em đang thêm luôn scenario mock lỗi 401 để cover UX fallback."',
    isRead: false,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
    avatar: 'https://i.pravatar.cc/160?img=7',
    postId: 'post_001',
    userId: 'usr_backend_001',
    actionUrl: '/posts/post_001',
  },
];

// Admin data for comprehensive seeding
const allAdminUsers = [
  {
    id: 'usr_student_001',
    display_name: 'Hiru Nguyễn',
    email: 'hiru@example.com',
    phone: '0912345678',
    role: 'USER',
    account_status: 'ACTIVE',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 280).toISOString(),
    deactivated_at: null,
    cccd_front_path: 'cccd_front_001.jpg',
    cccd_back_path: 'cccd_back_001.jpg',
    storage_used: 2048576, // 2MB
  },
  {
    id: 'usr_admin_001',
    display_name: 'Etechs Admin',
    email: 'admin@etechs.vn',
    phone: '0987654321',
    role: 'ADMIN',
    account_status: 'VERIFIED',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 640).toISOString(),
    deactivated_at: null,
    cccd_front_path: 'cccd_front_admin.jpg',
    cccd_back_path: 'cccd_back_admin.jpg',
    storage_used: 5242880, // 5MB
  },
  {
    id: 'usr_mentor_001',
    display_name: 'Mentor Hoàng',
    email: 'mentor.hoang@example.com',
    phone: '0911222333',
    role: 'INSTRUCTOR',
    account_status: 'VERIFIED',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    deactivated_at: null,
    cccd_front_path: 'cccd_front_mentor.jpg',
    cccd_back_path: 'cccd_back_mentor.jpg',
    storage_used: 3145728, // 3MB
  },
  {
    id: 'usr_pending_001',
    display_name: 'Người dùng chờ duyệt',
    email: 'pending@example.com',
    phone: '0911444555',
    role: 'USER',
    account_status: 'PENDING',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    deactivated_at: null,
    cccd_front_path: null,
    cccd_back_path: null,
    storage_used: 1048576, // 1MB
  },
  {
    id: 'usr_deactivated_001',
    display_name: 'Người dùng vô hiệu hóa',
    email: 'deactivated@example.com',
    phone: '0911666777',
    role: 'USER',
    account_status: 'DEACTIVATED',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    deactivated_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    cccd_front_path: 'cccd_front_deact.jpg',
    cccd_back_path: 'cccd_back_deact.jpg',
    storage_used: 2097152, // 2MB
  },
  {
    id: 'usr_locked_001',
    display_name: 'Người dùng bị khóa',
    email: 'locked@example.com',
    phone: '0911888999',
    role: 'USER',
    account_status: 'LOCKED',
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    deactivated_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    cccd_front_path: 'cccd_front_locked.jpg',
    cccd_back_path: 'cccd_back_locked.jpg',
    storage_used: 524288, // 0.5MB
  },
];

const commentsByPost = new Map<string, Comment[]>([
  [
    'post_001',
    [
      {
        id: 'cmt_001',
        postId: 'post_001',
        author: commentAuthors.mentor,
        parentCommentId: null,
        content: 'Flow này sạch và dễ scale đó. Nhớ thêm case test cho refresh token nữa nhé.',
        mediaUrls: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'],
        stats: { reactions: 7, replies: 1 },
        userReaction: 'LIKE',
        createdAt: new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 16).toISOString(),
      },
      {
        id: 'cmt_002',
        postId: 'post_001',
        author: commentAuthors.student,
        parentCommentId: 'cmt_001',
        content: 'Dạ em đang thêm luôn scenario mock lỗi 401 để cover UX fallback.',
        mediaUrls: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=600'],
        stats: { reactions: 2, replies: 0 },
        userReaction: null,
        createdAt: new Date(now.getTime() - 1000 * 60 * 13).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: 'cmt_003',
        postId: 'post_001',
        author: commentAuthors.peer,
        parentCommentId: null,
        content: 'Cho mình xin branch này để demo cho team frontend với.',
        mediaUrls: [],
        stats: { reactions: 1, replies: 0 },
        userReaction: null,
        createdAt: new Date(now.getTime() - 1000 * 60 * 9).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 9).toISOString(),
      },
    ],
  ],
]);

const getPostComments = (postId: string): Comment[] => commentsByPost.get(postId) ?? [];

const setPostComments = (postId: string, comments: Comment[]) => {
  commentsByPost.set(postId, comments);
};

const findCommentLocation = (commentId: string): { postId: string; comment: Comment } | null => {
  for (const [postId, comments] of commentsByPost.entries()) {
    const comment = comments.find((item) => item.id === commentId);
    if (comment) {
      return { postId, comment };
    }
  }
  return null;
};

const toMediaUrls = (mediaAssetIds?: string[]) => {
  if (!mediaAssetIds?.length) return [];
  // In production, these would be actual CDN URLs from the media service
  // For now, return empty to test missing media state properly
  return [];
};

const buildLoginResponse = (user: UserMe): AuthLogin200 => ({
  success: true,
  data: {
    access: `mock_access_token_${user.id}`,
    refresh: `mock_refresh_token_${user.id}`,
    tenant_slug: `tenant-${user.id}`,
  },
  request_id: `req_login_${Date.now()}`,
});

const buildMeResponse = (user: UserMe): UsersGetMe200 => ({
  success: true,
  data: user,
  request_id: `req_me_${Date.now()}`,
});

const buildFeedResponse = (items: PostSummary[], page: number, pageSize: number, total: number): FeedGetFeed200 => ({
  success: true,
  data: {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  },
  request_id: `req_feed_${Date.now()}`,
});

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize;
  return items.slice(start, end);
};

const buildPostCommentsResponse = (comments: Comment[], page: number, pageSize: number): PostsGetPostComments200 => ({
  success: true,
  data: {
    items: comments,
    pagination: {
      page,
      page_size: pageSize,
      total: comments.length,
      total_pages: Math.max(1, Math.ceil(comments.length / pageSize)),
    },
  },
  request_id: `req_comments_${Date.now()}`,
});

export const customHandlers = [
  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;

    await delay(350);

    activeUser = body.email.includes('admin') ? adminUser : studentUser;

    return HttpResponse.json(buildLoginResponse(activeUser), { status: 200 });
  }),

  http.get('*/users/me/', async () => {
    await delay(120);
    return HttpResponse.json(buildMeResponse(activeUser), { status: 200 });
  }),

  http.get('*/users/me', async () => {
    await delay(120);
    return HttpResponse.json(buildMeResponse(activeUser), { status: 200 });
  }),

  http.get('*/profiles/:username', async ({ params }) => {
    const username = String(params.username ?? '').toLowerCase();
    const profile = buildProfileForViewer(username);

    if (!profile) {
      await delay(200);
      return HttpResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    await delay(220);
    return HttpResponse.json(
      {
        success: true,
        data: profile,
        request_id: `req_profile_${Date.now()}`,
      },
      { status: 200 },
    );
  }),

  http.get('*/friends/check/:userId', async ({ params }) => {
    const userId = String(params.userId ?? '');
    const scenario = getFriendshipScenario(userId);

    await delay(160);
    return HttpResponse.json(
      {
        success: true,
        data: scenario.detail,
        request_id: `req_friendship_${Date.now()}`,
      },
      { status: 200 },
    );
  }),

  http.patch('*/users/me/profile', async ({ request }) => {
    const body = await request.json() as any;

    if (body.display_name !== undefined) {
      activeUser.displayName = body.display_name;
    }
    if (body.username !== undefined) {
      activeUser.username = body.username;
    }
    if (body.bio !== undefined) {
      activeUser.bio = body.bio;
    }
    if (body.birth_date !== undefined) {
      activeUser.birthDate = body.birth_date;
    }
    if (body.personal_info !== undefined) {
      activeUser.personalInfo = {
        ...activeUser.personalInfo,
        ...body.personal_info,
      };
    }

    await delay(250);
    return HttpResponse.json(buildMeResponse(activeUser), { status: 200 });
  }),

  http.get('*/feed', async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1) || 1;
    const pageSize = Number(url.searchParams.get('page_size') ?? 3) || 3;
    const postType = url.searchParams.get('post_type');
    const fieldId = url.searchParams.get('field_id');

    let filtered = allFeedPosts;

    if (postType) {
      filtered = filtered.filter(post => post.postType === postType);
    }

    if (fieldId) {
      filtered = filtered.filter(post => post.fieldId === fieldId);
    }

    const start = Math.max(0, (page - 1) * pageSize);
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    await delay(450);

    return HttpResponse.json(
      buildFeedResponse(pageItems, page, pageSize, filtered.length),
      { status: 200 },
    );
  }),

  http.get('*/posts/me', async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1) || 1;
    const pageSize = Number(url.searchParams.get('page_size') ?? 10) || 10;

    const filtered = allFeedPosts.filter((post) => post.author.id === activeUser.id);
    const pageItems = paginate(filtered, page, pageSize);

    await delay(300);
    return HttpResponse.json(buildFeedResponse(pageItems, page, pageSize, filtered.length), { status: 200 });
  }),

  http.get('*/posts/users/:userId', async ({ request, params }) => {
    const userId = String(params.userId ?? '');
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1) || 1;
    const pageSize = Number(url.searchParams.get('page_size') ?? 10) || 10;

    const filtered = allFeedPosts.filter((post) => post.author.id === userId);
    const pageItems = paginate(filtered, page, pageSize);

    await delay(300);
    return HttpResponse.json(buildFeedResponse(pageItems, page, pageSize, filtered.length), { status: 200 });
  }),

  http.get('*/posts/:postId/comments', async ({ request, params }) => {
    const postId = String(params.postId ?? '');
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1) || 1;
    const pageSize = Number(url.searchParams.get('page_size') ?? 20) || 20;

    const source = getPostComments(postId);
    const start = Math.max(0, (page - 1) * pageSize);
    const end = start + pageSize;
    const items = source.slice(start, end);

    await delay(200);
    return HttpResponse.json(buildPostCommentsResponse(items, page, pageSize), { status: 200 });
  }),

  http.post('*/comments/', async ({ request }) => {
    const body = (await request.json()) as CreateCommentRequest;

    const nextComment: Comment = {
      id: `cmt_${Date.now()}`,
      postId: body.post_id,
      parentCommentId: null,
      author: {
        id: activeUser.id,
        displayName: activeUser.displayName,
        username: activeUser.username,
        avatar: activeUser.avatar ?? null,
        role: activeUser.role,
        accountStatus: activeUser.accountStatus,
      },
      content: body.content_text,
      mediaUrls: toMediaUrls(body.media_asset_ids),
      stats: { reactions: 0, replies: 0 },
      userReaction: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = getPostComments(body.post_id);
    setPostComments(body.post_id, [nextComment, ...current]);

    const response: CommentsCreateComment201 = {
      success: true,
      data: nextComment,
      request_id: `req_create_comment_${Date.now()}`,
    };

    await delay(180);
    return HttpResponse.json(response, { status: 201 });
  }),

  http.post('*/comments/:commentId/replies', async ({ request, params }) => {
    const body = (await request.json()) as CreateCommentRequest;
    const parentCommentId = String(params.commentId ?? '');

    const reply: Comment = {
      id: `cmt_${Date.now()}`,
      postId: body.post_id,
      parentCommentId,
      author: {
        id: activeUser.id,
        displayName: activeUser.displayName,
        username: activeUser.username,
        avatar: activeUser.avatar ?? null,
        role: activeUser.role,
        accountStatus: activeUser.accountStatus,
      },
      content: body.content_text,
      mediaUrls: toMediaUrls(body.media_asset_ids),
      stats: { reactions: 0, replies: 0 },
      userReaction: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = getPostComments(body.post_id);
    const updated = [...current, reply].map((item) => {
      if (item.id !== parentCommentId) return item;
      return {
        ...item,
        stats: {
          ...item.stats,
          replies: item.stats.replies + 1,
        },
      };
    });
    setPostComments(body.post_id, updated);

    const response: CommentsReplyToComment201 = {
      success: true,
      data: reply,
      request_id: `req_reply_comment_${Date.now()}`,
    };

    await delay(180);
    return HttpResponse.json(response, { status: 201 });
  }),

  http.patch('*/comments/:commentId', async ({ request, params }) => {
    const commentId = String(params.commentId ?? '');
    const body = (await request.json()) as UpdateCommentRequest;
    const location = findCommentLocation(commentId);

    if (!location) {
      return HttpResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    const comments = getPostComments(location.postId).map((item) => {
      if (item.id !== commentId) return item;
      return {
        ...item,
        content: body.content_text ?? item.content,
        updatedAt: new Date().toISOString(),
      };
    });
    setPostComments(location.postId, comments);

    const updated = comments.find((item) => item.id === commentId) ?? location.comment;
    const response: CommentsUpdateComment200 = {
      success: true,
      data: updated,
      request_id: `req_update_comment_${Date.now()}`,
    };

    await delay(140);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.delete('*/comments/:commentId', async ({ params }) => {
    const commentId = String(params.commentId ?? '');
    const location = findCommentLocation(commentId);

    if (!location) {
      return HttpResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    const comments = getPostComments(location.postId).filter(
      (item) => item.id !== commentId && item.parentCommentId !== commentId,
    );
    setPostComments(location.postId, comments);

    const response: CommentsDeleteComment200 = {
      success: true,
      data: { message: 'Đã xoá bình luận' },
      request_id: `req_delete_comment_${Date.now()}`,
    };

    await delay(140);
    return HttpResponse.json(response, { status: 200 });
  }),

  // Field handlers
  http.get('*/fields/:fieldId/', async ({ params }) => {
    const fieldId = String(params.fieldId ?? '');
    const field = allFields.find(f => f.id === fieldId);

    if (!field) {
      return HttpResponse.json({ success: false, error: 'Field not found' }, { status: 404 });
    }

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: field,
      request_id: `req_field_${Date.now()}`,
    }, { status: 200 });
  }),

  http.get('*/fields/:fieldId/posts/', async ({ request, params }) => {
    const fieldId = String(params.fieldId ?? '');
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1) || 1;
    const limit = Number(url.searchParams.get('limit') ?? 10) || 10;

    const fieldPosts = allFeedPosts.filter(post => post.fieldId === fieldId);
    const start = Math.max(0, (page - 1) * limit);
    const end = start + limit;
    const posts = fieldPosts.slice(start, end);

    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        posts: posts,
        page: page,
        total_pages: Math.max(1, Math.ceil(fieldPosts.length / limit)),
      },
      request_id: `req_field_posts_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/fields/:fieldId/follow/', async ({ params }) => {
    const fieldId = String(params.fieldId ?? '');
    const fieldIndex = allFields.findIndex(f => f.id === fieldId);

    if (fieldIndex === -1) {
      return HttpResponse.json({ success: false, error: 'Field not found' }, { status: 404 });
    }

    allFields[fieldIndex].isFollowing = true;
    allFields[fieldIndex].stats.followersCount += 1;

    await delay(150);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã theo dõi lĩnh vực' },
      request_id: `req_field_follow_${Date.now()}`,
    }, { status: 200 });
  }),

  http.delete('*/fields/:fieldId/follow/', async ({ params }) => {
    const fieldId = String(params.fieldId ?? '');
    const fieldIndex = allFields.findIndex(f => f.id === fieldId);

    if (fieldIndex === -1) {
      return HttpResponse.json({ success: false, error: 'Field not found' }, { status: 404 });
    }

    allFields[fieldIndex].isFollowing = false;
    allFields[fieldIndex].stats.followersCount = Math.max(0, allFields[fieldIndex].stats.followersCount - 1);

    await delay(150);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã bỏ theo dõi lĩnh vực' },
      request_id: `req_field_unfollow_${Date.now()}`,
    }, { status: 200 });
  }),

  // Groups handlers
  http.get('*/groups', async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: allGroups,
      request_id: `req_groups_${Date.now()}`,
    }, { status: 200 });
  }),

  http.get('*/groups/:groupId', async ({ params }) => {
    const groupId = String(params.groupId ?? '');
    const group = allGroups.find(g => g.id === groupId);

    if (!group) {
      return HttpResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: group,
      request_id: `req_group_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/groups/:groupId/join', async ({ params }) => {
    const groupId = String(params.groupId ?? '');
    const groupIndex = allGroups.findIndex(g => g.id === groupId);

    if (groupIndex === -1) {
      return HttpResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    allGroups[groupIndex].isJoined = true;
    allGroups[groupIndex].stats.membersCount += 1;

    await delay(150);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã tham gia nhóm' },
      request_id: `req_group_join_${Date.now()}`,
    }, { status: 200 });
  }),

  http.delete('*/groups/:groupId/leave', async ({ params }) => {
    const groupId = String(params.groupId ?? '');
    const groupIndex = allGroups.findIndex(g => g.id === groupId);

    if (groupIndex === -1) {
      return HttpResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    allGroups[groupIndex].isJoined = false;
    allGroups[groupIndex].stats.membersCount = Math.max(0, allGroups[groupIndex].stats.membersCount - 1);

    await delay(150);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã rời nhóm' },
      request_id: `req_group_leave_${Date.now()}`,
    }, { status: 200 });
  }),

  // Marketplace handlers
  http.get('*/marketplace', async ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');

    let filtered = allMarketplaceItems;

    if (category) {
      filtered = filtered.filter(item => item.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (type) {
      filtered = filtered.filter(item => item.type.toLowerCase() === type.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    await delay(300);
    return HttpResponse.json({
      success: true,
      data: filtered,
      request_id: `req_marketplace_${Date.now()}`,
    }, { status: 200 });
  }),

  http.get('*/marketplace/:itemId', async ({ params }) => {
    const itemId = String(params.itemId ?? '');
    const item = allMarketplaceItems.find(i => i.id === itemId);

    if (!item) {
      return HttpResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: item,
      request_id: `req_marketplace_item_${Date.now()}`,
    }, { status: 200 });
  }),

  // Friends handlers
  http.get('*/friends/', async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const page = Number(url.searchParams.get('page') ?? 1) || 1;
    const pageSize = Number(url.searchParams.get('page_size') ?? 20) || 20;

    let filtered = allFriends;

    if (query) {
      filtered = filtered.filter(friend => 
        friend.user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        friend.user.username.toLowerCase().includes(query.toLowerCase())
      );
    }

    const start = Math.max(0, (page - 1) * pageSize);
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        friends: pageItems,
        total: filtered.length,
        page: page,
        page_size: pageSize,
        total_pages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
      request_id: `req_friends_${Date.now()}`,
    }, { status: 200 });
  }),

  http.get('*/friends/requests/incoming', async () => {
    await delay(250);
    return HttpResponse.json({
      success: true,
      data: incomingFriendRequests,
      request_id: `req_friends_incoming_${Date.now()}`,
    }, { status: 200 });
  }),

  http.get('*/friends/requests/outgoing', async () => {
    await delay(250);
    return HttpResponse.json({
      success: true,
      data: outgoingFriendRequests,
      request_id: `req_friends_outgoing_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/friends/requests/:requestId/accept', async ({ params }) => {
    const requestId = String(params.requestId ?? '');
    const requestIndex = incomingFriendRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
      return HttpResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const request = incomingFriendRequests[requestIndex];
    incomingFriendRequests.splice(requestIndex, 1);
    
    // Add to friends list
    allFriends.push({
      id: `friend_${Date.now()}`,
      user: request.requester,
      createdAt: new Date().toISOString(),
    });

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã chấp nhận lời mời kết bạn' },
      request_id: `req_friends_accept_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/friends/requests/:requestId/reject', async ({ params }) => {
    const requestId = String(params.requestId ?? '');
    const requestIndex = incomingFriendRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
      return HttpResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    incomingFriendRequests.splice(requestIndex, 1);

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã từ chối lời mời kết bạn' },
      request_id: `req_friends_reject_${Date.now()}`,
    }, { status: 200 });
  }),

  http.delete('*/friends/requests/:requestId', async ({ params }) => {
    const requestId = String(params.requestId ?? '');
    const requestIndex = outgoingFriendRequests.findIndex(req => req.id === requestId);

    if (requestIndex === -1) {
      return HttpResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    outgoingFriendRequests.splice(requestIndex, 1);

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã hủy lời mời kết bạn' },
      request_id: `req_friends_cancel_${Date.now()}`,
    }, { status: 200 });
  }),

  http.delete('*/friends/:friendId', async ({ params }) => {
    const friendId = String(params.friendId ?? '');
    const friendIndex = allFriends.findIndex(friend => friend.id === friendId);

    if (friendIndex === -1) {
      return HttpResponse.json({ success: false, error: 'Friend not found' }, { status: 404 });
    }

    allFriends.splice(friendIndex, 1);

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã hủy kết bạn' },
      request_id: `req_friends_remove_${Date.now()}`,
    }, { status: 200 });
  }),

  // Messages handlers
  http.get('*/api/users/:userId/rooms', async () => {
    
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: allConversations,
      request_id: `req_conversations_${Date.now()}`,
    }, { status: 200 });
  }),

  http.get('*/api/rooms/:roomId/messages', async ({ params }) => {
    const roomId = String(params.roomId ?? '');
    const messages = allMessages.filter(msg => msg.room_id === roomId);

    await delay(250);
    return HttpResponse.json({
      success: true,
      data: messages,
      request_id: `req_messages_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/api/rooms/:roomId/messages', async ({ request, params }) => {
    const roomId = String(params.roomId ?? '');
    const body = await request.json() as any;

    const newMessage = {
      id: `msg_${Date.now()}`,
      room_id: roomId,
      sender_id: body.sender_id || activeUser.id,
      ciphertext: body.content || body.ciphertext || '',
      created_at: new Date().toISOString(),
      attachment_urls: null,
      pinned: false,
      reactions: [],
    };

    allMessages.push(newMessage);

    // Update conversation's last message
    const convIndex = allConversations.findIndex(conv => conv.id === roomId);
    if (convIndex !== -1) {
      allConversations[convIndex].last_message = {
        id: newMessage.id,
        sender_id: newMessage.sender_id,
        created_at: newMessage.created_at,
        snippet: newMessage.ciphertext,
      };
    }

    await delay(150);
    return HttpResponse.json({
      success: true,
      data: newMessage,
      request_id: `req_message_send_${Date.now()}`,
    }, { status: 201 });
  }),

  http.post('*/api/rooms/', async ({ request }) => {
    const body = await request.json() as any;

    const newRoom = {
      id: `conv_${Date.now()}`,
      type: body.type || 'DIRECT',
      name: body.name,
      created_at: new Date().toISOString(),
    };

    allConversations.push({
      ...newRoom,
      last_message: {
        id: 'msg_system_empty',
        sender_id: 'system',
        created_at: new Date().toISOString(),
        snippet: 'Bắt đầu cuộc trò chuyện mới',
      },
      unread: 0,
    });

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: newRoom,
      request_id: `req_room_create_${Date.now()}`,
    }, { status: 201 });
  }),

  http.get('*/api/rooms/dm', async ({ request }) => {
    const url = new URL(request.url);
    const userA = url.searchParams.get('user_a');
    const userB = url.searchParams.get('user_b');

    // Find existing DM conversation
    const existingConv = allConversations.find(conv => 
      conv.type === 'DIRECT' && 
      ((conv.other_user?.id === userA) || (conv.other_user?.id === userB))
    );

    if (existingConv) {
      await delay(200);
      return HttpResponse.json({
        success: true,
        data: existingConv,
        request_id: `req_dm_existing_${Date.now()}`,
      }, { status: 200 });
    }

    // Create new DM conversation
    const newConv = {
      id: `conv_${Date.now()}`,
      type: 'DIRECT',
      name: 'New Conversation',
      created_at: new Date().toISOString(),
      last_message: {
        id: 'msg_system_new',
        sender_id: 'system',
        created_at: new Date().toISOString(),
        snippet: 'Cuộc trò chuyện mới',
      },
      unread: 0,
    };

    allConversations.push(newConv);

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: newConv,
      request_id: `req_dm_create_${Date.now()}`,
    }, { status: 201 });
  }),

  // Search handlers
  http.get('*/search', async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type');

    if (!query.trim()) {
      await delay(200);
      return HttpResponse.json({
        success: true,
        data: { users: [], posts: [], total: 0 },
        request_id: `req_search_empty_${Date.now()}`,
      }, { status: 200 });
    }

    const searchQuery = query.toLowerCase().trim();

    // Search users
    const allUsers = [
      studentUser,
      adminUser,
      ...Object.values(commentAuthors),
      {
        id: 'usr_design_001',
        displayName: 'Linh Designer',
        username: 'linh.design',
        avatar: 'https://i.pravatar.cc/160?img=15',
        role: 'USER',
        accountStatus: 'ACTIVE',
      },
    ];

    const matchedUsers = allUsers.filter(user => 
      user.displayName.toLowerCase().includes(searchQuery) ||
      user.username.toLowerCase().includes(searchQuery)
    ).map(user => ({
      ...user,
      friendshipStatus: allFriends.some(f => f.user.id === user.id) ? 'friends' : 
                      incomingFriendRequests.some(r => r.requester.id === user.id) ? 'request_received' :
                      outgoingFriendRequests.some(r => r.addressee.id === user.id) ? 'request_sent' : 'none',
      friendRequestId: incomingFriendRequests.find(r => r.requester.id === user.id)?.id || 
                       outgoingFriendRequests.find(r => r.addressee.id === user.id)?.id || null,
    }));

    // Search posts
    const matchedPosts = allFeedPosts.filter(post =>
      post.content.toLowerCase().includes(searchQuery) ||
      post.author.displayName.toLowerCase().includes(searchQuery) ||
      post.author.username.toLowerCase().includes(searchQuery)
    );

    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        users: type === 'posts' ? [] : matchedUsers,
        posts: type === 'users' ? [] : matchedPosts,
        total: matchedUsers.length + matchedPosts.length,
      },
      request_id: `req_search_${Date.now()}`,
    }, { status: 200 });
  }),

  // Notifications handlers
  http.get('*/notifications', async ({ request }) => {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    let notifications = allNotifications;
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    // Sort by created_at descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    await delay(250);
    return HttpResponse.json({
      success: true,
      data: notifications,
      unreadCount: allNotifications.filter(n => !n.isRead).length,
      request_id: `req_notifications_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/notifications/:notificationId/read', async ({ params }) => {
    const notificationId = String(params.notificationId ?? '');
    const notification = allNotifications.find(n => n.id === notificationId);

    if (!notification) {
      return HttpResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    notification.isRead = true;

    await delay(150);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã đánh dấu là đã đọc' },
      request_id: `req_notification_read_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/notifications/read-all', async () => {
    allNotifications.forEach(n => n.isRead = true);

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã đánh dấu tất cả là đã đọc' },
      request_id: `req_notifications_read_all_${Date.now()}`,
    }, { status: 200 });
  }),

  // Admin handlers
  http.get('*/admin/users', async ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role');

    let filtered = allAdminUsers;

    if (status) {
      filtered = filtered.filter(user => user.account_status === status);
    }

    if (role) {
      filtered = filtered.filter(user => user.role === role);
    }

    await delay(300);
    return HttpResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      request_id: `req_admin_users_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/admin/users/:userId/verify', async ({ params }) => {
    const userId = String(params.userId ?? '');
    const userIndex = allAdminUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return HttpResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    allAdminUsers[userIndex].account_status = 'VERIFIED';

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã xác minh người dùng' },
      request_id: `req_admin_verify_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/admin/users/:userId/reject', async ({ params }) => {
    const userId = String(params.userId ?? '');
    const userIndex = allAdminUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return HttpResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    allAdminUsers[userIndex].account_status = 'REJECTED';

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã từ chối người dùng' },
      request_id: `req_admin_reject_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/admin/users/:userId/reactivate', async ({ params }) => {
    const userId = String(params.userId ?? '');
    const userIndex = allAdminUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return HttpResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    allAdminUsers[userIndex].account_status = 'ACTIVE';
    allAdminUsers[userIndex].deactivated_at = null;

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã kích hoạt lại người dùng' },
      request_id: `req_admin_reactivate_${Date.now()}`,
    }, { status: 200 });
  }),

  http.post('*/admin/users/:userId/deactivate', async ({ params }) => {
    const userId = String(params.userId ?? '');
    const userIndex = allAdminUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return HttpResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    allAdminUsers[userIndex].account_status = 'DEACTIVATED';
    allAdminUsers[userIndex].deactivated_at = new Date().toISOString();

    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: 'Đã vô hiệu hóa người dùng' },
      request_id: `req_admin_deactivate_${Date.now()}`,
    }, { status: 200 });
  }),
];
