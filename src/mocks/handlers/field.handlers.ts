import { http, HttpResponse, delay } from 'msw';
import { mockPosts } from '../fixtures';

const mockFields = [
  {
    id: 'cong-nghe',
    name: 'Công nghệ',
    hashtag: '#CongNghe',
    description: 'Cập nhật những xu hướng công nghệ mới nhất, từ AI, Blockchain đến phát triển phần mềm.',
    bannerUrl: 'https://picsum.photos/1200/400?random=101',
    avatarUrl: 'https://picsum.photos/200/200?random=102',
    stats: {
      postsCount: 1250,
      followersCount: 8500,
    },
    isFollowing: false,
  },
  {
    id: 'doi-song',
    name: 'Đời sống',
    hashtag: '#DoiSong',
    description: 'Chia sẻ những khoảnh khắc đời thường, kinh nghiệm sống và những câu chuyện ý nghĩa.',
    bannerUrl: 'https://picsum.photos/1200/400?random=103',
    avatarUrl: 'https://picsum.photos/200/200?random=104',
    stats: {
      postsCount: 3400,
      followersCount: 12000,
    },
    isFollowing: true,
  },
  {
    id: 'nghe-thuat',
    name: 'Nghệ thuật',
    hashtag: '#NgheThuat',
    description: 'Khám phá thế giới hội họa, âm nhạc và những tác phẩm sáng tạo đầy cảm hứng.',
    bannerUrl: 'https://picsum.photos/1200/400?random=105',
    avatarUrl: 'https://picsum.photos/200/200?random=106',
    stats: {
      postsCount: 850,
      followersCount: 5200,
    },
    isFollowing: false,
  },
  {
    id: 'kinh-doanh',
    name: 'Kinh doanh',
    hashtag: '#KinhDoanh',
    description: 'Kiến thức khởi nghiệp, quản trị doanh nghiệp và phân tích thị trường tài chính.',
    bannerUrl: 'https://picsum.photos/1200/400?random=107',
    avatarUrl: 'https://picsum.photos/200/200?random=108',
    stats: {
      postsCount: 2100,
      followersCount: 9300,
    },
    isFollowing: false,
  },
  {
    id: 'suc-khoe',
    name: 'Sức khỏe',
    hashtag: '#SucKhoe',
    description: 'Bí quyết sống khỏe mỗi ngày, chế độ dinh dưỡng và các bài tập luyện hiệu quả.',
    bannerUrl: 'https://picsum.photos/1200/400?random=109',
    avatarUrl: 'https://picsum.photos/200/200?random=110',
    stats: {
      postsCount: 1500,
      followersCount: 7800,
    },
    isFollowing: false,
  },
];

export const fieldHandlers = [
  // Get Field Detail
  http.get('*/fields/:fieldId', async ({ params }) => {
    await delay(500);
    const { fieldId } = params;
    const field = mockFields.find(f => f.id === fieldId) || mockFields[0];

    return HttpResponse.json({
      success: true,
      data: {
        field,
      },
    });
  }),

  // Get Field Posts
  http.get('*/fields/:fieldId/posts', async ({ request }) => {
    await delay(800);
    // const { fieldId } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Filter posts by field (mocked by just using mockPosts for now)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = mockPosts.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        posts: paginatedPosts,
        total: mockPosts.length,
        total_pages: Math.ceil(mockPosts.length / limit),
      },
    });
  }),

  // Follow/Unfollow Field
  http.post('*/fields/:fieldId/follow', async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: { message: 'Followed successfully' },
    });
  }),

  http.delete('*/fields/:fieldId/follow', async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: { message: 'Unfollowed successfully' },
    });
  }),
];
