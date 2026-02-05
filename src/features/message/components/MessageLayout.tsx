import React from 'react';

interface MessageLayoutProps {
  isMine: boolean;
  children: React.ReactNode;
}

export const MessageLayout: React.FC<MessageLayoutProps> = ({ isMine, children }) => {
  return (
    <div className="w-full mb-4" role="listitem">
      {isMine ? <div className="flex items-end gap-2 justify-end group">{children}</div> : <div className="flex items-end gap-2 justify-start group">{children}</div>}
    </div>
  );
};
