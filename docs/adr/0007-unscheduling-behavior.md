# 7. Unscheduling Behavior

Date: 2026-05-28

## Status

Accepted

## Context

Since Planaro acts as a scheduling engine for Google Calendar, users need a way to manage activities that have already been committed to their calendar. We need to define what happens when a user wants to "undo" a scheduling decision.

## Decision

We will implement a two-path "Unschedule" flow for `Soft Commitments` (events on the Planaro Calendar):

1. **Unschedule (Revert to Staging):** The user can select a `Soft Commitment` on the `Calendar Preview` and choose to "Unschedule" it. This action removes the event from the Google **Planaro Calendar** and returns the activity to the **Staging Area** as a `Task` (preserving its duration, tags, and preferences).
2. **Delete Permanently:** The user can choose to delete a `Soft Commitment` entirely. This removes it from both the Google Calendar and the Planaro ecosystem.
3. **External Sync:** If a user deletes a `Soft Commitment` directly via the Google Calendar interface, Planaro will treat it as "Deleted Permanently" and will not automatically return it to the **Staging Area**.

## Consequences

*   **User Control:** Users can easily iterate on their plans without losing the data associated with their tasks.
*   **State Synchronization:** The application must regularly poll or listen for changes to the **Planaro Calendar** to ensure the `Staging Area` and `Calendar Preview` remain accurate representations of the user's intent.
