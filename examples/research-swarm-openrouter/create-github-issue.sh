#!/bin/bash
# Script to create GitHub issue for OpenRouter provider selection fix

set -e

ISSUE_FILE="examples/research-swarm-openrouter/GITHUB_ISSUE.md"

echo "╔════════════════════════════════════════════════════╗"
echo "║  Creating GitHub Issue via CLI                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo ""
    echo "Install with:"
    echo "  macOS:   brew install gh"
    echo "  Linux:   sudo apt install gh"
    echo "  Windows: winget install GitHub.cli"
    echo ""
    echo "Or visit: https://cli.github.com/"
    exit 1
fi

echo "✓ GitHub CLI found"

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "⚠️  Not authenticated with GitHub"
    echo ""
    echo "Authenticate with:"
    echo "  gh auth login"
    echo ""
    read -p "Would you like to authenticate now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh auth login
    else
        echo "❌ Authentication required to create issues"
        exit 1
    fi
fi

echo "✓ GitHub authentication verified"
echo ""

# Check if issue file exists
if [ ! -f "$ISSUE_FILE" ]; then
    echo "❌ Error: Issue file not found: $ISSUE_FILE"
    exit 1
fi

echo "✓ Issue file found"
echo ""

# Create the issue
echo "Creating GitHub issue..."
echo ""

gh issue create \
  --repo ruvnet/agentic-flow \
  --title "Research-Swarm Forces Anthropic Provider Despite OpenRouter Configuration" \
  --body-file "$ISSUE_FILE" \
  --label "enhancement,cost-optimization,provider-selection,research-swarm,documentation" \
  --assignee ruvnet

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  ✅ GitHub Issue Created Successfully!            ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "View all issues: https://github.com/ruvnet/agentic-flow/issues"
else
    echo ""
    echo "❌ Failed to create issue (exit code: $EXIT_CODE)"
    echo ""
    echo "Manual steps:"
    echo "1. Go to: https://github.com/ruvnet/agentic-flow/issues/new"
    echo "2. Copy content from: $ISSUE_FILE"
    echo "3. Add labels: enhancement, cost-optimization, provider-selection, research-swarm, documentation"
    echo "4. Assign to: @ruvnet"
    exit 1
fi
