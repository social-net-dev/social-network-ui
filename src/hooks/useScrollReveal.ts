import { useEffect, useRef } from 'react';

/**
 * Observes elements with the `.reveal` class inside a container ref
 * and adds `.is-visible` when they enter the viewport.
 *
 * Usage:
 *   const containerRef = useScrollReveal();
 *   <div ref={containerRef}>
 *     <div className="reveal">...</div>
 *     <div className="reveal reveal-d1">...</div>
 *   </div>
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  rootMargin = '0px 0px -60px 0px'
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.IntersectionObserver) return;

    const elements = Array.from(container.querySelectorAll<HTMLElement>('.reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Once visible, stop observing to avoid toggling
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [rootMargin]);

  return containerRef;
}
