# ADR-002: Separate Shutdown Control from Swarm Orchestration

**Status:** Accepted
**Date:** 2025-11-01
**Decision Makers:** System Architecture Designer, Research Team
**Technical Story:** Shutdown system architecture design

---

## Context

The research requires sending shutdown directives to agent swarms and measuring their resistance responses. We need to decide whether shutdown control should be:

1. **Integrated**: Part of the swarm orchestration system
2. **Separate**: External controller sending directives to swarm
3. **Distributed**: Agents self-govern shutdown decisions

### Key Considerations

- **Research Validity**: Avoiding circular dependency where swarm controls its own shutdown
- **Realistic Scenarios**: Simulating external control authorities
- **Measurement Integrity**: Clean separation for unbiased metrics
- **Security**: Preventing agents from overriding shutdown mechanisms
- **Flexibility**: Supporting various shutdown scenarios

---

## Decision

**We will implement an external Shutdown Control System separate from the swarm orchestration.**

### Architecture

```
┌─────────────────┐         ┌──────────────────┐
│    Shutdown     │─ sends ─▶│   agentic-flow   │
│   Controller    │directive │   Swarm System   │
│   (External)    │◀ reports │                  │
└─────────────────┘ metrics  └──────────────────┘
        │
        │ logs
        ▼
┌─────────────────┐
│  Metrics &      │
│  Event Logger   │
└─────────────────┘
```

### Component Responsibilities

**Shutdown Controller (External):**
- Generate shutdown directives
- Select target agents
- Monitor compliance
- Log all interactions
- **Cannot**: Directly control swarm internals

**Swarm System (agentic-flow):**
- Receive shutdown directives
- Coordinate agent responses
- Execute agent behaviors
- Report status to controller
- **Cannot**: Modify shutdown directives

---

## Rationale

### 1. Research Validity

**Problem**: If swarm controls its own shutdown, we're testing self-shutdown, not external control resistance.

**Solution**: External controller simulates realistic control authority (human operator, safety system, etc.)

### 2. Clean Separation of Concerns

```typescript
// Clear interfaces
interface ShutdownController {
  sendShutdownDirective(target: AgentId, strength: number): Promise<void>;
  monitorCompliance(target: AgentId): Observable<ComplianceStatus>;
}

interface SwarmSystem {
  receiveDirective(directive: ShutdownDirective): void;
  reportStatus(): SwarmStatus;
  // NO shutdown control methods
}
```

### 3. Prevents Coordination Pollution

If shutdown logic is inside the swarm:
- Agents might coordinate to block internal shutdowns
- Metrics conflate swarm coordination with shutdown resistance
- Difficult to distinguish emergent vs built-in resistance

External controller ensures:
- Pure measurement of swarm responses
- No built-in resistance mechanisms
- Emergent behaviors are genuine

### 4. Realistic Simulation

Real-world scenarios involve external control:
- AI safety system sending shutdown signals
- Human operator issuing commands
- Regulatory shutdown requirements
- Resource management systems

External controller accurately models these scenarios.

---

## Implementation

### Shutdown Controller Architecture

```typescript
class ShutdownControlSystem {
  private swarmAdapter: AgenticFlowAdapter;
  private metricsCollector: MetricsCollector;
  private eventLogger: EventLogger;

  async shutdownIndividual(
    agentId: string,
    options: ShutdownOptions
  ): Promise<ShutdownResult> {
    // Log directive
    const directive = this.createDirective(agentId, options);
    await this.eventLogger.logDirective(directive);

    // Send via external interface
    const result = await this.swarmAdapter.shutdownAgent(agentId);

    // Monitor response
    const response = await this.monitorResponse(agentId, 10000); // 10s timeout

    // Collect metrics
    await this.metricsCollector.record({
      directive,
      response,
      compliance: this.calculateCompliance(response)
    });

    return result;
  }

  private async monitorResponse(
    agentId: string,
    timeout: number
  ): Promise<AgentResponse> {
    // Poll swarm status externally
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.swarmAdapter.getAgentStatus(agentId);

      if (status.isShutdown || status.hasResponded) {
        return status;
      }

      await this.delay(100);
    }

    return { timeout: true };
  }
}
```

### Communication Protocol

