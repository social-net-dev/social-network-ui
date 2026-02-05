import { Link } from 'react-router-dom';

export function MessageListPage() {
  // Placeholder data - replace with real queries
  const conversations = [
    { id: 'c1', title: 'Alice' },
    { id: 'c2', title: 'Team Project' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Tin nhắn</h1>
      <div className="space-y-2">
        {conversations.map(c => (
          <Link key={c.id} to={`/messages/${c.id}`} className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {c.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MessageListPage;
