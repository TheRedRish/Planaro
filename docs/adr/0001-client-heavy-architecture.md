# ADR 0001: Client-Heavy Architecture

## Status
Accepted

## Context
Planaro requires complex scheduling logic that takes into account user preferences, current schedule, and external factors like weather. We need to decide where this logic should live.

## Decision
We will implement a client-heavy architecture where the scheduling algorithms and data processing happen primarily in the React frontend.

## Consequences
- **Pros:**
  - Reduced latency for interactive scheduling adjustments.
  - Lower cost (less compute needed on Supabase Edge Functions).
  - Easier debugging of the scheduling logic during development.
- **Cons:**
  - Potential performance impact on lower-end devices if algorithms become very complex.
  - Scheduling logic is exposed in the client-side bundle.
