import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className }: FormattedContentProps) {
  if (!content) return null;

  // Regex for hashtags: # followed by alphanumeric characters and Unicode letters
  const hashtagRegex = /#[\w\p{L}]+/gu;

  // Split content while keeping the hashtags
  const parts = content.split(/(#[\w\p{L}]+)/gu);

  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {parts.map((part, index) => {
        if (part.match(hashtagRegex)) {
          const tag = part.slice(1);
          return (
            <Link key={index} to={`/search?q=%23${tag}`} className="text-primary hover:underline font-medium" onClick={e => e.stopPropagation()}>
              {part}
            </Link>
          );
        }
        return part;
      })}
    </span>
  );
}
