# Planaro

Planaro helps you structure your day by turning tasks, groceries, errands, and activity ideas into smart calendar plans. It considers your schedule, preferences, and factors like the weather to help you plan what to do and when to do it.

## Tech Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **UI Components:** Shadcn UI
- **State Management:** React Query
- **Backend:** Supabase (Auth, Database, Storage)
- **Integrations:** Google Calendar API

## Project Structure

```
Planaro/
├── frontend/        # Vite React application
├── backend/         # Supabase configuration and migrations
└── docs/            # Project documentation and ADRs
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase CLI
- Vercel CLI (for deployment)

### Local Setup

1. **Clone the repo**
2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Backend Setup:**
   ```bash
   cd backend
   npx supabase start
   ```

## Deployment

- **Frontend:** Deployed on Vercel.
- **Backend:** Deployed on Supabase (Free Tier).

## Documentation

- [GEMINI.md](./GEMINI.md) - Instructions for AI agents.
- [Architecture Decision Records](./docs/adr/) - Detailed architectural choices.
