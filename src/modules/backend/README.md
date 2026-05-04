# Backend Module

**OWNER: TEAM_MEMBER_3 (Backend/Database Lead)**

## Responsibilities

- Supabase client configuration
- Authentication (email/password, JWT)
- Role-based access control
- API communication
- Database schema + queries
- Session management

## Key Files

- `supabaseClient.js` — Supabase client (env-based)
- `auth.js` — Authentication utilities

## Module Boundary

**Imports from:** None (external-only)
**Exports to:** `SimulationContext`, `@ui/pages/` (auth pages)
**Do NOT import from:** `@sim`, `@ai` directly

## Integration Point

Backend via `SimulationContext.jsx`:
- `supabase.from('issues').insert()`
- `supabase.from('complaints').select()`
- Auth checks via `useAuth()` hook

## Development Workflow

1. Create branch: `git checkout -b backend-work`
2. Edit files inside `src/modules/backend/`
3. Import using `@backend/supabaseClient`
4. Test: `npm run dev` → verify auth + DB queries
5. Merge: PR must include `.env` update docs
