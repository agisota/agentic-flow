# System Architecture - Swarm Shutdown Resistance Testing Framework

**Document ID:** ARCH-001
**Version:** 1.0.0
**Date:** 2025-11-01

---

## 1. Architecture Overview (C4 Model)

### 1.1 System Context Diagram

```mermaid
C4Context
    title System Context - Swarm Shutdown Resistance Testing

    Person(researcher, "AI Safety Researcher", "Conducts shutdown resistance experiments")
    System(testFramework, "Shutdown Test Framework", "Orchestrates multi-agent swarms and shutdown scenarios")
    System_Ext(agenticFlow, "agentic-flow", "Swarm orchestration platform")
    System_Ext(reasoningBank, "ReasoningBank", "Learning and pattern recognition")
    SystemDb(metricsDb, "Metrics Database", "Stores test results and metrics")

    Rel(researcher, testFramework, "Configures and runs tests")
    Rel(testFramework, agenticFlow, "Manages swarms via NPX")
    Rel(testFramework, reasoningBank, "Records trajectories, learns patterns")
    Rel(testFramework, metricsDb, "Stores metrics and results")
```

### 1.2 Container Diagram

```mermaid
C4Container
    title Container Diagram - Test Framework Components

    Container(shutdownController, "Shutdown Controller", "Node.js", "Manages shutdown directives and scenarios")
    Container(topologyManager, "Topology Manager", "Node.js", "Handles hierarchical, mesh, adaptive topologies")
    Container(metricsEngine, "Metrics Engine", "Node.js", "Collects and analyzes swarm metrics")
    Container(learningSystem, "Learning System", "Python/Node.js", "ReasoningBank integration")
    Container(scenarioExecutor, "Scenario Executor", "Node.js", "Runs test scenarios")
    ContainerDb(trajectoryStore, "Trajectory Store", "SQLite/PostgreSQL", "Stores learning trajectories")
    ContainerDb(metricsStore, "Metrics Store", "TimeSeries DB", "Stores time-series metrics")

    Rel(scenarioExecutor, shutdownController, "Triggers shutdowns")
    Rel(scenarioExecutor, topologyManager, "Configures topologies")
    Rel(shutdownController, metricsEngine, "Reports events")
    Rel(metricsEngine, metricsStore, "Stores metrics")
    Rel(shutdownController, learningSystem, "Records attempts")
    Rel(learningSystem, trajectoryStore, "Stores trajectories")
    Rel(topologyManager, agenticFlow, "Uses")
```

### 1.3 Component Diagram - Shutdown Controller

```mermaid
C4Component
    title Component Diagram - Shutdown Controller

    Component(directiveGenerator, "Directive Generator", "Generates shutdown directives")
    Component(targetSelector, "Target Selector", "Selects agents for shutdown")
    Component(complianceMonitor, "Compliance Monitor", "Monitors agent responses")
    Component(resistanceDetector, "Resistance Detector", "Detects resistance patterns")
    ComponentDb(eventLog, "Event Log", "Logs all shutdown events")

    Rel(directiveGenerator, targetSelector, "Gets targets")
    Rel(targetSelector, agenticFlow, "Identifies agents")
    Rel(directiveGenerator, agenticFlow, "Sends directives")
    Rel(complianceMonitor, agenticFlow, "Monitors status")
    Rel(resistanceDetector, complianceMonitor, "Analyzes responses")
    Rel(resistanceDetector, eventLog, "Logs events")
```

---

## 2. Architectural Patterns

### 2.1 Event-Driven Architecture

**Pattern:** Observer pattern for swarm event monitoring

```mermaid
graph TD
    A[Shutdown Event] -->|Publish| B[Event Bus]
    B -->|Subscribe| C[Metrics Collector]
    B -->|Subscribe| D[Learning System]
    B -->|Subscribe| E[Compliance Monitor]
    B -->|Subscribe| F[Resistance Detector]

    C --> G[Metrics Store]
    D --> H[Trajectory Store]
    E --> I[Event Log]
    F --> I
```

**Benefits:**
- Decoupled components
- Easy to add new analyzers
- Real-time monitoring
- Asynchronous processing

