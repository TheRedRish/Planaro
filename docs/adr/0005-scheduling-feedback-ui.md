# 5. Scheduling Feedback UI

Date: 2026-05-28

## Status

Accepted

## Context

The scheduling algorithm makes decisions based on multiple `External Factors`, `Condition Tags`, and `Routines`. Without clear feedback, these decisions can appear arbitrary or confusing to the user. To build trust, the UI must explain the rationale behind each `Proposal`.

## Decision

We will implement a multi-layered feedback system for `Proposals` in `Preview Mode`:

1. **Status Badges:** `Proposals` on the `Calendar Preview` will display small icons (badges) representing the primary factors that influenced their placement (e.g., a sun icon for weather, a clock for routine alignment).
2. **Explanatory Tooltips:** Hovering over a `Proposal` or its badges will trigger a tooltip providing a plain-English explanation of the logic (e.g., "Scheduled here because clear skies are predicted and it fits your 'Exercise' routine").
3. **Reactive Warnings:** If a user manually moves a `Proposal` to a suboptimal slot, the UI will provide immediate visual feedback (e.g., the badge turning red) and a warning explaining the conflict (e.g., "High chance of rain during this period").

## Consequences

*   **Transparency:** Users can audit the AI's "thought process," leading to higher confidence in the system.
*   **Education:** Users learn how their `Condition Tags` and `Routines` interact with the scheduling engine.
*   **UI Density:** We must be careful to keep the `Calendar Preview` clean; badges should be subtle and tooltips should only appear on intent (hover/click).
