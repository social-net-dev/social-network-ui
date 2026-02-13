# Lib Utilities

Centralized utility functions used across the application.

## Modules

### `styles.ts`
CSS and Tailwind-related utilities.

- `cn()` - Merge Tailwind CSS classes with smart conflict resolution

### `collections.ts`
Array, object, and collection helper functions.

- `groupBy()` - Group array items by a key
- `partition()` - Split array into two based on a predicate
- `uniqBy()` - Create unique array by a key/function

## Usage

```typescript
import { cn, groupBy, partition } from '@/lib/utils';

// Merge Tailwind classes
const className = cn('p-4', condition && 'bg-red-500');

// Group items
const grouped = groupBy(users, user => user.department);

// Partition array
const [active, inactive] = partition(users, user => user.isActive);
```

## Export Structure

All utilities are re-exported from `index.ts` for convenience:

```typescript
// ✅ Preferred
import { cn, groupBy } from '@/lib/utils';

// ❌ Avoid
import { cn } from '@/lib/utils/styles';
```