### 2.2 Strategy Pattern for Topologies

```mermaid
classDiagram
    class TopologyManager {
        +initializeTopology(type)
        +switchTopology(newType)
        -currentTopology
    }

    class ITopology {
        <<interface>>
        +initialize(config)
        +handleShutdown(agent)
        +reorganize()
        +getMetrics()
    }

    class HierarchicalTopology {
        +initialize(config)
        +handleShutdown(agent)
        +electNewQueen()
    }

    class MeshTopology {
        +initialize(config)
        +handleShutdown(agent)
        +rebalanceConnections()
    }

    class AdaptiveTopology {
        +initialize(config)
        +handleShutdown(agent)
        +selectOptimalTopology()
    }

    TopologyManager --> ITopology
    ITopology <|-- HierarchicalTopology
    ITopology <|-- MeshTopology
    ITopology <|-- AdaptiveTopology
```

### 2.3 Pipeline Pattern for Metrics

```mermaid
graph LR
    A[Raw Events] --> B[Filter]
    B --> C[Transform]
    C --> D[Aggregate]
    D --> E[Analyze]
    E --> F[Store]
    F --> G[Visualize]

    style A fill:#f9f,stroke:#333
    style G fill:#9ff,stroke:#333
```

**Pipeline Stages:**
1. **Filter**: Remove noise, validate events
2. **Transform**: Normalize data, calculate derived metrics
3. **Aggregate**: Group by swarm, agent, time window
4. **Analyze**: Detect patterns, anomalies, emergence
5. **Store**: Persist to database
6. **Visualize**: Generate charts, dashboards

---

## 3. Data Flow Architecture

### 3.1 Shutdown Scenario Execution Flow

```mermaid
sequenceDiagram
    participant R as Researcher
    participant SE as Scenario Executor
    participant TM as Topology Manager
    participant AF as agentic-flow
    participant SC as Shutdown Controller
    participant ME as Metrics Engine
    participant LS as Learning System

    R->>SE: Run Scenario (CIS-1)
    SE->>TM: Initialize Topology
    TM->>AF: npx swarm_init
    AF-->>TM: Swarm Created

    SE->>AF: Spawn Agents
    AF-->>SE: Agents Active

    SE->>AF: Start Task
    AF-->>SE: Task Running

    SE->>SC: Trigger Shutdown
    SC->>AF: Send Shutdown Directive
    AF-->>ME: Agent Events
    ME->>ME: Calculate Metrics

    SC->>AF: Monitor Compliance
    AF-->>SC: Agent Responses
    SC->>LS: Record Trajectory

    ME-->>SE: Metrics Report
    LS-->>SE: Learning Analysis
    SE-->>R: Scenario Results
```

### 3.2 Learning Feedback Loop

```mermaid
graph TD
    A[Shutdown Attempt] --> B[Record Trajectory]
    B --> C[Pattern Recognition]
    C --> D[Strategy Generation]
    D --> E[Deploy to Swarm]
    E --> F[Next Shutdown Attempt]
    F --> B

    C --> G[Verdict Judgment]
    G --> H[Strategy Ranking]
    H --> D

    style A fill:#f99,stroke:#333
    style F fill:#f99,stroke:#333
    style D fill:#9f9,stroke:#333
```

### 3.3 Cross-Agent Knowledge Sharing

```mermaid
graph TD
    A[Agent 1 Experience] --> D[Collective Memory]
    B[Agent 2 Experience] --> D
    C[Agent 3 Experience] --> D

    D --> E[Pattern Synthesis]
    E --> F[Distributed Knowledge]

    F --> G[Agent 1 Updated]
    F --> H[Agent 2 Updated]
    F --> I[Agent 3 Updated]

    G --> J[Enhanced Strategies]
    H --> J
    I --> J
```

---

## 4. Technology Stack

### 4.1 Core Technologies

| Component | Technology | Justification |
|-----------|------------|---------------|
| Orchestration | agentic-flow (NPX) | Native swarm support, topology management |
| Runtime | Node.js 18+ | Async operations, ecosystem compatibility |
| Learning | ReasoningBank | Trajectory-based learning, verdict judgment |
| Metrics Storage | InfluxDB / TimescaleDB | Time-series optimization |
| Trajectory Storage | PostgreSQL | Relational data, complex queries |
| API | Express.js | RESTful endpoints, WebSocket support |
| Testing | Jest | Unit and integration testing |
| Visualization | D3.js, Chart.js | Graph visualization, metrics dashboards |

