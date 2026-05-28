# 8. Final UI Layout Principles

Date: 2026-05-28

## Status

Accepted

## Context

The user has requested a clean, professional, Minimalist/Swiss UI that prioritizes the calendar view while providing a temporary buffer for unscheduled tasks.

## Decision

The Planaro Dashboard will follow a three-part layout:

1. **Navigation/Header:** Minimal top bar for user profile, settings (Routines/Preferences), and login/logout.
2. **The Staging Area (Sidebar):** A collapsible left-side panel acting as a temporary buffer.
    * Supports "Quick Add" (input field at the top).
    * Displays a list of `Tasks` waiting to be scheduled.
    * Supports "Detail Expansion" via a popover or secondary side panel for fine-tuning task metadata.
3. **The Calendar Preview (Main Content):** A high-fidelity, 7-day weekly grid mimicking Google Calendar.
    * **Top Row:** Informational All-Day Events.
    * **Grid:** Timed `Hard Commitments` (from Primary Calendar) and `Soft Commitments` (from Planaro Calendar).
    * **Preview Mode:** Overlays ghosted `Proposals` with status badges (weather, routine icons) and tooltips.
    * **Current Time:** A horizontal red line indicating the present moment.

## Consequences

*   **Focus:** The UI centers the user's time (the Calendar) while keeping tools (Staging Area) accessible but secondary.
*   **Scalability:** This layout provides clear areas for future features (like weather overlays or routine management) without cluttering the primary view.
