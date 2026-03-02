import { useEffect, useState } from 'react';
import { PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CreatePostFABProps {
  onClick: () => void;
  /** FAB appears only after scrolling past this Y offset (px). Default: 300 */
  scrollThreshold?: number;
}

export function CreatePostFAB({ onClick, scrollThreshold = 300 }: CreatePostFABProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > scrollThreshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollThreshold]);

  return (
    <div
      className={cn(
        'hidden md:flex fixed bottom-6 right-6 z-40 transition-all duration-300',
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onClick}
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            >
              <PenSquare className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Đăng bài</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
