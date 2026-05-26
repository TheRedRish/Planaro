# GEMINI.md - Project Instructions

This file provides foundational guidance for AI agents working on the Planaro project.

## Architectural Principles

1. **Client-Heavy Architecture:** Most logic (scheduling algorithms, weather processing) should happen in the React client using React Query for server state management.
2. **Monorepo Structure:** Keep frontend and backend concerns separated in their respective directories but within the same repository.
3. **Type Safety:** Maintain strict TypeScript definitions for all data models and API responses.
4. **Shadcn UI:** Follow Shadcn UI patterns for component development. Use Tailwind CSS for all styling.
## Supabase Integration

- **Local-First Development:** Always use the Supabase CLI for backend development. Never make schema changes directly in the Supabase Dashboard SQL editor.
- **Migrations:** All database changes must be captured in migration files located in `backend/supabase/migrations/`. Use `supabase migration new <name>` to create them.
- **Deployment:** Use `supabase db push` to apply local migrations to the production environment.
- **Edge Functions:** Logic that requires server-side execution (e.g., background calendar syncing) should be implemented as Supabase Edge Functions in `backend/supabase/functions/`.
- **Client Singleton:** Use the Supabase client singleton (`@/lib/supabase/client`) for all frontend interactions.

## Data Fetching & State

- Use `@tanstack/react-query` for all data fetching and mutations.
- Keep UI state (like modals, tabs) local to components or use Zustand if global state is needed.

## Integrations

- **Google Calendar:** Integration should be handled via Supabase Auth OAuth scopes. Ensure tokens are managed securely.

## Workflow

- **ADRs:** Document significant architectural decisions in `docs/adr/`.
- **Testing:** Verify changes locally before proposing deployment.
