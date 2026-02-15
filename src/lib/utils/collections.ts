/**
 * Collection utilities - Helper functions for arrays, objects, etc.
 */

/**
 * Group array items by a key or predicate
 */
export function groupBy<T, K extends PropertyKey>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

/**
 * Partition array into two based on a predicate
 */
export function partition<T>(
  items: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  return items.reduce(
    ([pass, fail], item) => {
      return predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]];
    },
    [[], []] as [T[], T[]]
  );
}

/**
 * Create a unique array by a key
 */
export function uniqBy<T, K extends PropertyKey>(
  items: T[],
  keyFn: (item: T) => K
): T[] {
  const seen = new Set<K>();
  return items.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
