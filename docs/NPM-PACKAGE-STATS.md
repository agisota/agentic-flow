╔══════════════════════════════════════════════════════════════╗
║  📊 Fetching Verified NPM Package Statistics                ║
║  Snapshot Date: 2025-10-21 01:04 UTC                        ║
╚══════════════════════════════════════════════════════════════╝

# Verified NPM Package Statistics

**Snapshot Date**: 2025-10-21 01:03 UTC
**Data Sources**: NPM Downloads API, NPM Registry, GitHub API

| # | Package | Last Week | Last Month | Last Year | GitHub Stars | Latest Version | Links |
|---|---------|-----------|------------|-----------|--------------|----------------|-------|
→ Fetching flow-nexus...
| 1 | `flow-nexus` | 0 | 0 | 0 | 51 | 0.1.128 | [NPM](https://npmjs.com/package/flow-nexus) • [GH](https://github.com/ruvnet/flow-nexus) |
→ Fetching strange-loops...
| 2 | `strange-loops` | 0 | 0 | 0 | N/A | 1.0.3 | [NPM](https://npmjs.com/package/strange-loops) • [GH](https://github.com/ruvnet/strange-loops) |
→ Fetching agentic-flow...
| 3 | `agentic-flow` | 0 | 0 | 0 | 127 | 1.7.3 | [NPM](https://npmjs.com/package/agentic-flow) • [GH](https://github.com/ruvnet/agentic-flow) |
→ Fetching agentic-payments...
| 4 | `agentic-payments` | 0 | 0 | 0 | N/A | 0.1.7 | [NPM](https://npmjs.com/package/agentic-payments) • [GH](https://github.com/ruvnet/agentic-payments) |
→ Fetching agenticjs...
| 5 | `agenticjs` | 0 | 0 | 0 | N/A | 0.2.1 | [NPM](https://npmjs.com/package/agenticjs) • [GH](https://github.com/ruvnet/agenticjs) |
→ Fetching ruv-wasm-nn...
| 6 | `ruv-wasm-nn` | 0 | 0 | 0 | N/A | N/A | [NPM](https://npmjs.com/package/ruv-wasm-nn) • [GH](https://github.com/ruvnet/ruv-wasm-nn) |
→ Fetching psycho-symbolic...
| 7 | `psycho-symbolic` | 0 | 0 | 0 | N/A | N/A | [NPM](https://npmjs.com/package/psycho-symbolic) • [GH](https://github.com/ruvnet/psycho-symbolic) |
→ Fetching sparc-ui...
| 8 | `sparc-ui` | 0 | 0 | 0 | N/A | N/A | [NPM](https://npmjs.com/package/sparc-ui) • [GH](https://github.com/ruvnet/sparc-ui) |
→ Fetching claude-flow...
| 9 | `claude-flow` | 0 | 0 | 0 | 9121 | 2.7.0 | [NPM](https://npmjs.com/package/claude-flow) • [GH](https://github.com/ruvnet/claude-flow) |
→ Fetching @agentics.org/sparc2...
| 10 | `@agentics.org/sparc2` | 0 | 0 | 0 | N/A | 2.0.25 | [NPM](https://npmjs.com/package/@agentics.org/sparc2) |

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

✅ Stats fetched successfully!
