/**
 * Format date separator for message groups
 */
export const getDateSeparator = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Hôm nay';
  if (isYesterday) return 'Hôm qua';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Group messages by date for rendering with date separators
 */
export const groupMessagesByDate = <T extends { created_at?: string | null }>(messages: T[]) => {
  const groups: { date: string; messages: T[] }[] = [];
  let currentDate: string | null = null;

  messages.forEach(msg => {
    if (!msg.created_at) {
      // Optimistic messages without timestamp go to last group or new one
      if (groups.length === 0 || currentDate !== 'optimistic') {
        groups.push({ date: '', messages: [] });
        currentDate = 'optimistic';
      }
      groups[groups.length - 1].messages.push(msg);
      return;
    }

    const msgDate = new Date(msg.created_at);
    const dateStr = msgDate.toDateString();

    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groups.push({ date: getDateSeparator(msgDate), messages: [] });
    }
    groups[groups.length - 1].messages.push(msg);
  });

  return groups;
};
