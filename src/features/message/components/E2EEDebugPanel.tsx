/**
 * E2EE Debug Panel - Công cụ debug cho End-to-End Encryption
 * Chỉ hiện trong development mode
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useE2EEStore } from '@/stores/e2eeStore';
import apiClient from '@/lib/api';
import messageApiClient from '@/lib/messageApiClient';
import { Bug, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface DebugResult {
  type: 'success' | 'error' | 'warning';
  title: string;
  details: string;
  data?: unknown;
}

export function E2EEDebugPanel({ roomId }: { roomId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);

  const userId = useAuthStore(state => state.user?.id);
  const { userPublicKeys } = useE2EEStore();

  const runE2EECheck = async () => {
    setIsChecking(true);
    const checks: DebugResult[] = [];

    try {
      // 1️⃣ Check private key
      if (!userId) {
        checks.push({
          type: 'error',
          title: 'Không có User ID',
          details: 'Không thể tải private key - chưa đăng nhập?',
        });
      } else {
        const privateKeyBase64 = localStorage.getItem(`e2ee_private_key_${userId}`);
        if (privateKeyBase64) {
          checks.push({
            type: 'success',
            title: '✅ Private Key OK',
            details: `Có private key cho user ${userId.substring(0, 8)}...`,
          });
        } else {
          checks.push({
            type: 'error',
            title: '❌ Không tìm thấy Private Key',
            details: 'localStorage không có e2ee_private_key - Cần generate keys!',
          });
        }
      }

      // 2️⃣ Check public keys loaded
      const publicKeyCount = Object.keys(userPublicKeys).length;
      if (publicKeyCount > 0) {
        checks.push({
          type: 'success',
          title: `✅ Public Keys OK (${publicKeyCount} users)`,
          details: `Đã load public key của ${publicKeyCount} người dùng khác`,
        });
      } else {
        checks.push({
          type: 'warning',
          title: '⚠️ Chưa load Public Keys',
          details: 'Chưa load public key của người dùng nào - Cần join room trước!',
        });
      }

      // 3️⃣ Check backend API response
      checks.push({
        type: 'warning',
        title: '🔍 Đang check backend API...',
        details: `GET /api/rooms/${roomId}/messages`,
      });

      // Use the message microservice client to query messages (may live on different base URL)
      const response = await messageApiClient.get(`/api/rooms/${roomId}/messages`);
      const messages = response.data;

      if (!Array.isArray(messages) || messages.length === 0) {
        checks.push({
          type: 'warning',
          title: '⚠️ Không có tin nhắn',
          details: 'Backend trả về mảng rỗng hoặc không phải array',
        });
      } else {
        // Check từng tin nhắn
        const totalMessages = messages.length;
        const messagesWithKeys = messages.filter((m: any) => m.encrypted_key && m.iv);
        const messagesWithoutKeys = totalMessages - messagesWithKeys.length;

        if (messagesWithoutKeys === 0) {
          checks.push({
            type: 'success',
            title: `✅ Backend API OK (${totalMessages} tin)`,
            details: `Tất cả ${totalMessages} tin nhắn đều có encrypted_key và iv`,
            data: {
              total: totalMessages,
              with_keys: messagesWithKeys.length,
              sample: {
                id: messages[0].id,
                has_encrypted_key: !!messages[0].encrypted_key,
                has_iv: !!messages[0].iv,
                encrypted_key_length: messages[0].encrypted_key?.length || 0,
                iv_length: messages[0].iv?.length || 0,
              },
            },
          });
        } else {
          checks.push({
            type: 'error',
            title: `❌ Backend API thiếu E2EE fields!`,
            details: `${messagesWithoutKeys}/${totalMessages} tin nhắn KHÔNG CÓ encrypted_key hoặc iv`,
            data: {
              total: totalMessages,
              with_keys: messagesWithKeys.length,
              without_keys: messagesWithoutKeys,
              sample_broken: messages.find((m: any) => !m.encrypted_key || !m.iv),
            },
          });
        }

        // Detail từng tin nhắn
        messages.slice(0, 5).forEach((msg: any, idx: number) => {
          const hasKey = !!msg.encrypted_key;
          const hasIv = !!msg.iv;

          if (!hasKey || !hasIv) {
            checks.push({
              type: 'error',
              title: `🚨 Message ${idx + 1}: THIẾU E2EE fields`,
              details: `ID: ${msg.id?.substring(0, 12)}...\n` + `encrypted_key: ${hasKey ? '✅' : '❌ NULL'}\n` + `iv: ${hasIv ? '✅' : '❌ NULL'}`,
              data: msg,
            });
          }
        });
      }

      // 4️⃣ Final verdict
      const hasErrors = checks.some(c => c.type === 'error');
      if (hasErrors) {
        checks.push({
          type: 'error',
          title: '❌ CÓ LỖI - Không decrypt được sau reload là ĐÚNG',
          details: 'Backend không trả về encrypted_key và iv → Frontend không thể decrypt. Cần fix backend!',
        });
      } else {
        checks.push({
          type: 'success',
          title: '✅ Mọi thứ OK',
          details: 'Backend trả về đầy đủ E2EE fields. Nếu vẫn không decrypt được → Public key không khớp (tin cũ dùng key cũ)',
        });
      }
    } catch (error: any) {
      const respData = error?.response?.data;
      const status = error?.response?.status;
      const reqUrl = error?.config?.url || '';
      checks.push({
        type: 'error',
        title: '❌ Lỗi khi gọi API',
        details: `${error.message || 'Unknown error'}\nStatus: ${status || 'N/A'}\nURL: ${reqUrl}`,
        data: respData ?? error,
      });
    }

    setResults(checks);
    setIsChecking(false);
  };

  if (import.meta.env.MODE !== 'development') {
    return null; // Chỉ hiện trong dev mode
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="shadow-lg">
          <Bug className="w-4 h-4 mr-2" />
          E2EE Debug
        </Button>
      ) : (
        <Card className="w-[500px] max-h-[600px] overflow-auto shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bug className="w-4 h-4" />
                E2EE Debug Panel
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={runE2EECheck} disabled={isChecking} className="w-full" size="sm">
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                '🔍 Chạy E2EE Check'
              )}
            </Button>

            {results.length > 0 && (
              <div className="space-y-2 text-xs">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      result.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : result.type === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : result.type === 'error' ? (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="font-semibold">{result.title}</div>
                        <div className="text-muted-foreground whitespace-pre-wrap">{result.details}</div>
                        {result.data != null ? (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400">Xem raw data</summary>
                            <pre className="mt-1 p-2 bg-black/5 dark:bg-white/5 rounded text-[10px] overflow-auto max-h-32">{JSON.stringify(result.data, null, 2) ?? 'null'}</pre>
                          </details>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t text-[10px] text-muted-foreground">💡 Tip: Check console logs để xem chi tiết hơn</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