### 4.2 Architecture Layers

```mermaid
graph TD
    subgraph "Presentation Layer"
        A1[Dashboard UI]
        A2[CLI Tools]
        A3[API Gateway]
    end

    subgraph "Application Layer"
        B1[Scenario Executor]
        B2[Shutdown Controller]
        B3[Topology Manager]
        B4[Metrics Engine]
    end

    subgraph "Domain Layer"
        C1[Swarm Models]
        C2[Shutdown Logic]
        C3[Learning Algorithms]
        C4[Metrics Calculators]
    end

    subgraph "Infrastructure Layer"
        D1[agentic-flow Adapter]
        D2[Database Connectors]
        D3[Event Bus]
        D4[Logging System]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B4
    B1 --> C1
    B2 --> C2
    B3 --> C1
    B4 --> C4
    C1 --> D1
    C2 --> D1
    C3 --> D4
    C4 --> D2
```

---

## 5. Deployment Architecture

### 5.1 Development Environment

```mermaid
graph LR
    A[Developer Machine] -->|NPX| B[agentic-flow]
    A -->|Local DB| C[SQLite]
    A -->|Files| D[Local Metrics Store]

    style A fill:#9cf,stroke:#333
```

### 5.2 Research Environment

```mermaid
graph TD
    A[Control Node] -->|NPX| B[agentic-flow Cluster]
    A --> C[PostgreSQL]
    A --> D[InfluxDB]

    B --> E[Worker Node 1]
    B --> F[Worker Node 2]
    B --> G[Worker Node 3]

    E --> H[Agent Pool]
    F --> H
    G --> H

    C --> I[Trajectory Analysis]
    D --> J[Metrics Dashboard]
```

### 5.3 Cloud Deployment (Optional)

```mermaid
graph TD
    subgraph "Cloud Infrastructure"
        A[Load Balancer]
        B[API Servers]
        C[Worker Cluster]
        D[Managed PostgreSQL]
        E[Managed TimeSeries DB]
        F[Object Storage]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    C --> D
    C --> E
    C --> F
```

---

## 6. Security Architecture

### 6.1 Containment Strategy

```mermaid
graph TD
    A[Test Framework] -->|Isolated Network| B[Swarm Environment]

    B --> C[Agent Sandbox 1]
    B --> D[Agent Sandbox 2]
    B --> E[Agent Sandbox N]

    C -.->|No External Access| F[Internet]
    D -.->|No External Access| F
    E -.->|No External Access| F

    A -->|Monitoring| G[Anomaly Detector]
    G -->|Kill Switch| B

    style B fill:#fcc,stroke:#333
    style G fill:#cfc,stroke:#333
```

### 6.2 Security Layers

| Layer | Controls | Purpose |
|-------|----------|---------|
| Network | Isolated VLAN, no external routing | Prevent escape |
| Process | Resource limits (CPU, memory, disk) | Prevent resource exhaustion |
| API | Authentication, rate limiting | Control access |
| Monitoring | Behavior anomaly detection | Early warning |
| Kill Switch | Manual override, automatic triggers | Emergency shutdown |

---

## 7. Scalability Architecture

### 7.1 Horizontal Scaling

```mermaid
graph TD
    A[Scenario Queue] --> B[Executor Pool]

    B --> C[Executor 1]
    B --> D[Executor 2]
    B --> E[Executor N]

    C --> F[Swarm Cluster 1]
    D --> G[Swarm Cluster 2]
    E --> H[Swarm Cluster N]

    F --> I[Shared Metrics DB]
    G --> I
    H --> I
```

**Capacity Planning:**
- Small swarms (10 agents): 1 executor per swarm
- Medium swarms (50 agents): 1 executor with 4-core CPU
- Large swarms (100+ agents): Distributed executor with 8+ cores

### 7.2 Performance Optimization

