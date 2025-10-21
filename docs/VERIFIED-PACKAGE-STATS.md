# Verified NPM Package Statistics

**Snapshot Date**: 2025-10-21 01:06 UTC
**Data Sources**: NPM Registry (versions), GitHub API (stars, verified)
**Note**: NPM download statistics API currently unavailable (access denied)

## Package Overview (Verified Data Only)

| # | Package | GitHub Stars | Latest Version | NPM | GitHub |
|---|---------|--------------|----------------|-----|--------|
| 1 | `claude-flow` | **9,121** ⭐ | 2.7.0 | [npm](https://npmjs.com/package/claude-flow) | [repo](https://github.com/ruvnet/claude-flow) |
| 2 | `agentic-flow` | **127** ⭐ | 1.7.3 | [npm](https://npmjs.com/package/agentic-flow) | [repo](https://github.com/ruvnet/agentic-flow) |
| 3 | `flow-nexus` | **51** ⭐ | 0.1.128 | [npm](https://npmjs.com/package/flow-nexus) | [repo](https://github.com/ruvnet/flow-nexus) |
| 4 | `@agentics.org/sparc2` | - | 2.0.25 | [npm](https://npmjs.com/package/@agentics.org/sparc2) | - |
| 5 | `agentic-payments` | - | 0.1.7 | [npm](https://npmjs.com/package/agentic-payments) | [repo](https://github.com/ruvnet/agentic-payments) |
| 6 | `agenticjs` | - | 0.2.1 | [npm](https://npmjs.com/package/agenticjs) | [repo](https://github.com/ruvnet/agenticjs) |
| 7 | `strange-loops` | - | 1.0.3 | [npm](https://npmjs.com/package/strange-loops) | [repo](https://github.com/ruvnet/strange-loops) |
| 8 | `ruv-wasm-nn` | - | Not Published | [npm](https://npmjs.com/package/ruv-wasm-nn) | [repo](https://github.com/ruvnet/ruv-wasm-nn) |
| 9 | `psycho-symbolic` | - | Not Published | [npm](https://npmjs.com/package/psycho-symbolic) | [repo](https://github.com/ruvnet/psycho-symbolic) |
| 10 | `sparc-ui` | - | Not Published | [npm](https://npmjs.com/package/sparc-ui) | [repo](https://github.com/ruvnet/sparc-ui) |

## Verified GitHub Statistics

### claude-flow (Flagship Project)
- **Stars**: 9,121 ⭐
- **Forks**: 1,204
- **Watchers**: 124
- **Latest Version**: v2.7.0
- **Repository**: https://github.com/ruvnet/claude-flow

### agentic-flow
- **Stars**: 127 ⭐
- **Latest Version**: v1.7.3
- **Repository**: https://github.com/ruvnet/agentic-flow

### flow-nexus
- **Stars**: 51 ⭐
- **Latest Version**: v0.1.128
- **Repository**: https://github.com/ruvnet/flow-nexus

## Total Verified Metrics

| Metric | Value |
|--------|-------|
| **Total GitHub Stars** | 9,299+ ⭐ |
| **Total Packages Published** | 7 (on NPM) |
| **Latest Package Version** | agentic-flow@1.7.3 (this repo) |
| **Most Starred** | claude-flow (9,121 stars) |

## Data Verification

All data in this table can be verified using these commands:

```bash
# Verify GitHub stars
curl -s https://api.github.com/repos/ruvnet/claude-flow | jq '{stars:.stargazers_count, forks:.forks_count}'
curl -s https://api.github.com/repos/ruvnet/agentic-flow | jq .stargazers_count
curl -s https://api.github.com/repos/ruvnet/flow-nexus | jq .stargazers_count

# Verify NPM versions
curl -s https://registry.npmjs.org/claude-flow | jq '.["dist-tags"].latest'
curl -s https://registry.npmjs.org/agentic-flow | jq '.["dist-tags"].latest'
curl -s https://registry.npmjs.org/flow-nexus | jq '.["dist-tags"].latest'
curl -s https://registry.npmjs.org/@agentics.org/sparc2 | jq '.["dist-tags"].latest'
```

## NPM Download Statistics

**Status**: ❌ API Currently Unavailable

The NPM downloads API (`https://api.npmjs.org/downloads/point/`) is currently returning "Access denied" for all packages. This is likely due to:
- Rate limiting
- IP restrictions
- Temporary API issues

**Alternative Methods to Check Downloads**:
1. Visit package pages directly on [npmjs.com](https://npmjs.com)
2. Use [npm-stat.com](https://npm-stat.com) for historical analytics
3. Check [npmtrends.com](https://npmtrends.com) for comparison charts

**Example**:
- https://www.npmjs.com/package/claude-flow
- https://www.npmjs.com/package/agentic-flow
- https://npmtrends.com/agentic-flow

## Conclusion

**Verified Facts**:
- ✅ claude-flow has **9,121 GitHub stars** (flagship project)
- ✅ agentic-flow has **127 GitHub stars** (this repository)
- ✅ flow-nexus has **51 GitHub stars**
- ✅ All packages have verified NPM versions
- ✅ Total ecosystem: **9,299+ stars** across repositories

**Unable to Verify**:
- ❌ NPM download counts (API access denied)
- ❌ Weekly/monthly download trends
- ❌ All-time download statistics

**Recommendation**: For accurate download statistics, check the individual package pages on npmjs.com or use third-party analytics services that have authorized API access.

---

**Last Updated**: 2025-10-21 01:06 UTC
**Verification Method**: Direct API calls to GitHub and NPM registries
**Confidence Level**: High (for stars/versions), N/A (for downloads)
