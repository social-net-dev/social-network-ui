import React from 'react';
import type { IReaction } from '../types/message.types';

interface MessageReactionsProps {
  reactions: IReaction[];
  isMine: boolean;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({ reactions, isMine }) => {
  const reactionMap = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  if (Object.keys(reactionMap).length === 0) {
    return null;
  }

  return (
    <div className={`flex gap-1 items-center ${isMine ? 'justify-end' : 'justify-start'}`}>
      {Object.entries(reactionMap).map(([emoji, count]) => (
        <div key={emoji} className="bg-white dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-1">
          <span>{emoji}</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">{count}</span>
        </div>
      ))}
    </div>
  );
};
