# ADR 0002: Google Calendar Integration Strategy

## Status
Accepted

## Context
Planaro needs to read and write to the user's Google Calendar.

## Decision
We will use Supabase Auth with Google as the provider, requesting the necessary OAuth scopes for Google Calendar API access.

## Consequences
- **Pros:**
  - Seamless authentication flow for the user.
  - Supabase handles token refreshing and storage securely.
  - Direct API calls from the client can be made using the access token.
- **Cons:**
  - Dependent on Supabase's OAuth implementation.
  - Requires careful handling of token scopes and permissions.