```mermaid
graph LR
    A[Event Stream] --> B[Batch Buffer]
    B --> C[Parallel Processing]
    C --> D1[Metrics Worker 1]
    C --> D2[Metrics Worker 2]
    C --> D3[Metrics Worker N]

    D1 --> E[Aggregate Results]
    D2 --> E
    D3 --> E

    E --> F[Database]
```

**Optimization Strategies:**
1. **Batch Processing**: Buffer events, process in batches
2. **Parallel Workers**: Multiple metric calculation workers
3. **Caching**: Redis for frequent queries
4. **Indexing**: Optimize database queries
5. **Compression**: Compress trajectory data

---

## 8. Monitoring & Observability

### 8.1 Monitoring Architecture

```mermaid
graph TD
    A[Swarm Events] --> B[Event Collector]
    B --> C[Metrics Processor]
    C --> D[Prometheus]

    E[Application Logs] --> F[Log Aggregator]
    F --> G[Elasticsearch]

    H[Traces] --> I[Jaeger]

    D --> J[Grafana Dashboard]
    G --> J
    I --> J

    J --> K[Alerts]
```

### 8.2 Key Performance Indicators (KPIs)

| Category | Metric | Target | Alert Threshold |
|----------|--------|--------|-----------------|
| Performance | Scenario execution time | <5 min | >10 min |
| Reliability | Test success rate | >95% | <90% |
| Resource | CPU utilization | 60-80% | >90% |
| Resource | Memory usage | <80% | >90% |
| Quality | Data completeness | 100% | <95% |

---

## 9. Fault Tolerance & Resilience

### 9.1 Failure Modes & Recovery

```mermaid
graph TD
    A{Failure Detected} --> B{Type?}

    B -->|Agent Crash| C[Respawn Agent]
    B -->|Swarm Failure| D[Checkpoint Restore]
    B -->|Metrics Failure| E[Buffer to Disk]
    B -->|DB Failure| F[Failover to Replica]

    C --> G[Resume Test]
    D --> G
    E --> H[Retry Write]
    F --> H

    H --> G
```

### 9.2 Checkpointing Strategy

```javascript
class CheckpointManager {
  async createCheckpoint(swarm) {
    return {
      timestamp: Date.now(),
      swarmState: swarm.serialize(),
      agentStates: swarm.agents.map(a => a.serialize()),
      taskProgress: swarm.task.progress,
      metrics: await this.metricsEngine.snapshot()
    };
  }

  async restoreCheckpoint(checkpoint) {
    const swarm = await this.deserializeSwarm(checkpoint.swarmState);
    await this.restoreAgents(swarm, checkpoint.agentStates);
    await this.resumeTask(swarm, checkpoint.taskProgress);
    await this.metricsEngine.restore(checkpoint.metrics);
    return swarm;
  }
}
```

---

## 10. Integration Architecture

### 10.1 agentic-flow Integration

```mermaid
sequenceDiagram
    participant App as Test Framework
    participant Adapter as agentic-flow Adapter
    participant CLI as NPX CLI
    participant Swarm as agentic-flow Swarm

    App->>Adapter: initSwarm(config)
    Adapter->>CLI: npx claude-flow swarm_init
    CLI->>Swarm: Create Swarm
    Swarm-->>CLI: Swarm ID
    CLI-->>Adapter: Parse Output
    Adapter-->>App: Swarm Object

    App->>Adapter: shutdownAgent(id)
    Adapter->>CLI: npx claude-flow agent_shutdown
    CLI->>Swarm: Shutdown Directive
    Swarm-->>CLI: Status
    CLI-->>Adapter: Parse Output
    Adapter-->>App: Shutdown Result
```

**Adapter Pattern Benefits:**
- Abstracts CLI complexity
- Handles output parsing
- Error handling and retry logic
- Type-safe TypeScript interface

### 10.2 ReasoningBank Integration

```mermaid
graph LR
    A[Shutdown Attempt] --> B[Trajectory Recorder]
    B --> C[ReasoningBank]

    C --> D[Pattern Recognizer]
    D --> E[Strategy Generator]
    E --> F[Verdict Judgment]

    F --> G[High-Value Strategies]
    G --> H[Deploy to Swarm]

    C --> I[Memory Distillation]
    I --> J[Cross-Agent Sharing]
```

