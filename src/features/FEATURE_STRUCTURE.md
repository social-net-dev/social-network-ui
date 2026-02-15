# Feature Folder Structure Guidelines

## Standard Feature Folder Structure

Every feature folder should follow this consistent structure:

```
src/features/[feature]/
├── components/       # Feature-specific UI components (required)
├── pages/           # Route pages/screens (required)
├── hooks/           # Feature-specific React hooks (optional, add when needed)
├── types/           # Feature-specific TypeScript types/interfaces (optional, add when needed)
├── constants/       # Feature-specific constants (optional, add when needed)
├── lib/             # Feature-specific utilities (optional, add when needed)
├── utils/           # Feature-specific helper functions (optional, add when needed)
├── api/ (deprecated)# Use generated hooks from @/lib/api instead
├── services/ (deprecated) # Use generated hooks from @/lib/api instead
├── routes.tsx       # Route definitions (if using feature-based routing)
└── README.md        # Feature documentation (optional)
```

## Rules

1. **Only create folders that are actually used** - Don't create empty directories
2. **components/** - Shared components within the feature
3. **pages/** - Route page components
4. **hooks/** - Custom hooks specific to this feature
5. **types/** - TypeScript interfaces/types for this feature
6. **constants/** - Feature constants (configs, enum-like objects)
7. **Api Integration** - Use generated hooks from `@/lib/api/generated` instead of manual services
8. **Imports** - Use `@/features/[feature]/...` to import from same feature

## Examples

✅ **Well-structured feature:**
```
features/home/
├── components/
│   ├── FeedCard.tsx
│   ├── PostComposer.tsx
│   └── ExploreGrid.tsx
├── hooks/
│   ├── useFeedPosts.ts
│   └── useExploreFilters.ts
├── pages/
│   ├── FeedPage.tsx
│   └── ExplorePage.tsx
├── types/
│   └── feed.types.ts
├── constants/
│   └── feed.constants.ts
└── routes.tsx
```

❌ **Avoid:**
- Empty folders with no content
- Duplicate type definitions across features (use @/types for global types)
- Manual API services (use generated hooks from @/lib/api/generated)
- Mixing business logic with UI components
