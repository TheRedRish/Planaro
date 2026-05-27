# Issue tracker: GitHub

The "issue tracker" is where issues live for this repo.

This repo uses **GitHub Issues** via the `gh` CLI.

## Workflows

### Reading issues

To list open issues:

```bash
gh issue list
```

To view a specific issue:

```bash
gh issue view <number>
```

### Creating issues

To create a new issue:

```bash
gh issue create --title "..." --body "..."
```

### Triaging issues

To apply labels (like the ones in `triage-labels.md`):

```bash
gh issue edit <number> --add-label "<label>"
```
