import { useState, useRef, useLayoutEffect } from 'react';

/**
 * Tracks the width of `[data-slot="sidebar-gap"]` element to compute
 * the correct `left` offset for the fixed messages panel.
 */
export function useSidebarOffset(): string {
  const [leftOffset, setLeftOffset] = useState<string>('0px');
  const sidebarGapRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const findGap = () => document.querySelector<HTMLElement>('[data-slot="sidebar-gap"]');
    const gap = findGap();
    if (gap) sidebarGapRef.current = gap;

    const update = () => {
      try {
        const w = sidebarGapRef.current ? Math.ceil(sidebarGapRef.current.getBoundingClientRect().width) : 0;
        setLeftOffset(`${w + 8}px`);
      } catch {
        setLeftOffset('0px');
      }
    };

    update();

    let ro: ResizeObserver | null = null;
    if (sidebarGapRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update());
      ro.observe(sidebarGapRef.current);
    }

    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      if (ro && sidebarGapRef.current) ro.unobserve(sidebarGapRef.current);
    };
  }, []);

  return leftOffset;
}
