interface Props {
  title: string;
  lastMessage?: string;
}

export function MessagePreview({ title, lastMessage }: Props) {
  return (
    <div className="p-3 rounded">
      <div className="font-medium">{title}</div>
      {lastMessage && <div className="text-sm opacity-80">{lastMessage}</div>}
    </div>
  );
}

export default MessagePreview;
