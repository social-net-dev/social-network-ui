/**
 * LocalStorage Cleanup Utility
 * Clean up old E2EE cache và message plaintext rác
 */

/**
 * Xóa TẤT CẢ message plaintext cache (msg_plaintext_*)
 * Gọi hàm này khi migrate sang Shared Room Key model
 */
export function clearAllMessageCache(): void {
  const keys = Object.keys(localStorage);
  let count = 0;

  keys.forEach(key => {
    if (key.startsWith('msg_plaintext_')) {
      localStorage.removeItem(key);
      count++;
    }
  });

  console.log(`🗑️ [Cleanup] Cleared ${count} message plaintext cache entries`);
}

/**
 * ⚠️ DANGER: Xóa toàn bộ RSA keypair keys
 * ❌ KHÔNG BAO GIỜ GỌI HÀM NÀY trong auto cleanup!
 * ❌ XÓA RSA keys sẽ làm TOÀN BỘ messages cũ KHÔNG decrypt được!
 *
 * Chỉ dùng khi:
 * - Reset hoàn toàn E2EE (xóa toàn bộ lịch sử tin nhắn)
 * - Debugging/testing
 */
export function clearOldE2EEKeys(): void {
  console.error('⛔ [DANGER] clearOldE2EEKeys() is DISABLED!');
  console.error('⛔ Deleting RSA keys will make ALL old messages UNREADABLE!');
  console.error('⛔ If you really want to reset E2EE, manually delete e2ee_*_key_* from localStorage');
  return;

  // DISABLED CODE (keep for reference):
  // const keys = Object.keys(localStorage);
  // let count = 0;
  // keys.forEach(key => {
  //   if (key.startsWith('e2ee_private_key_') || key.startsWith('e2ee_public_key_')) {
  //     localStorage.removeItem(key);
  //     count++;
  //   }
  // });
  // console.log(`🗑️ [Cleanup] Cleared ${count} old E2EE RSA keys`);
}

/**
 * Hiển thị thống kê localStorage usage
 */
export function showLocalStorageStats(): void {
  const keys = Object.keys(localStorage);

  const stats = {
    total: keys.length,
    msg_cache: keys.filter(k => k.startsWith('msg_plaintext_')).length,
    rsa_keys: keys.filter(k => k.startsWith('e2ee_private_key_') || k.startsWith('e2ee_public_key_')).length,
    room_keys: keys.filter(k => k.startsWith('e2ee_room_key_')).length,
    other: keys.filter(k => !k.startsWith('msg_plaintext_') && !k.startsWith('e2ee_private_key_') && !k.startsWith('e2ee_public_key_') && !k.startsWith('e2ee_room_key_')).length,
  };

  // Calculate total size
  let totalSize = 0;
  keys.forEach(key => {
    const value = localStorage.getItem(key) || '';
    totalSize += key.length + value.length;
  });

  console.log('\n📊 ==================== LOCAL STORAGE STATS ====================');
  console.log(`Total entries: ${stats.total}`);
  console.log(`  - Message cache (msg_plaintext_*): ${stats.msg_cache} ${stats.msg_cache > 0 ? '⚠️ (should be cleaned)' : '✅'}`);
  console.log(`  - RSA keypair (e2ee_*_key_*): ${stats.rsa_keys} ${stats.rsa_keys > 0 ? '✅ (DO NOT DELETE!)' : '⏹️'}`);
  console.log(`  - Room keys (e2ee_room_key_*): ${stats.room_keys} ✅`);
  console.log(`  - Other: ${stats.other}`);
  console.log(`Total size: ~${(totalSize / 1024).toFixed(2)} KB`);
  console.log('===============================================================\n');

  if (stats.msg_cache > 0) {
    console.log('⚠️ RECOMMENDATION: Run cleanup to remove unused message cache:');
    console.log('  window.e2eeCleanup.cleanupAll()');
  }

  if (stats.rsa_keys > 0) {
    console.log('✅ RSA keys are preserved (needed to decrypt old messages)');
  }

  return stats as any;
}

/**
 * Auto cleanup - Chạy khi app khởi động
 * CHỈ xóa message plaintext cache
 * ⚠️ KHÔNG xóa RSA keys (cần để decrypt old messages!)
 */
export function cleanupLocalStorage(): void {
  console.log('\n🧹 Starting localStorage cleanup...');

  clearAllMessageCache();
  // ❌ KHÔNG xóa RSA keys! Messages cũ sẽ không decrypt được!
  // clearOldE2EEKeys();

  console.log('✅ Cleanup complete!\n');
  showLocalStorageStats();
}

// Export cho window để test trong console
if (typeof window !== 'undefined') {
  (window as any).e2eeCleanup = {
    clearAllMessageCache,
    clearOldE2EEKeys,
    showStats: showLocalStorageStats,
    cleanupAll: cleanupLocalStorage,
  };

  console.log('💡 E2EE Cleanup utilities available in console:');
  console.log('  window.e2eeCleanup.showStats()    - Xem thống kê');
  console.log('  window.e2eeCleanup.cleanupAll()   - Xóa rác');
}
