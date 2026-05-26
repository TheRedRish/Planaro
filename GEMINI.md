# GEMINI.md - Project Instructions

This file provides foundational guidance for AI agents working on the Planaro project.

## Architectural Principles

1. **Client-Heavy Architecture:** Most logic (scheduling algorithms, weather processing) should happen in the React client using React Query for server state management.
2. **Monorepo Structure:** Keep frontend and backend concerns separated in their respective directories but within the same repository.
3. **Type Safety:** Maintain strict TypeScript definitions for all data models and API responses.
4. **Shadcn UI:** Follow Shadcn UI patterns for component development. Use Tailwind CSS for all styling.
5. **Supabase Integration:** Use the Supabase client singleton for all backend interactions.

## Data Fetching & State

- Use `@tanstack/react-query` for all data fetching and mutations.
- Keep UI state (like modals, tabs) local to components or use Zustand if global state is needed.

## Integrations

- **Google Calendar:** Integration should be handled via Supabase Auth OAuth scopes. Ensure tokens are managed securely.

## Workflow

- **ADRs:** Document significant architectural decisions in `docs/adr/`.
- **Testing:** Verify changes locally before proposing deployment.
