# Ubiquitous Language

This document defines the core domain terms used in the Planaro codebase.

- **Plan**: The discrete output of the scheduling algorithm; a collection of proposed activities before they are committed.
- **Schedule**: The user's source-of-truth timeline (representing their Google Calendar state).
- **Activity**: The base term for anything a user intends to do or has scheduled. Activities can have associated context such as locations, checklists, or participants.
- **Task**: An `Activity` that requires a duration but has not yet been assigned a specific time on the `Schedule`.
- **Event**: An `Activity` that has a fixed start and end time on the `Schedule`.
- **All-Day Event**: An informational `Activity` displayed at the top of the `Schedule`. These do not create `Busy Blocks` unless they are explicitly marked as a "Busy" `Hard Commitment` (e.g., "Out of Office").
- **Constraint**: A hard limit that the scheduling algorithm must satisfy (e.g., a specific deadline or working hours).
- **Preference**: A soft influence on the scheduling algorithm (e.g., a user's desire to do certain activities in specific weather).
- **External Factor**: A dynamic data point outside of the user's direct control, such as weather or traffic, that informs scheduling decisions.
- **Slot**: A proposed time window (start time and duration) on the `Schedule` where an `Activity` could be placed.
- **Hard Commitment**: An `Event` that cannot be moved by Planaro (e.g., a manually created Google Calendar event or a "locked" Planaro event).
- **Soft Commitment**: An `Event` scheduled by Planaro. These live on the dedicated **Planaro Calendar**. The scheduling algorithm is allowed to re-schedule these if better `Slots` become available or `Hard Commitments` conflict with them.
- **Planaro Calendar**: The source of truth for all `Soft Commitments`. Planaro reads from and writes to this secondary calendar to manage the user's flexible schedule.
- **Primary Calendar**: The user's main Google Calendar where `Hard Commitments` (appointments, meetings, etc.) are typically stored. Planaro treats these as immutable blocks.
- **Routine**: A recurring period defined in Planaro settings (e.g., "Working Hours", "Sleep", "Exercise") that acts as a `Constraint` but is not necessarily an `Event` on the `Schedule`.
- **Busy Block**: Any time window on the `Schedule` that is unavailable for new `Slots` due to a `Hard Commitment`, `Soft Commitment`, or `Routine`.
- **Condition Tag**: A label attached to an `Activity` (e.g., "Outdoor", "Requires Clear Skies") that influences how the scheduling algorithm ranks available `Slots` based on `External Factors`.
- **Proposal**: A specific `Slot` presented to the user as a recommendation for an `Activity`.
- **User Profile**: A collection of persistent `Preferences` and `Routines` (e.g., "no activities after 20:00") that guide the scheduling algorithm.
- **Preference Export**: A standardized JSON format used to import or update the `User Profile` with preferences generated outside of the application.
- **External AI**: A third-party AI service (chosen by the user) used to process a Planaro-provided prompt into a `Preference Export`.
- **Staging Area**: A temporary UI buffer containing `Tasks` that have not yet been assigned a `Slot` on the `Schedule`. Once a `Task` is committed, it is removed from the `Staging Area` and becomes a `Soft Commitment` on the `Planaro Calendar`.
- **Calendar Preview**: A custom UI component that displays the user's `Schedule` and allows for interactive visualization of `Proposals`.
