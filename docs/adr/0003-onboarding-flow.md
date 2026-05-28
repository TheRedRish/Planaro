# 3. Onboarding Flow

Date: 2026-05-28

## Status

Accepted

## Context

When a user logs into Planaro for the first time, the application requires access to sensitive Google Calendar data (both reading the Primary Calendar and writing to a new Planaro Calendar). Furthermore, the scheduling algorithm requires baseline constraints to function effectively. A structured onboarding flow is necessary to build trust, obtain informed consent, and gather initial data.

## Decision

We will implement a sequential onboarding flow consisting of the following discrete steps after the initial Google OAuth login:

1. **Permission Transparency:** A dedicated screen explaining data usage. It clarifies that Planaro reads the user's **Primary Calendar** to detect `Busy Blocks` and requires permission to create and manage a dedicated **Planaro Calendar**.
2. **Calendar Provisioning:** A screen requiring explicit user confirmation to create the **Planaro Calendar**. This sets expectations that Planaro will place its `Soft Commitments` (derived from `Proposals`) exclusively on this secondary calendar, keeping the Primary Calendar pristine.
3. **Baseline Routines Setup:** A preliminary data-gathering step to define core **Routines** (e.g., sleep schedule, working hours). This prevents the scheduling algorithm from making immediately poor suggestions in empty schedules.
4. **Welcome/Tutorial:** A brief orientation highlighting the **Staging Area** (where `Tasks` live) and the **Calendar Preview** (where the `Schedule` and `Proposals` are visualized).

## Consequences

*   **Trust and Compliance:** Explicitly separating data reading (Primary) from data writing (Planaro Calendar) builds user trust and clarifies the system's boundaries.
*   **Reduced Friction Later:** Gathering baseline `Routines` upfront prevents the "cold start" problem where the AI suggests a `Task` during standard sleeping hours.
*   **UI Complexity:** This introduces state management complexity for first-time logins versus returning users, requiring a robust router guard or onboarding state tracker.
