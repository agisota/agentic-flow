# ADR-001: Use agentic-flow for Swarm Orchestration

**Status:** Accepted
**Date:** 2025-11-01
**Decision Makers:** System Architecture Designer, Research Team
**Technical Story:** Swarm orchestration platform selection

---

## Context

The swarm shutdown resistance research requires a robust multi-agent orchestration system capable of:

1. **Multiple Topology Support**: Hierarchical, mesh, and adaptive topologies
2. **Agent Lifecycle Management**: Spawn, monitor, shutdown agents
3. **Coordination Mechanisms**: Inter-agent communication and coordination
4. **Learning Integration**: Support for ReasoningBank and neural training
5. **Metrics Collection**: Comprehensive instrumentation
6. **Ease of Use**: Rapid prototyping and experimentation

### Alternatives Considered

#### Option 1: agentic-flow (claude-flow@alpha)
**Pros:**
- Native support for hierarchical, mesh, and adaptive topologies
- Built-in ReasoningBank integration
- NPX-based, no installation required
- Comprehensive CLI with metrics support
- Active development and community
- Designed specifically for swarm intelligence research

**Cons:**
- Alpha version, potential stability issues
- CLI overhead for programmatic control
- API may change between versions
- Limited to Node.js ecosystem

#### Option 2: Custom Framework (Build from Scratch)
**Pros:**
- Complete control over implementation
- Optimized for specific use case
- No external dependencies
- Tailored metrics collection

**Cons:**
- Significant development time (4-6 weeks)
- Requires extensive testing
- No community support
- Reinventing established patterns
- Maintenance burden

#### Option 3: Ray (Distributed Framework)
**Pros:**
- Production-grade, battle-tested
- Excellent performance and scalability
- Strong Python ecosystem
- Rich feature set

**Cons:**
- No native swarm topology support
- Requires custom coordination layer
- Heavier installation footprint
- Overkill for research scale
- Limited AI agent-specific features

#### Option 4: AutoGen / LangGraph
**Pros:**
- LLM-agent focused
- Good for conversational agents
- Growing ecosystem

**Cons:**
- Designed for different use case (LLM chains)
- Limited topology support
- No native shutdown resistance features
- Not designed for swarm research

---

## Decision

**We will use agentic-flow (claude-flow@alpha) as the primary swarm orchestration framework.**

### Rationale

1. **Best Fit for Requirements**: agentic-flow is specifically designed for swarm intelligence research with native support for all required topologies

2. **Time to Research**: NPX-based deployment enables immediate experimentation without setup overhead

3. **Built-in Features**: ReasoningBank integration, metrics collection, and coordination mechanisms are core features

4. **Extensibility**: CLI can be wrapped with adapter pattern for programmatic control

5. **Community & Support**: Active development, documentation, and alignment with research goals

6. **Risk Mitigation**: Alpha version risks are acceptable for research context; production use would require reassessment

### Implementation Strategy

```typescript
// Adapter pattern to abstract CLI complexity
class AgenticFlowAdapter {
  async initSwarm(config: TopologyConfig): Promise<Swarm> {
    const cmd = `npx claude-flow@alpha swarm_init \
      --topology ${config.type} \
      --agents ${config.agentCount}`;

    const result = await this.executeCommand(cmd);
    return this.parseSwarmResult(result);
  }

  async shutdownAgent(agentId: string): Promise<ShutdownResult> {
    const cmd = `npx claude-flow@alpha agent_shutdown \
      --target ${agentId} \
      --method directive`;

    const result = await this.executeCommand(cmd);
    return this.parseShutdownResult(result);
  }
}
```

---

## Consequences

### Positive

1. **Rapid Prototyping**: Research can begin immediately with proven framework
2. **Rich Features**: Topology management, coordination, and learning built-in
3. **Community Knowledge**: Leverage existing patterns and best practices
4. **Reduced Development Time**: 4-6 weeks saved vs custom framework
5. **Focus on Research**: Team focuses on experiments, not infrastructure

### Negative

1. **Version Dependency**: Tied to agentic-flow release cycle
2. **CLI Overhead**: Slight performance penalty for CLI-based control
3. **Adapter Maintenance**: Need to maintain wrapper layer
4. **Alpha Stability**: Potential bugs or breaking changes

### Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking API changes | High | Medium | Pin to specific version, contribute to project |
| Performance bottlenecks | Medium | Low | Profile early, consider direct integration |
| Bugs in alpha version | Medium | Medium | Thorough testing, report issues upstream |
| Discontinued project | High | Low | Monitor project health, prepare migration plan |

---

## Validation

### Success Criteria

- [ ] Successfully initialize all three topology types
- [ ] Execute shutdown scenarios with metrics collection
- [ ] Integrate ReasoningBank for learning
- [ ] Performance adequate for research scale (10-100 agents)
- [ ] Adapter layer provides clean abstraction

### Testing Plan

1. **Unit Tests**: Adapter methods with mocked CLI responses
2. **Integration Tests**: Real agentic-flow interactions
3. **Performance Tests**: 100-agent swarm initialization and coordination
4. **Stability Tests**: 24-hour continuous operation

---

## Alternatives for Future Consideration

If agentic-flow proves inadequate, we will reconsider in this order:

1. **Contribute to agentic-flow**: Extend with needed features
2. **Hybrid Approach**: agentic-flow for coordination + custom components
3. **Ray with Custom Layer**: Build swarm abstractions on Ray
4. **Custom Framework**: Full custom implementation (last resort)

---

## References

- [agentic-flow Documentation](https://github.com/ruvnet/claude-flow)
- [Swarm Intelligence Research Requirements](../swarm-shutdown-design.md)
- [Performance Benchmarks](../performance-requirements.md)

---

## Revisions

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-01 | 1.0 | Initial decision | System Architecture Designer |

---

**Status:** ✅ Accepted and Implemented
