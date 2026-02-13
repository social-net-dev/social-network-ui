/**
 * Message Cache - Store plaintext of sent messages for sender
 *
 * WHY NEEDED:
 * - Sender encrypts message with RECIPIENT's public key
 * - Sender CANNOT decrypt it later (doesn't have recipient's private key)
 * - Need to cache plaintext locally for sender to see their own messages after reload
 *
 * STORAGE: localStorage with key pattern: msg_plaintext_{messageId}_{userId}
 */

const CACHE_PREFIX = 'msg_plaintext_';
const MAX_CACHE_AGE_DAYS = 30; // Auto-clean old messages after 30 days

interface CachedMessage {
  plaintext: string;
  timestamp: number;
  userId: string;
}

/**
 * Save plaintext of a sent message
 */
export function saveSentMessagePlaintext(messageId: string, userId: string, plaintext: string): void {
  try {
    const key = `${CACHE_PREFIX}${messageId}_${userId}`;
    const data: CachedMessage = {
      plaintext,
      timestamp: Date.now(),
      userId,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[MessageCache] ❌ Failed to save plaintext:', error);
  }
}

/**
 * Get plaintext of a sent message
 */
export function getSentMessagePlaintext(messageId: string, userId: string): string | null {
  try {
    const key = `${CACHE_PREFIX}${messageId}_${userId}`;
    const cached = localStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const data: CachedMessage = JSON.parse(cached);

    // Check age
    const ageInDays = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
    if (ageInDays > MAX_CACHE_AGE_DAYS) {
      localStorage.removeItem(key);
      return null;
    }

    // Verify userId matches
    if (data.userId !== userId) {
      return null;
    }

    return data.plaintext;
  } catch (error) {
    console.error('[MessageCache] ❌ Failed to get plaintext:', error);
    return null;
  }
}

/**
 * Clean old cached messages
 */
export function cleanOldMessageCache(): void {
  try {
    const keys = Object.keys(localStorage);
    let cleaned = 0;

    keys.forEach(key => {
      if (!key.startsWith(CACHE_PREFIX)) return;

      try {
        const cached = localStorage.getItem(key);
        if (!cached) return;

        const data: CachedMessage = JSON.parse(cached);
        const ageInDays = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);

        if (ageInDays > MAX_CACHE_AGE_DAYS) {
          localStorage.removeItem(key);
          cleaned++;
        }
      } catch {
        // Invalid data, remove it
        localStorage.removeItem(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
    }
  } catch (error) {
    console.error('[MessageCache] ❌ Failed to clean cache:', error);
  }
}

/**
 * Clear all message cache for a user (logout)
 */
export function clearMessageCache(userId?: string): void {
  try {
    const keys = Object.keys(localStorage);
    let cleared = 0;

    keys.forEach(key => {
      if (!key.startsWith(CACHE_PREFIX)) return;

      if (userId) {
        // Only clear messages for specific user
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data: CachedMessage = JSON.parse(cached);
            if (data.userId === userId) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch {
          // Invalid data, remove it anyway
          localStorage.removeItem(key);
          cleared++;
        }
      } else {
        // Clear all message cache
        localStorage.removeItem(key);
        cleared++;
      }
    });

    if (cleared > 0) {
    }
  } catch (error) {
    console.error('[MessageCache] ❌ Failed to clear cache:', error);
  }
}
