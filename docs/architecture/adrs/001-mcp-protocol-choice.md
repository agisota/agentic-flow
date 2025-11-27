# ADR 001: Model Context Protocol (MCP) as Primary Interface

**Status:** Accepted
**Date:** 2025-11-27
**Deciders:** Architecture Team

---

## Context

We need to select a protocol for exposing Playwright browser automation capabilities to AI models. The protocol must support:

1. Tool invocation (browser actions)
2. Resource access (pages, elements, screenshots)
3. Prompt templates (automation patterns)
4. Multiple transport mechanisms (stdio, HTTP, WebSocket)
5. Strong typing and schema validation
6. Extensibility for future features

### Options Considered

#### Option 1: Custom REST API
- Traditional HTTP REST API with JSON payloads
- Pros: Well-understood, wide tooling support, stateless
- Cons: No standard for AI integration, limited streaming, requires custom client libraries

#### Option 2: gRPC
- High-performance RPC framework with Protocol Buffers
- Pros: Strong typing, bidirectional streaming, code generation
- Cons: Complex setup, limited browser support, steep learning curve

#### Option 3: GraphQL
- Query language for APIs with type system
- Pros: Flexible queries, strong typing, single endpoint
- Cons: Overkill for command-style interface, caching complexity

#### Option 4: Model Context Protocol (MCP)
- Anthropic's standard protocol for AI-tool integration
- Pros: Purpose-built for AI, supports tools/resources/prompts, multiple transports, growing ecosystem
- Cons: Relatively new, smaller ecosystem than REST/gRPC

---

## Decision

**We will use the Model Context Protocol (MCP) as the primary interface for the Playwright automation agent.**

---

## Rationale

### 1. Purpose-Built for AI Integration
MCP was specifically designed for connecting AI models to external tools and data sources. It natively supports:
- Tool calling with JSON Schema validation
- Resource access with URI-based addressing
- Prompt templates for reusable patterns
- Notifications for async events

### 2. Multi-Transport Support
MCP supports multiple transport mechanisms out of the box:
- **Stdio**: Perfect for Claude CLI integration
- **HTTP**: For network-based clients
- **WebSocket**: For real-time bidirectional communication

This flexibility allows the same server to support different deployment scenarios without code changes.

### 3. Strong Typing
MCP requires JSON Schema definitions for all tool inputs, providing:
- Compile-time type checking (with TypeScript)
- Runtime validation
- Auto-generated documentation
- IDE autocomplete support

### 4. Growing Ecosystem
- Official SDK from Anthropic (@modelcontextprotocol/sdk)
- Integration with Claude CLI
- Community tools and servers
- Future-proof as AI-tool integration becomes standard

### 5. Resource Model
MCP's resource system (URI-based) naturally maps to browser concepts:
- `playwright:///page/{id}` → Page resources
- `playwright:///element/{id}` → Element resources
- `playwright:///screenshot/{id}` → Screenshot resources

This is more elegant than custom REST endpoints for each resource type.

### 6. Prompt Templates
MCP's prompt system enables reusable automation patterns:
- Login flows
- Scraping templates
- E2E test scenarios
- Form filling patterns

These can be shared and composed, reducing boilerplate for common tasks.

---

## Consequences

### Positive
- **Native Claude Integration**: Works seamlessly with Claude CLI
- **Reduced Boilerplate**: No need for custom client libraries
- **Type Safety**: JSON Schema validation prevents errors
- **Extensibility**: Easy to add new tools, resources, and prompts
- **Standard Interface**: Follows emerging AI-tool integration standard

### Negative
- **Learning Curve**: Team must learn MCP concepts
- **Ecosystem Size**: Smaller than REST/gRPC ecosystems
- **Debugging**: Fewer tools for debugging MCP vs HTTP
- **Protocol Evolution**: MCP spec may change (mitigated by versioning)

### Neutral
- **Custom Transports**: Can add HTTP/WebSocket transports for flexibility
- **Migration Path**: Could wrap MCP in REST API if needed
- **Versioning**: Must maintain protocol version compatibility

---

## Alternatives Considered but Rejected

### REST API
While REST is well-understood, it lacks:
- Standard tool calling semantics
- Resource modeling for AI
- Prompt template system
- Native AI integration

Building these on top of REST would essentially recreate MCP.

### gRPC
Excellent for service-to-service communication, but:
- Overkill for this use case
- Limited browser/client support
- No native AI integration patterns
- Complex tooling setup

### GraphQL
Designed for flexible data querying, but:
- Browser automation is command-driven, not query-driven
- No standard for tool invocation
- Caching/batching not needed for automation
- Schema complexity for simple operations

---

## Implementation Notes

1. Use `@modelcontextprotocol/sdk` TypeScript library
2. Start with stdio transport for Claude CLI
3. Add HTTP transport for network clients
4. Implement WebSocket for real-time features
5. Version the protocol (v1.0.0) for stability
6. Document all tools with JSON Schema
7. Create comprehensive prompt library

---

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude MCP Documentation](https://docs.anthropic.com/claude/docs/mcp)

---

## Review Schedule

- **Initial Review:** 2025-12-27 (1 month)
- **Full Review:** 2026-02-27 (3 months)

Review criteria:
- Developer satisfaction with MCP
- Client integration complexity
- Protocol stability
- Ecosystem growth
- Performance characteristics
