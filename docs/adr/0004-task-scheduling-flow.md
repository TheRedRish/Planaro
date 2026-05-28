# 4. Task Scheduling Flow

Date: 2026-05-28

## Status

Accepted

## Context

Moving `Tasks` from the `Staging Area` to the user's `Schedule` involves a complex interaction between user intent and algorithmic optimization. We need a flow that allows the user to see the impact of the scheduling algorithm before it makes permanent (though "soft") changes to their Google Calendar.

## Decision

We will implement a "User-Initiated Preview and Commit" flow:

1. **Task Selection:** The user selects one or more `Tasks` from the `Staging Area`.
2. **Generation Trigger:** The user clicks a "Generate Plan" or "Schedule Selected" action.
3. **Preview Mode:** The `Calendar Preview` component enters a distinct state. It displays `Proposals` (ghosted or uniquely styled events) on the timeline. These are not yet saved to Google Calendar.
4. **Interactive Review:** The user can see why certain `Slots` were chosen (e.g., weather conditions, routine alignment).
5. **Commitment:** The user must explicitly click "Commit Plan" (or similar) to save these `Proposals`. Upon commitment, they become `Soft Commitments` on the dedicated **Planaro Calendar**.

## Consequences

*   **Transparency:** Users are never surprised by new events appearing on their calendar; they see and approve them first.
*   **Safety:** Errors in the scheduling logic or data (like incorrect weather) are caught by the user during the preview phase.
*   **UI State:** The application must handle a "Preview" state where UI actions (like adding new tasks or navigating the calendar) might be restricted or behave differently.
