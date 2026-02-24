# ADR-055: Documentation-Implementation Parity Enforcement

## Status

Accepted

## Date

2026-02-24

## Context

A comprehensive review of the agentic-flow codebase reveals systematic gaps between what is documented and what is implemented. These gaps erode user trust, cause runtime failures, and make onboarding difficult. This ADR establishes a parity enforcement strategy.

### Gap Summary

| Area | Documented | Implemented | Parity |
|------|-----------|-------------|--------|
| MCP Tools | 213+ | 18 | 8.5% |
| CLI Commands | 8 core + 45 sub | 3 core + ~15 sub | ~33% |
| Agent Types | 60+ | 28+ definitions | ~47% |
| Hook Events | 17 types | 10 types | ~59% |
| Packages | 9 described | 9 exist | 100% |
| Build/Test | Documented | Working | ~90% |

### Key Documentation Mismatches

**1. Package Name (`@claude-flow/cli` vs `agentic-flow`)**

CLAUDE.md and multiple docs reference `npx @claude-flow/cli@latest` which does not exist as a package. The actual CLI is:
- `npx agentic-flow` - main CLI
- `npx agentdb` - database CLI
- `npx claude-flow@alpha` - MCP server (external)

This single mismatch invalidates dozens of documented examples.

**2. Feature Claims Without Implementation**

The root README.md and package.json claim:
- "213+ MCP tools" (18 implemented)
- "Full daemon management" (not implemented)
- "17 hook types with 12 workers" (10 hook types, no workers CLI)
- "Hive-mind consensus" (not in CLI, partial MCP)
- "GitHub integration tools" (0 implemented in MCP)

**3. Architecture Docs vs Reality**

| Document | Claims | Reality |
|----------|--------|---------|
| CLAUDE.md V3 CLI table | 8 commands, 45+ subcommands | 3 commands implemented |
| CLAUDE.md Memory Reference | `memory store/search/list/retrieve` | MCP only, not CLI |
| README.md performance | "150x-12,500x search improvement" | Benchmark infrastructure exists, not all claims verified |
| README.md tools count | "213+ MCP tools" | 18 in stdio-full.ts |

### Root Causes

1. **Documentation-first development**: Features documented before implementation
2. **MCP/CLI split**: Features built in MCP but documented as CLI commands
3. **External packages**: Some features in external npm packages (claude-flow@alpha) not in this repo
4. **Aspirational versioning**: V3 features documented while V2 is shipping

## Decision

### Principle: Documentation Must Not Lead Implementation

All documentation must accurately reflect current capabilities. Planned features must be clearly marked.

### Implementation

**1. CLAUDE.md Accuracy Pass (Immediate)**

- Replace all `@claude-flow/cli` references with `agentic-flow`
- Add status column to V3 CLI Commands table:

```markdown
| Command | Subcommands | Status |
|---------|-------------|--------|
| `init` | 4 | CLI: config only |
| `agent` | 8 | CLI: 4 implemented |
| `swarm` | 6 | MCP only |
| `memory` | 11 | MCP only |
| `task` | 6 | MCP only |
| `session` | 7 | Not implemented |
| `hooks` | 17 | Settings only |
| `hive-mind` | 6 | Not implemented |
```

- Add availability legend: CLI / MCP / Planned

**2. README.md Truth Reconciliation (Week 1)**

- Replace "213+ MCP tools" with actual count
- Add "Feature Status" section with implemented/planned/experimental tags
- Remove unimplemented features from main feature list, move to roadmap section

**3. Feature Status Tags (Standard)**

All feature documentation must use one of:
- `[STABLE]` - Fully implemented, tested, documented
- `[BETA]` - Implemented but may change
- `[MCP-ONLY]` - Available through MCP tools, not CLI
- `[PLANNED]` - Documented design, not yet implemented
- `[EXPERIMENTAL]` - Partial implementation, may be unstable

**4. Automated Parity Checks (Month 1)**

Add CI check that:
- Parses CLAUDE.md command tables
- Verifies each documented command has a corresponding implementation
- Flags new documentation that references unimplemented features
- Reports parity percentage in PR checks

**5. Living Documentation Pattern**

Each major module maintains its own status:
```
docs/
  adr/           # Architecture decisions (this directory)
  status/        # Auto-generated feature status
  roadmap/       # Planned features with milestones
```

### Migration of Existing Docs

| Document | Action | Priority |
|----------|--------|----------|
| CLAUDE.md | Fix package names, add status column | Immediate |
| README.md | Reconcile feature claims | Week 1 |
| docs/INDEX.md | Add status tags | Week 1 |
| Package READMEs | Verify all examples work | Week 2 |
| API docs | Audit against actual exports | Week 2 |

## Consequences

### Positive
- Users can trust that documented features work
- Onboarding experience dramatically improved
- Clear roadmap for what's planned vs available
- CI prevents documentation drift going forward

### Negative
- Revealing the gap may concern existing users
- Significant effort to audit all documentation
- CI parity check requires maintenance as code evolves

### Cultural Shift
- Feature development must include documentation updates
- PRs that add docs for unimplemented features must use `[PLANNED]` tag
- Release notes must reference actual capability changes

## References

- CLAUDE.md: Root project instructions
- README.md: Root project overview
- CLI Entry: `agentic-flow/src/cli-proxy.ts`
- MCP Tools: `agentic-flow/src/mcp/fastmcp/servers/stdio-full.ts`
- Agent Definitions: `.claude/agents/` (28+ files)
- Command Definitions: `.claude/commands/` (180+ files)
- All ADRs: `docs/adr/ADR-051` through `ADR-055`
