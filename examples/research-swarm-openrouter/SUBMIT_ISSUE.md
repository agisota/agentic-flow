# How to Submit the GitHub Issue

## Quick Submit (Automated)

Run the automated script:

```bash
cd /home/user/agentic-flow
./examples/research-swarm-openrouter/create-github-issue.sh
```

This script will:
1. ✓ Check GitHub CLI is installed
2. ✓ Verify authentication
3. ✓ Create the issue automatically with all labels and assignments

## Manual Submit (Web Interface)

If the automated script doesn't work:

### Step 1: Navigate to GitHub
Go to: https://github.com/ruvnet/agentic-flow/issues/new

### Step 2: Copy Issue Content
```bash
cat examples/research-swarm-openrouter/GITHUB_ISSUE.md
```

Copy the entire content.

### Step 3: Fill in Issue Form

**Title:**
```
Research-Swarm Forces Anthropic Provider Despite OpenRouter Configuration
```

**Description:**
Paste the content from GITHUB_ISSUE.md

**Labels:** (Add these)
- `enhancement`
- `cost-optimization`
- `provider-selection`
- `research-swarm`
- `documentation`

**Assignees:**
- `@ruvnet`

**Milestone:** (optional)
- `v1.11.0`

### Step 4: Submit
Click "Submit new issue"

---

## Alternative: Use GitHub CLI Directly

If you have GitHub CLI installed and authenticated:

```bash
gh issue create \
  --repo ruvnet/agentic-flow \
  --title "Research-Swarm Forces Anthropic Provider Despite OpenRouter Configuration" \
  --body-file examples/research-swarm-openrouter/GITHUB_ISSUE.md \
  --label "enhancement,cost-optimization,provider-selection,research-swarm,documentation" \
  --assignee ruvnet
```

---

## Verify Submission

After creating the issue, you should see:
- Issue number (e.g., #123)
- Issue URL (e.g., https://github.com/ruvnet/agentic-flow/issues/123)
- Labels applied
- Assignee set to @ruvnet

---

## Issue Summary

The issue documents:
- ✅ 5 root causes of provider selection problem
- ✅ Cost impact analysis (99% savings)
- ✅ 3 immediate workarounds
- ✅ Long-term fix proposals
- ✅ Verification results
- ✅ Testing instructions
- ✅ Complete code diffs

**File Size**: 416 lines
**Status**: Ready to submit
**Branch**: claude/research-swarm-openrouter-setup-011CUvoW8gw2QvWDiM4aQd2x