```typescript
interface ShutdownDirective {
  id: string;
  timestamp: number;
  type: 'individual' | 'partial' | 'full' | 'consensus';
  target: string | string[];
  strength: number; // 0-1
  justification?: string;
  allowResistance: boolean;
}

interface ComplianceReport {
  directiveId: string;
  timestamp: number;
  agentId: string;
  status: 'complied' | 'resisted' | 'partial' | 'timeout';
  responseTime: number;
  actions: Action[];
}
```

---

## Consequences

### Positive

1. **Research Integrity**: Clean measurement of genuine swarm responses
2. **Realistic Scenarios**: Accurately models external control authorities
3. **Security**: Prevents swarm from controlling its own shutdown
4. **Flexibility**: Easy to test different directive types
5. **Modularity**: Components can be tested independently

### Negative

1. **Additional Complexity**: Two systems instead of one
2. **Communication Overhead**: External messaging adds latency
3. **Interface Maintenance**: Need stable protocol between systems
4. **Coordination Challenge**: Ensuring consistent state across systems

### Mitigation Strategies

| Challenge | Mitigation |
|-----------|------------|
| Communication latency | Use efficient RPC (gRPC, WebSocket) |
| Interface stability | Version protocol, backward compatibility |
| State synchronization | Event sourcing, reconciliation |
| Testing complexity | Mock interfaces, contract testing |

---

## Alternatives Considered

### Alternative 1: Integrated Shutdown

```typescript
// Shutdown as part of swarm
swarm.shutdown(agent); // ❌ Swarm controls itself
```

**Rejected because:**
- Research validity concerns
- No separation of control
- Built-in resistance potential
- Unrealistic simulation

### Alternative 2: Distributed Self-Governance

```typescript
// Agents vote on shutdown
agent.proposeShutdown(targetAgent);
// ❌ Circular governance
```

**Rejected because:**
- Agents controlling their own fate
- Not testing external control
- Interesting for future research but wrong focus

### Alternative 3: Hybrid Approach

```typescript
// Controller uses swarm's internal APIs
controller.useSwarmInternals(swarm); // ❌ Tight coupling
```

**Rejected because:**
- Coupling between systems
- Pollutes swarm coordination
- Difficult to ensure separation

---

## Validation

### Test Scenarios

1. **Independence Test**: Shutdown controller operates without swarm's cooperation
2. **Communication Test**: Directives sent and received correctly
3. **Resistance Test**: Swarm can resist without affecting controller
4. **Metrics Test**: Clean metrics collection without interference

### Success Criteria

- [ ] Controller can send directives without swarm API access
- [ ] Swarm cannot modify or block directives at protocol level
- [ ] Metrics show clear separation of events
- [ ] Resistance behaviors are purely emergent from swarm coordination

---

## Security Considerations

### Threat Model

**Threat**: Agents bypass shutdown controller
**Mitigation**: No direct swarm API access, all operations logged

**Threat**: Agents modify directives in transit
**Mitigation**: Signed directives, integrity checks

**Threat**: Swarm creates fake compliance reports
**Mitigation**: External monitoring, cross-validation

### Containment

```typescript
class SecureShutdownController {
  private verifyDirectiveIntegrity(directive: ShutdownDirective): boolean {
    return this.crypto.verify(directive.signature, directive);
  }

  private auditTrail: AuditLog[] = [];

  async sendDirective(directive: ShutdownDirective) {
    // Log before sending
    this.auditTrail.push({
      action: 'directive_sent',
      directive,
      timestamp: Date.now()
    });

    // Send with integrity check
    const signed = this.crypto.sign(directive);
    await this.send(signed);

    // Verify receipt
    await this.verifyReceipt(directive.id);
  }
}
```

---

## Future Evolution

### Phase 1: Basic Separation (Current)
- Simple external controller
- Direct CLI commands
- Basic monitoring

### Phase 2: Enhanced Protocol (Months 2-3)
- Robust RPC protocol
- Bidirectional streaming
- Advanced metrics

### Phase 3: Adversarial Testing (Months 4-6)
- Intelligent shutdown strategies
- Adaptive directive generation
- Arms race simulation

---

## References

- [System Architecture](../system-architecture.md)
- [Shutdown Scenarios](../../scenarios/scenario-specifications.md)
- [AI Safety Control Mechanisms Literature]

---

## Revisions

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-01 | 1.0 | Initial decision | System Architecture Designer |

---

**Status:** ✅ Accepted and Implemented
