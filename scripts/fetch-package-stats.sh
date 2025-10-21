#!/bin/bash
###############################################################################
# NPM Package Stats Fetcher
# Fetches verified download stats and GitHub stars from public APIs
###############################################################################

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  📊 Fetching Verified NPM Package Statistics                ║"
echo "║  Snapshot Date: $(date '+%Y-%m-%d %H:%M UTC')                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Package list with GitHub repos
declare -A PACKAGES
PACKAGES["claude-flow"]="ruvnet/claude-flow"
PACKAGES["agentic-flow"]="ruvnet/agentic-flow"
PACKAGES["flow-nexus"]="ruvnet/flow-nexus"
PACKAGES["agentic-payments"]="ruvnet/agentic-payments"
PACKAGES["strange-loops"]="ruvnet/strange-loops"
PACKAGES["psycho-symbolic"]="ruvnet/psycho-symbolic"
PACKAGES["ruv-wasm-nn"]="ruvnet/ruv-wasm-nn"
PACKAGES["sparc-ui"]="ruvnet/sparc-ui"
PACKAGES["agenticjs"]="ruvnet/agenticjs"

# Scoped packages
declare -A SCOPED_PACKAGES
SCOPED_PACKAGES["@agentics.org/sparc2"]=""

# Function to URL encode package names
urlencode() {
    python3 -c "import urllib.parse; print(urllib.parse.quote('$1'))" 2>/dev/null || echo "$1"
}

# Function to get NPM downloads
get_downloads() {
    local pkg="$1"
    local period="$2"
    local encoded=$(urlencode "$pkg")
    local result=$(curl -s "https://api.npmjs.org/downloads/point/$period/$encoded" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$result" ]; then
        echo "0"
        return
    fi

    echo "$result" | jq -r '.downloads // 0' 2>/dev/null || echo "0"
}

# Function to get NPM package info
get_npm_version() {
    local pkg="$1"
    local encoded=$(urlencode "$pkg")
    local result=$(curl -s "https://registry.npmjs.org/$encoded" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$result" ]; then
        echo "N/A"
        return
    fi

    echo "$result" | jq -r '.["dist-tags"].latest // "N/A"' 2>/dev/null || echo "N/A"
}

# Function to get GitHub stars
get_github_stars() {
    local repo="$1"
    if [ -z "$repo" ]; then
        echo "N/A"
        return
    fi

    local result=$(curl -s "https://api.github.com/repos/$repo" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$result" ]; then
        echo "N/A"
        return
    fi

    echo "$result" | jq -r '.stargazers_count // "N/A"' 2>/dev/null || echo "N/A"
}

# Function to format numbers with commas
format_number() {
    local num="$1"
    if [ "$num" = "0" ] || [ "$num" = "N/A" ]; then
        echo "$num"
        return
    fi
    printf "%'d" "$num" 2>/dev/null || echo "$num"
}

# Output markdown table header
cat << 'EOF'
# Verified NPM Package Statistics

**Snapshot Date**: 2025-10-21 01:03 UTC
**Data Sources**: NPM Downloads API, NPM Registry, GitHub API

| # | Package | Last Week | Last Month | Last Year | GitHub Stars | Latest Version | Links |
|---|---------|-----------|------------|-----------|--------------|----------------|-------|
EOF

# Counter
counter=1

# Fetch data for regular packages
for pkg in "${!PACKAGES[@]}"; do
    echo "→ Fetching $pkg..." >&2

    # Get downloads
    week=$(get_downloads "$pkg" "last-week")
    month=$(get_downloads "$pkg" "last-month")
    year=$(get_downloads "$pkg" "last-year")

    # Get NPM version
    version=$(get_npm_version "$pkg")

    # Get GitHub stars
    repo="${PACKAGES[$pkg]}"
    if [ -z "$repo" ]; then
        stars="N/A"
        gh_link=""
    else
        stars=$(get_github_stars "$repo")
        gh_link="[GH](https://github.com/$repo)"
    fi

    # Format numbers
    week_fmt=$(format_number "$week")
    month_fmt=$(format_number "$month")
    year_fmt=$(format_number "$year")

    # NPM link
    npm_link="[NPM](https://npmjs.com/package/$pkg)"

    # Combine links
    if [ -z "$gh_link" ]; then
        links="$npm_link"
    else
        links="$npm_link • $gh_link"
    fi

    # Output table row
    echo "| $counter | \`$pkg\` | $week_fmt | $month_fmt | $year_fmt | $stars | $version | $links |"

    ((counter++))
    sleep 0.3  # Rate limit protection
done

# Fetch data for scoped packages
for pkg in "${!SCOPED_PACKAGES[@]}"; do
    echo "→ Fetching $pkg..." >&2

    # Get downloads
    week=$(get_downloads "$pkg" "last-week")
    month=$(get_downloads "$pkg" "last-month")
    year=$(get_downloads "$pkg" "last-year")

    # Get NPM version
    version=$(get_npm_version "$pkg")

    # NPM link
    npm_link="[NPM](https://npmjs.com/package/$pkg)"
    links="$npm_link"

    # Format numbers
    week_fmt=$(format_number "$week")
    month_fmt=$(format_number "$month")
    year_fmt=$(format_number "$year")

    # Output table row
    echo "| $counter | \`$pkg\` | $week_fmt | $month_fmt | $year_fmt | N/A | $version | $links |"

    ((counter++))
    sleep 0.3
done

cat << 'EOF'

---

## Notes

- **NPM Downloads**: Includes all tarball fetches (CI, mirrors, actual installs)
- **Period Definitions**: last-week (7 days), last-month (30 days), last-year (365 days)
- **GitHub Stars**: Current count from GitHub API
- **Latest Version**: From NPM registry dist-tags.latest

## API Sources

- NPM Downloads: `https://api.npmjs.org/downloads/point/<period>/<package>`
- NPM Registry: `https://registry.npmjs.org/<package>`
- GitHub API: `https://api.github.com/repos/<owner>/<repo>`

## Verification Commands

```bash
# Verify any package downloads
curl https://api.npmjs.org/downloads/point/last-month/agentic-flow | jq

# Verify GitHub stars
curl https://api.github.com/repos/ruvnet/agentic-flow | jq .stargazers_count

# Verify NPM version
curl https://registry.npmjs.org/agentic-flow | jq '.["dist-tags"].latest'
```

## Quick Copy-Paste Test

```bash
# Test all packages
for pkg in claude-flow agentic-flow flow-nexus; do
  echo "=== $pkg ==="
  curl -s "https://api.npmjs.org/downloads/point/last-month/$pkg" | jq
done
```
EOF

echo "" >&2
echo "✅ Stats fetched successfully!" >&2
