# Claude Agent SDK Sandbox Capabilities - Executive Summary

**Quick Reference Guide** | [Full Report](./claude-agent-sdk-sandbox-research.md)

---

## 🎯 Key Capabilities Overview

### Native Agent SDK (Docker-based)
- ✅ Process isolation via Docker containers
- ✅ 10 built-in tools (Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, NotebookEdit, TodoWrite)
- ✅ 213 MCP tools across 3 server types
- ✅ Multi-provider support (Anthropic, OpenRouter, Gemini, ONNX)
- ✅ <2s cold start, <500ms warm start
- ✅ 100-200MB memory footprint per agent

### E2B Cloud Sandboxes (Flow Nexus)
- ✅ Full VM isolation (~150ms startup)
- ✅ 6 templates (Node.js, Python, React, Next.js, Vanilla, Base)
- ✅ 24-hour session duration
- ✅ Pay-per-use ($0.10/hour)
- ✅ Complete filesystem isolation
- ✅ Process execution and network control

---

## 📊 Quick Comparison

| Feature | Docker Agent SDK | E2B Cloud Sandbox |
|---------|------------------|-------------------|
| **Isolation** | Process/Container | Full VM |
| **Startup** | <2s | ~150ms |
| **Cost** | Infrastructure | $0.10/hour |
| **Duration** | Unlimited | 24h max |
| **Internet** | Optional | Required |
| **Scaling** | Manual | Auto-scale |

---

## 🔧 Core APIs

### Agent SDK Query
```typescript
query({
  prompt: string,
  options: {
    model: 'claude-sonnet-4-5-20250929',
    permissionMode: 'bypassPermissions',
    allowedTools: ['Read', 'Write', 'Bash', ...],
    mcpServers: { ... }
  }
})
```

### E2B Sandbox Management
```javascript
// Create
mcp__flow-nexus__sandbox_create({
  template: 'node', // python, react, nextjs
  timeout: 3600,
  env_vars: { ... }
})

// Execute
mcp__flow-nexus__sandbox_execute({
  sandbox_id: 'id',
  code: 'console.log("Hello")',
  language: 'javascript'
})

// Cleanup
mcp__flow-nexus__sandbox_delete({ sandbox_id: 'id' })
```

---

## 🛡️ Security Model

### Isolation Levels
1. **Process Isolation**: Docker containers with controlled file/network access
2. **VM Isolation**: E2B sandboxes with complete separation
3. **Permission Modes**: Prompt vs bypass for tool execution
4. **Resource Quotas**: CPU, memory, disk, network limits

### Best Practices
- ✅ Use environment variables for secrets (never hardcode)
- ✅ Implement timeout controls for all operations
- ✅ Cleanup resources after execution
- ✅ Use allowedTools whitelist for production
- ✅ Enable 2FA for cloud sandbox accounts

---

## 💡 Common Patterns

### Pattern 1: Local Development
```typescript
// Docker-based multi-agent execution
const results = await Promise.all([
  claudeAgent(researcher, task1),
  claudeAgent(coder, task2),
  claudeAgent(tester, task3)
]);
```

### Pattern 2: Isolated Testing
```javascript
// E2B sandbox for integration tests
const sandbox = await mcp__flow-nexus__sandbox_create({
  template: 'node',
  install_packages: ['jest', 'supertest']
});

const result = await mcp__flow-nexus__sandbox_execute({
  sandbox_id: sandbox.sandbox_id,
  code: 'npm test'
});

await mcp__flow-nexus__sandbox_delete({ sandbox_id: sandbox.sandbox_id });
```

### Pattern 3: Hybrid Approach
```typescript
// Docker for dev, E2B for production
const sandbox = process.env.NODE_ENV === 'production'
  ? await createCloudSandbox()
  : await createDockerContainer();
```

---

## ⚠️ Key Limitations

### Agent SDK
- ❌ MCP incompatibility with some providers (Requesty)
- ⚠️ Docker dependency for full features
- ⚠️ Limited compared to VM isolation

### E2B Sandboxes
- ❌ 24-hour session limit
- ❌ Pay-per-use cost model
- ❌ Requires internet connectivity
- ⚠️ ~150ms cold start latency
- ⚠️ Authentication required

---

## 🎯 Use Case Recommendations

### Use Agent SDK (Docker) When:
- ✅ Developing and debugging locally
- ✅ Self-hosting infrastructure
- ✅ No cloud connectivity
- ✅ Cost-sensitive (infrastructure-only)
- ✅ Need full MCP tool access (213 tools)

### Use E2B Sandboxes When:
- ✅ Multi-tenant SaaS applications
- ✅ Executing untrusted code
- ✅ Need auto-scaling
- ✅ Quick prototyping without infrastructure
- ✅ Production isolated environments
- ✅ Geographic distribution required

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| Agent spawn time | 150+ agents in <2s |
| Cold start | <2s (Agent SDK), ~150ms (E2B) |
| Memory per agent | 100-200MB |
| Concurrent agents | 10+ (t3.small), 100+ (c6a.xlarge) |
| Tool discovery | 213 tools in <1s |
| Token efficiency | 32% reduction via coordination |

---

## 📚 Resources

- **Full Research Report**: [claude-agent-sdk-sandbox-research.md](./claude-agent-sdk-sandbox-research.md)
- **Agent SDK Docs**: https://docs.claude.com/en/api/agent-sdk/overview
- **E2B Docs**: https://e2b.dev/docs
- **Flow Nexus**: https://github.com/ruvnet/flow-nexus
- **Agentic Flow**: https://github.com/ruvnet/agentic-flow

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install @anthropic-ai/claude-agent-sdk
# Optional: Cloud sandboxes
npx flow-nexus@latest register
```

### 2. Basic Agent
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = query({
  prompt: "Analyze this codebase",
  options: {
    model: "claude-sonnet-4-5-20250929",
    allowedTools: ["Read", "Grep", "Bash"]
  }
});
```

### 3. Cloud Sandbox
```javascript
// Create sandbox
const sandbox = await mcp__flow-nexus__sandbox_create({
  template: 'node',
  name: 'dev-env'
});

// Execute code
await mcp__flow-nexus__sandbox_execute({
  sandbox_id: sandbox.sandbox_id,
  code: 'console.log("Hello from cloud!")'
});
```

---

**End of Summary** | [View Full Report](./claude-agent-sdk-sandbox-research.md)
