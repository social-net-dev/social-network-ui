# 📖 Documentation Structure

This file explains the organization of documentation in the ETECHS Social Network UI project.

## 📂 Documentation Locations

### Root Level Documentation

**Core documentation files:**

| File | Purpose |
|------|---------|
| [`README.md`](README.md) | Main project documentation and setup guide |
| [`AGENTS.md`](AGENTS.md) | AI agent guidelines and development workflow |
| [`openapi.yml`](openapi.yml) | Complete API specification (OpenAPI 3.0) |
| `DOCUMENTATION.md` | This file - documentation organization guide |

### Code Documentation

```
src/
├── features/
│   └── FEATURE_STRUCTURE.md     # Feature module guidelines
└── **/*.ts(x)                    # TypeScript types and inline comments
```
    ├── E2EE_TROUBLESHOOTING.md # E2EE troubleshooting guide
    ├── DISPLAY_NAME_README.md  # Display name feature
    └── SEARCH_USERS_README.md  # User search feature
```

## 🔍 How to Find Documentation

| **Need** | **Document** |
|----------|--------------|
| **Project setup?** | [`README.md`](README.md) |
| **AI agent guidelines?** | [`AGENTS.md`](AGENTS.md) |
| **API contract?** | [`openapi.yml`](openapi.yml) |
| **Feature structure?** | [`src/features/FEATURE_STRUCTURE.md`](src/features/FEATURE_STRUCTURE.md) |
| **E2EE implementation?** | `src/features/message/lib/e2ee.ts` + code comments |
| **API client usage?** | `src/lib/api/` + TypeScript types |

## 📝 Documentation Guidelines

When adding code:

1. **Use TypeScript types** for all data structures
2. **Add JSDoc comments** for public APIs and complex functions
3. **Document in code** with:
   - JSDoc comments for public APIs
   - TypeScript types for data structures
   - Inline comments for complex logic
4. **Update README** if adding major features

---

**Last updated:** 13 tháng 2, 2026
