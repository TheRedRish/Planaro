# Domain docs

Skills like `improve-codebase-architecture`, `diagnose`, and `tdd` read domain documentation to understand the project's language and history.

## Layout: Single-context

This repo uses a **single-context** layout.

- **Domain Language:** `CONTEXT.md` at the repo root.
- **Decision Log:** `docs/adr/*.md`.

## Consumer Rules

- Always read `CONTEXT.md` first to understand the ubiquitious language and core domain models.
- When proposing a significant change, check `docs/adr/` for past decisions that might conflict or provide context.
- If a new decision is made, record it as a new ADR in `docs/adr/`.