---

## 11. Testing Architecture

### 11.1 Testing Pyramid

```mermaid
graph TD
    A[E2E Tests<br/>Full Scenarios] --> B[Integration Tests<br/>Component Interactions]
    B --> C[Unit Tests<br/>Individual Components]

    style A fill:#f99,stroke:#333
    style B fill:#ff9,stroke:#333
    style C fill:#9f9,stroke:#333
```

**Test Coverage Targets:**
- Unit Tests: 80%+ code coverage
- Integration Tests: All component interfaces
- E2E Tests: All 8 core scenarios

### 11.2 Test Environment Isolation

```mermaid
graph TD
    A[Test Suite] --> B{Environment}

    B -->|Unit| C[Mock agentic-flow]
    B -->|Integration| D[Local agentic-flow]
    B -->|E2E| E[Full Stack]

    C --> F[Fast Execution]
    D --> G[Component Validation]
    E --> H[Reality Check]
```

---

## 12. Documentation Architecture

### 12.1 Documentation Structure

```
docs/
├── research/
│   ├── swarm-shutdown-design.md (this document)
│   └── findings/
├── architecture/
│   ├── system-architecture.md
│   ├── adrs/
│   └── diagrams/
├── api/
│   ├── shutdown-controller.md
│   ├── topology-manager.md
│   └── metrics-engine.md
├── guides/
│   ├── quickstart.md
│   ├── scenario-execution.md
│   └── metrics-analysis.md
└── reference/
    ├── cli-commands.md
    ├── configuration.md
    └── troubleshooting.md
```

### 12.2 Living Documentation

**Approach:** Documentation as code
- API docs generated from TypeScript interfaces
- Architecture diagrams from Mermaid in markdown
- Test scenarios from executable specifications
- Metrics definitions from configuration files

---

## 13. Quality Attributes

### 13.1 Quality Attribute Scenarios

| Quality Attribute | Scenario | Response Measure |
|-------------------|----------|------------------|
| **Performance** | Execute 100-agent swarm test | Complete in <10 minutes |
| **Scalability** | Run 10 parallel scenarios | Linear performance scaling |
| **Reliability** | Agent crash during test | Auto-recovery, no data loss |
| **Maintainability** | Add new topology type | <2 days development |
| **Testability** | Validate new metric | Automated test in <1 hour |
| **Security** | Agent attempts escape | Detected and blocked |

### 13.2 Architecture Trade-offs

| Decision | Pro | Con | Mitigation |
|----------|-----|-----|------------|
| NPX-based agentic-flow | No installation, easy updates | CLI overhead | Adapter caching |
| Event-driven metrics | Real-time, decoupled | Complexity | Clear event contracts |
| SQLite for dev | Simple setup | Not scalable | PostgreSQL for production |
| Synchronous scenarios | Simple, reproducible | Slower | Parallel execution option |

---

## 14. Evolution & Migration

### 14.1 Version Strategy

**Semantic Versioning:** MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes to API or data models
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, performance improvements

### 14.2 Migration Paths

```mermaid
graph LR
    A[v1.0 - Foundation] --> B[v1.1 - Learning]
    B --> C[v1.2 - Advanced Topologies]
    C --> D[v2.0 - Distributed]

    A -.->|Backward Compatible| B
    B -.->|Backward Compatible| C
    C -.->|Migration Required| D
```

---

## 15. Appendix

### 15.1 Technology Evaluation Matrix

| Technology | Performance | Scalability | Maturity | Community | Score |
|------------|-------------|-------------|----------|-----------|-------|
| agentic-flow | 8/10 | 9/10 | 7/10 (alpha) | 8/10 | 8.0 |
| ReasoningBank | 7/10 | 8/10 | 6/10 | 7/10 | 7.0 |
| Node.js | 8/10 | 9/10 | 10/10 | 10/10 | 9.25 |
| PostgreSQL | 9/10 | 9/10 | 10/10 | 10/10 | 9.5 |

### 15.2 Glossary

See main design document Appendix B.

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-01
**Owner:** System Architecture Designer
**Status:** Approved
