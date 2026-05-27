# Triage labels

When the `triage` skill processes an incoming issue, it moves it through a state machine. To do that, it needs to apply labels that match the repo's configuration.

## Mapping

The following strings are used for the five canonical roles:

- **needs-triage** (default: `needs-triage`) — maintainer needs to evaluate
- **needs-info** (default: `needs-info`) — waiting on reporter
- **ready-for-agent** (default: `ready-for-agent`) — fully specified, AFK-ready
- **ready-for-human** (default: `ready-for-human`) — needs human implementation
- **wontfix** (default: `wontfix`) — will not be actioned

## Configuration

```json
{
  "needs-triage": "needs-triage",
  "needs-info": "needs-info",
  "ready-for-agent": "ready-for-agent",
  "ready-for-human": "ready-for-human",
  "wontfix": "wontfix"
}
```
