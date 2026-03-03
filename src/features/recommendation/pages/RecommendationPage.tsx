import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/features/shared/components/Avatar';
import { GraduationCap, Search, Sparkles, Users, UserCheck, Clock, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { FriendsAPI } from '@/lib/api/generated';
import { buildMediaUrl } from '@/lib/api/transforms/common';
import { toast } from 'sonner';

const TAB_OPTIONS = [{ value: 'FIELD', label: 'Chung lĩnh vực' }] as const;

type TabValue = (typeof TAB_OPTIONS)[number]['value'];

export type Suggestion = {
  id: string;
  name: string;
  username: string;
  role: 'Học sinh' | 'Giáo viên' | 'Giảng viên';
  className: string;
  school: string;
  field: string;
  hats: number;
  mutuals: number;
  tags: Array<'CLASS' | 'SCHOOL' | 'FIELD'>;
  avatar?: string;
  avatar_path?: string;
  background_url?: string;
  friend_status: 'NONE' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'FRIENDS';
  friend_request_id?: string | null;
};

interface ApiSuggestion {
  id: string;
  name: string;
  username?: string | null;
  avatar_path?: string | null;
  background_path?: string | null;
  role?: string;
  tags?: string[];
  connected_via?: string;
  target_name?: string;
  friend_status?: string;
  friend_request_id?: string | null;
  school?: string;
  class_name?: string;
  field?: string;
}

function mapApiToSuggestion(r: ApiSuggestion): Suggestion {
  const tags = (r.tags || []) as Array<'CLASS' | 'SCHOOL' | 'FIELD'>;
  const roleMap: Record<string, 'Học sinh' | 'Giáo viên' | 'Giảng viên'> = {
    TEACH_AT_SCHOOL: 'Giáo viên',
    TEACHES: 'Giáo viên',
    TEACHER: 'Giáo viên',
    INSTRUCTOR: 'Giảng viên',
    STUDY_AT_SCHOOL: 'Học sinh',
    STUDY_IN: 'Học sinh',
    STUDENT: 'Học sinh',
  };
  const role = (r.role && roleMap[r.role]) || 'Học sinh';
  const username = (r.username || '').trim() || (r.name || '').toLowerCase().replace(/\s+/g, '').slice(0, 20) || r.id?.slice(0, 8) || 'user';
  return {
    id: r.id,
    name: r.name || 'Người dùng',
    username,
    role,
    className: r.class_name || r.target_name || '—',
    school: r.school || (r.connected_via === 'School' ? r.target_name || '—' : '—'),
    field: r.field || (tags.includes('FIELD') ? r.target_name || '—' : '—'),
    hats: 0,
    mutuals: 0,
    tags: tags.length ? tags : ['SCHOOL'],
    avatar: r.avatar_path ? buildMediaUrl(r.avatar_path) : undefined,
    avatar_path: r.avatar_path || undefined,
    background_url: r.background_path ? buildMediaUrl(r.background_path) : undefined,
    friend_status: (r.friend_status as Suggestion['friend_status']) || 'NONE',
    friend_request_id: r.friend_request_id,
  };
}

async function fetchSuggestions(filter: TabValue): Promise<Suggestion[]> {
  const params = new URLSearchParams({ filter });
  const res = await api.get<{ suggestions: ApiSuggestion[] }>(`recommendations/suggestions/?${params.toString()}`);
  const data = res.data;
  const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
  return list.map(mapApiToSuggestion);
}

export function RecommendationPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('FIELD');
  const [query, setQuery] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [hiddenSuggestionIds, setHiddenSuggestionIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const addProcessing = (id: string) => setProcessingIds(prev => new Set(prev).add(id));
  const removeProcessing = (id: string) =>
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  // Optimistically update a suggestion's friend_status in the cache
  const updateSuggestionStatus = (userId: string, newStatus: Suggestion['friend_status'], requestId?: string | null) => {
    // Update all tab caches
    for (const tab of TAB_OPTIONS) {
      queryClient.setQueryData<Suggestion[]>(['recommendations', 'suggestions', tab.value], old => {
        if (!old) return old;
        return old.map(s => (s.id === userId ? { ...s, friend_status: newStatus, friend_request_id: requestId ?? s.friend_request_id } : s));
      });
    }
  };

  const connectMutation = useMutation({
    mutationFn: async ({ userId, username }: { userId: string; username: string }) => {
      addProcessing(userId);
      return FriendsAPI.createFriendRequestFriendsRequestsPost({ addressee_username: username });
    },
    onSuccess: (data: any, variables) => {
      removeProcessing(variables.userId);
      toast.success('Đã gửi lời mời kết bạn');
      const requestId = data?.id || data?._id || null;
      updateSuggestionStatus(variables.userId, 'REQUEST_SENT', requestId ? String(requestId) : null);
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err: any, variables) => {
      removeProcessing(variables.userId);
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Lỗi khi gửi lời mời';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async ({ userId, requestId }: { userId: string; requestId: string }) => {
      addProcessing(userId);
      return FriendsAPI.acceptRequestFriendsRequestsRequestIdAcceptPost(requestId);
    },
    onSuccess: (_data, variables) => {
      removeProcessing(variables.userId);
      toast.success('Đã chấp nhận lời mời kết bạn');
      updateSuggestionStatus(variables.userId, 'FRIENDS');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (_err, variables) => {
      removeProcessing(variables.userId);
      toast.error('Lỗi khi chấp nhận lời mời');
    },
  });

  const { data: apiSuggestions = [], isLoading } = useQuery({
    queryKey: ['recommendations', 'suggestions', activeTab],
    queryFn: () => fetchSuggestions(activeTab),
    staleTime: 60 * 1000,
  });

  const handleSkipSuggestion = (userId: string) => {
    setHiddenSuggestionIds(prev => new Set(prev).add(userId));
    toast.success('Đã ẩn gợi ý này');
  };

  const suggestions = useMemo(() => {
    const filteredByTab = apiSuggestions.filter(item => item.tags.includes('FIELD'));
    return filteredByTab
      .filter(item => !hiddenSuggestionIds.has(item.id))
      .filter(item => {
        const matchesQuery = [item.name, item.username, item.school, item.field, item.className].join(' ').toLowerCase().includes(query.toLowerCase());
        return matchesQuery;
      });
  }, [query, apiSuggestions, hiddenSuggestionIds]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-etechs-primary/10 text-etechs-primary flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gợi ý kết nối</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Khám phá những người học phù hợp dựa trên lớp, trường và lĩnh vực học tập.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm người dùng cùng lĩnh vực" className="pl-10 h-11" />
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as TabValue)}>
        <TabsList className="bg-white dark:bg-card p-1 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 w-full justify-start flex flex-wrap">
          {TAB_OPTIONS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_OPTIONS.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-6 mt-6">
            {isLoading ? (
              <div className="py-12 text-center text-gray-500">Đang tải gợi ý...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {suggestions.length === 0 ? (
                  <Card className="border-dashed md:col-span-2 xl:col-span-4">
                    <CardContent className="py-12 text-center text-gray-500">Không có gợi ý phù hợp. Hãy thử giảm bộ lọc hoặc tìm kiếm khác.</CardContent>
                  </Card>
                ) : (
                  suggestions.map(user => (
                    <Card key={user.id} className="border-none shadow-lg bg-white dark:bg-card overflow-hidden">
                      <Link to={`/profile/${user.username}`}>
                        <div
                          className="relative h-28 bg-gradient-to-br from-etechs-primary/30 via-white to-etechs-secondary/10 dark:from-etechs-secondary/30 dark:to-etechs-primary/10"
                          style={
                            user.background_url
                              ? {
                                  backgroundImage: `url(${user.background_url})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }
                              : undefined
                          }
                        >
                          <div className="size-16 absolute left-1/2 -bottom-8 -translate-x-1/2">
                            <Avatar user={user} size="lg" className="ring-4 ring-white dark:ring-[#0a1f29]" />
                          </div>
                        </div>
                      </Link>
                      <CardContent className="pt-10 pb-4 px-4 flex flex-col gap-3">
                        <Link to={`/profile/${user.username}`} className="text-center space-y-0.5 hover:opacity-80 transition-opacity">
                          <div className="flex items-center justify-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.className} • {user.school}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Lĩnh vực: {user.field}</p>
                        </Link>

                        <div className="flex flex-wrap justify-center gap-2">
                          {user.tags.includes('CLASS') && <Badge variant="outline">Chung lớp</Badge>}
                          {user.tags.includes('SCHOOL') && <Badge variant="outline">Chung trường</Badge>}
                          {user.tags.includes('FIELD') && <Badge variant="outline">Chung lĩnh vực</Badge>}
                          {user.mutuals > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {user.mutuals} bạn chung
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {user.friend_status === 'FRIENDS' ? (
                            <Button className="rounded-full" variant="secondary" disabled>
                              <UserCheck className="h-4 w-4 mr-1" /> Bạn bè
                            </Button>
                          ) : user.friend_status === 'REQUEST_SENT' ? (
                            <Button className="rounded-full" variant="outline" disabled>
                              <Clock className="h-4 w-4 mr-1" /> Đã gửi lời mời
                            </Button>
                          ) : user.friend_status === 'REQUEST_RECEIVED' ? (
                            <Button
                              className="rounded-full"
                              disabled={processingIds.has(user.id)}
                              onClick={() => {
                                if (user.friend_request_id) {
                                  acceptMutation.mutate({ userId: user.id, requestId: user.friend_request_id });
                                }
                              }}
                            >
                              {processingIds.has(user.id) ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang chấp nhận...
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" /> Chấp nhận
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              className="rounded-full"
                              disabled={processingIds.has(user.id) || !user.username}
                              onClick={() => {
                                if (!user.username) return;
                                connectMutation.mutate({ userId: user.id, username: user.username });
                              }}
                            >
                              {processingIds.has(user.id) ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang gửi...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-1" /> Kết nối
                                </>
                              )}
                            </Button>
                          )}
                          <Button variant="outline" className="rounded-full" onClick={() => handleSkipSuggestion(user.id)}>
                            Bỏ qua
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
