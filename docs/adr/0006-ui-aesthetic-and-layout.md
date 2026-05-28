# 6. UI Aesthetic and Calendar Layout

Date: 2026-05-28

## Status

Accepted

## Context

The user finds the current UI inadequate and desires a professional, high-clarity interface. Since the application integrates deeply with Google Calendar, consistency with that user experience is critical for familiarity and reduced cognitive load.

## Decision

We will adopt a "Minimalist/Swiss" visual direction for the entire application, with a specific focus on the `Calendar Preview` mimicking Google Calendar:

1. **General Style:** High contrast, clean typography (sans-serif), generous whitespace, and a limited palette of grays with a single bold accent color for primary actions.
2. **Weekly View:** The default view for the `Calendar Preview` will be a 7-day grid (starting on Monday or Sunday based on locale), mirroring the horizontal "Day" and vertical "Hour" axis of Google Calendar.
3. **Event Distinction:** 
    * **Timed Events:** Displayed as blocks within the hourly grid.
    * **All-Day Events:** Displayed in a dedicated row at the top of each day's column, separate from the hourly grid.
4. **Current Time Indicator:** A horizontal line across the calendar grid indicating the present time, matching the Google Calendar visual cue.

## Consequences

*   **Familiarity:** Users transitioning from Google Calendar will find the interface intuitive.
*   **Development Constraint:** We must ensure our custom `Calendar Preview` component is flexible enough to handle these two distinct layout regions (top row vs. grid) accurately.
*   **Aesthetic Discipline:** Developers must avoid "visual clutter" and stick to the minimalist principles (e.g., no unnecessary borders, gradients, or shadows).
