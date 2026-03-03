import { cn } from '@/lib/utils';

interface FormattedContentProps {
  content: string;
  className?: string;
  onClick?: () => void;
}

export function FormattedContent({ content, className, onClick }: FormattedContentProps) {
  if (!content) return null;

  // Remove hashtags from content entirely
  const cleaned = content.replace(/#[\w\p{L}]+/gu, '').replace(/\s{2,}/g, ' ').trim();

  return (
    <span className={cn('whitespace-pre-wrap', className)} onClick={onClick}>
      {cleaned}
    </span>
  );
}
