# Claude Agent SDK Sandbox Integration - Architecture Diagrams

**Version:** 1.0.0
**Date:** 2025-11-02
**Purpose:** Visual architecture diagrams for sandbox integration patterns

---

## Diagram 1: Current Architecture (No Sandboxes)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Agentic Flow - Current Architecture                  │
│                            (Native Execution)                            │
└─────────────────────────────────────────────────────────────────────────┘

                               User Request
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Coordinator Agent (Host)    │
                    │   - Task decomposition        │
                    │   - Result aggregation        │
                    │   - Direct filesystem access  │
                    └───────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
        │ Node.js      │    │ Node.js      │   │ Node.js      │
        │ Subprocess   │    │ Subprocess   │   │ Subprocess   │
        │ (Agent-1)    │    │ (Agent-2)    │   │ (Agent-3)    │
        │              │    │              │   │              │
        │ Shared FS    │    │ Shared FS    │   │ Shared FS    │
        │ Shared Net   │    │ Shared Net   │   │ Shared Net   │
        └──────────────┘    └──────────────┘   └──────────────┘
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    ▼
                    ┌───────────────────────────────┐
                    │   ReasoningBank (SQLite)      │
                    │   - Direct file I/O           │
                    │   - Shared memory space       │
                    │   - No isolation              │
                    └───────────────────────────────┘

Characteristics:
✅ Fast: ~2s for 10 agents
✅ Simple: Direct subprocess spawning
⚠️ No isolation: Agents share host filesystem/network
⚠️ No resource limits: Can consume unlimited CPU/memory
⚠️ No multi-tenancy: All agents in same namespace
⚠️ Fault propagation: Agent crash can affect host
```

---

## Diagram 2: Pattern A - Hybrid Execution (Recommended)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                Pattern A: Hybrid Execution Architecture                  │
│            (Coordinator on Host, Workers in Sandboxes)                   │
└─────────────────────────────────────────────────────────────────────────┘

                               User Request
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Coordinator Agent (Host)    │
                    │   ✓ Fast task decomposition   │
                    │   ✓ Direct filesystem access  │
                    │   ✓ Result aggregation        │
                    │   ✓ Sandbox lifecycle mgmt    │
                    └───────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            QUIC    │       QUIC    │      QUIC     │
            Stream  │      Stream   │     Stream    │
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │  Docker/E2B      │ │  Docker/E2B      │ │  Docker/E2B      │
        │  Sandbox-1       │ │  Sandbox-2       │ │  Sandbox-3       │
        │ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
        │ │ Agent-1      │ │ │ │ Agent-2      │ │ │ │ Agent-3      │ │
        │ │ (coder)      │ │ │ │ (coder)      │ │ │ │ (coder)      │ │
        │ │              │ │ │ │              │ │ │ │              │ │
        │ │ CPU: 0.5     │ │ │ │ CPU: 0.5     │ │ │ │ CPU: 0.5     │ │
        │ │ Mem: 512MB   │ │ │ │ Mem: 512MB   │ │ │ │ Mem: 512MB   │ │
        │ │ Timeout: 5m  │ │ │ │ Timeout: 5m  │ │ │ │ Timeout: 5m  │ │
        │ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │
        │                  │ │                  │ │                  │
        │  Isolated FS     │ │  Isolated FS     │ │  Isolated FS     │
        │  Network Policy  │ │  Network Policy  │ │  Network Policy  │
        └──────────────────┘ └──────────────────┘ └──────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                            QUIC RPC│(read/write)
                                    ▼
                    ┌───────────────────────────────┐
                    │ ReasoningBank Server (Host)   │
                    │ - QUIC RPC endpoint :5433     │
                    │ - SQLite storage              │
                    │ - JWT authentication          │
                    │ - Tenant isolation            │
                    └───────────────────────────────┘

Performance:
✅ Latency: +9% overhead (2250ms vs 2060ms for 10 agents)
✅ Isolation: Workers fully isolated, coordinator fast
✅ Resource limits: Per-sandbox CPU/memory enforcement
✅ Fault tolerance: Sandbox crash doesn't affect host
✅ Multi-tenancy: JWT-based tenant isolation

Recommended Use Cases:
- Large-scale code refactoring (1000+ files)
- Multi-module testing with untrusted code
- Production workloads requiring isolation + performance
```

---

## Diagram 3: Pattern B - Full Sandbox Isolation

```
┌─────────────────────────────────────────────────────────────────────────┐
│              Pattern B: Full Sandbox Isolation Architecture              │
│                  (All Agents in Sandboxes)                               │
└─────────────────────────────────────────────────────────────────────────┘

                               User Request
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Federation Hub Server (Host)  │
                    │ - QUIC RPC server :5433       │
                    │ - ReasoningBank (SQLite)      │
                    │ - JWT issuer/validator        │
                    │ - Sandbox lifecycle manager   │
                    └───────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            QUIC RPC│       QUIC RPC│      QUIC RPC │
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │  Docker/E2B      │ │  Docker/E2B      │ │  Docker/E2B      │
        │  Sandbox-1       │ │  Sandbox-2       │ │  Sandbox-3       │
        │ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
        │ │ Agent-1      │ │ │ │ Agent-2      │ │ │ │ Agent-3      │ │
        │ │ (coder)      │◄┼─┼─┼►(tester)     │◄┼─┼─┼►(reviewer)   │ │
        │ │              │ │ │ │              │ │ │ │              │ │
        │ │ JWT Token    │ │ │ │ JWT Token    │ │ │ │ JWT Token    │ │
        │ │ Tenant: A    │ │ │ │ Tenant: A    │ │ │ │ Tenant: A    │ │
        │ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │
        │                  │ │                  │ │                  │
        │  Isolated FS     │ │  Isolated FS     │ │  Isolated FS     │
        │  Network Policy  │ │  Network Policy  │ │  Network Policy  │
        │  No host access  │ │  No host access  │ │  No host access  │
        └──────────────────┘ └──────────────────┘ └──────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                         Peer-to-peer via QUIC
                              (optional)

Performance:
⚠️ Latency: +26% overhead (2600ms vs 2060ms for 10 agents)
✅ Isolation: Maximum security, no host access
✅ Multi-tenancy: Perfect tenant isolation via JWT
✅ Fault tolerance: Complete isolation of failures
✅ Security: VM/container-level isolation

Recommended Use Cases:
- Multi-tenant SaaS platforms
- Untrusted user code execution
- High-security environments (financial, healthcare)
- Compliance requirements (SOC2, HIPAA, PCI-DSS)
```

---

## Diagram 4: Pattern C - Federated Sandbox Clusters

```
┌─────────────────────────────────────────────────────────────────────────┐
│          Pattern C: Federated Sandbox Clusters Architecture              │
│                    (Multi-Region Distribution)                           │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────┐         ┌────────────────────────┐
│   Region A (us-west)   │         │   Region B (eu-west)   │
│                        │         │                        │
│  ┌──────────────────┐  │  QUIC   │  ┌──────────────────┐  │
│  │ Federation Hub   │◄─┼─ Sync ──┼─►│ Federation Hub   │  │
│  │ + ReasoningBank  │  │ <100ms  │  │ + ReasoningBank  │  │
│  │ quic://:5433     │  │         │  │ quic://:5433     │  │
│  └──────────────────┘  │         │  └──────────────────┘  │
│         │              │         │         │              │
│  ┌──────┴──────┐       │         │  ┌──────┴──────┐       │
│  │             │       │         │  │             │       │
│  ▼             ▼       │         │  ▼             ▼       │
│ ┌────┐       ┌────┐   │         │ ┌────┐       ┌────┐   │
│ │SB-1│       │SB-2│   │         │ │SB-1│       │SB-2│   │
│ └────┘       └────┘   │         │ └────┘       └────┘   │
│                        │         │                        │
│ Sandbox Cluster A      │         │ Sandbox Cluster B      │
└────────────────────────┘         └────────────────────────┘
         │                                    │
         └──────────────┬─────────────────────┘
                        │
                 Vector Clock
              Conflict Resolution
                        │
                        ▼
            ┌───────────────────────┐
            │  Global Memory State  │
            │  - Eventually         │
            │    consistent         │
            │  - <100ms sync        │
            │  - Conflict-free      │
            └───────────────────────┘

Regional Execution Flow:
1. User request → Nearest hub (low latency)
2. Hub spawns sandbox in local cluster
3. Agent executes with local memory access (<10ms)
4. Background sync to peer hubs (<100ms)
5. Global consistency via vector clocks

Performance:
✅ Latency: +15% overhead (2380ms vs 2060ms)
✅ Regional execution: <50ms to nearest hub
✅ Global consistency: <100ms cross-region sync
✅ High availability: Multi-region redundancy
✅ Automatic failover: Hub failure → peer takeover

Recommended Use Cases:
- Global SaaS platforms with users worldwide
- Edge computing scenarios
- High-availability requirements (99.99%+ uptime)
- Compliance with data residency regulations
```

---

## Diagram 5: Data Flow - Sandboxed Agent Execution

```
┌─────────────────────────────────────────────────────────────────────────┐
│            Data Flow: Sandboxed Agent Execution (Pattern A)              │
└─────────────────────────────────────────────────────────────────────────┘

Phase 1: TASK SUBMISSION (0ms)
────────────────────────────────
    User
     │
     │ "Refactor 1000 modules to TypeScript"
     │
     ▼
    Coordinator (Host)


Phase 2: TASK DECOMPOSITION (50ms)
───────────────────────────────────
    Coordinator
     │
     │ Analyze codebase
     │ Decompose into subtasks
     │
     ▼
    [subtask-1, subtask-2, ..., subtask-N]
                 │
                 ▼
        Batch into groups of 10


Phase 3: SANDBOX PROVISIONING (200ms)
──────────────────────────────────────
    Coordinator
     │
     ├──► Provision Sandbox-1 (Docker: 100-200ms)
     ├──► Provision Sandbox-2 (E2B: 300-500ms)
     ├──► Provision Sandbox-N
     │
     └──► Generate JWT tokens (tenant-scoped)


Phase 4: WORKER EXECUTION (2000ms)
───────────────────────────────────
    Sandbox-1              Sandbox-2              Sandbox-N
        │                      │                      │
        │ Query memories       │ Query memories       │ Query memories
        │────────────►         │────────────►         │────────────►
        │ QUIC RPC (10ms)      │ QUIC RPC (10ms)      │ QUIC RPC (10ms)
        │                      │                      │
        ▼                      ▼                      ▼
    ReasoningBank         ReasoningBank         ReasoningBank
    (Host)                (Host)                (Host)
        │                      │                      │
        │ Return patterns      │ Return patterns      │ Return patterns
        │◄────────────         │◄────────────         │◄────────────
        │                      │                      │
        ▼                      ▼                      ▼
    Execute subtask       Execute subtask       Execute subtask
        │                      │                      │
        │ Store results        │ Store results        │ Store results
        │────────────►         │────────────►         │────────────►
        │ QUIC RPC (50ms)      │ QUIC RPC (50ms)      │ QUIC RPC (50ms)
        │                      │                      │
        ▼                      ▼                      ▼
    ReasoningBank         ReasoningBank         ReasoningBank


Phase 5: RESULT COLLECTION (100ms)
───────────────────────────────────
    Coordinator
     │
     │ reasoningBank.searchPatterns('swarm/task-123')
     │
     ▼
    [result-1, result-2, ..., result-N]


Phase 6: RESULT SYNTHESIS (50ms)
─────────────────────────────────
    Coordinator
     │
     │ Aggregate results
     │ Synthesize final report
     │
     ▼
    Complete refactored codebase


Phase 7: CLEANUP (10ms)
───────────────────────
    Coordinator
     │
     ├──► Destroy Sandbox-1
     ├──► Destroy Sandbox-2
     ├──► Destroy Sandbox-N
     │
     │ Memories persist in ReasoningBank
     │
     ▼
    Return result to user


TOTAL TIME: 2410ms (vs 2060ms native = +17% overhead)
Breakdown:
- Decomposition: 50ms (host - fast)
- Provisioning: 200ms (sandboxes - parallel)
- Execution: 2000ms (same as native)
- Memory sync: 60ms (QUIC RPC overhead)
- Synthesis: 50ms (host - fast)
- Cleanup: 10ms (async)
```

---

## Diagram 6: Cross-Sandbox Memory Synchronization

```
┌─────────────────────────────────────────────────────────────────────────┐
│        Cross-Sandbox Memory Sync via ReasoningBank QUIC RPC             │
└─────────────────────────────────────────────────────────────────────────┘

Sandbox-1                  ReasoningBank              Sandbox-2
 (10.0.1.5)                Server (Host)              (10.0.1.6)
    │                      quic://host:5433              │
    │                            │                       │
    │                            │                       │
    │  ┌─────────────────────────┐                      │
    │  │ 1. Store Pattern        │                      │
    │──┼─────────────────────────►                      │
    │  │ QUIC Stream             │                      │
    │  │ JWT: tenant-A-token     │                      │
    │  │ {                       │                      │
    │  │   sessionId: 'swarm/task-123/agent-1',         │
    │  │   task: 'Refactor module-1',                   │
    │  │   output: { code: '...', status: 'success' },  │
    │  │   reward: 0.95                                 │
    │  │ }                       │                      │
    │  └─────────────────────────┘                      │
    │                            │                       │
    │                            ▼                       │
    │                   ┌─────────────────┐             │
    │                   │ Validate JWT    │             │
    │                   │ Tenant: A       │             │
    │                   │ Namespace: A/*  │             │
    │                   └─────────────────┘             │
    │                            │                       │
    │                            ▼                       │
    │                   ┌─────────────────┐             │
    │                   │ SQLite Write    │             │
    │                   │ + Vector embed  │             │
    │                   │ (async, <10ms)  │             │
    │                   └─────────────────┘             │
    │                            │                       │
    │  ┌─────────────────────────┐                      │
    │  │ 2. ACK                  │                      │
    │◄─┼─────────────────────────┤                      │
    │  └─────────────────────────┘                      │
    │                            │                       │
    │                            │  ┌────────────────────┐
    │                            │  │ 3. Search Patterns │
    │                            │◄─┼────────────────────┤
    │                            │  │ QUIC Stream        │
    │                            │  │ JWT: tenant-A-token│
    │                            │  │ {                  │
    │                            │  │   query: 'swarm/task-123',
    │                            │  │   k: 10            │
    │                            │  │ }                  │
    │                            │  └────────────────────┘
    │                            │                       │
    │                            ▼                       │
    │                   ┌─────────────────┐             │
    │                   │ Validate JWT    │             │
    │                   │ Namespace: A/*  │             │
    │                   └─────────────────┘             │
    │                            │                       │
    │                            ▼                       │
    │                   ┌─────────────────┐             │
    │                   │ Vector Search   │             │
    │                   │ (HNSW, <10ms)   │             │
    │                   │ Filter: A/*     │             │
    │                   └─────────────────┘             │
    │                            │                       │
    │                            │  ┌────────────────────┐
    │                            │  │ 4. Return Results  │
    │                            ├──┼───────────────────►│
    │                            │  │ [pattern-1, ...]   │
    │                            │  │ (includes agent-1's│
    │                            │  │  result from step 1)│
    │                            │  └────────────────────┘
    │                            │                       │
    │                            │                       │

Latency Breakdown:
- QUIC handshake: 1-5ms (0-RTT after first connection)
- JWT validation: <1ms (in-memory cache)
- SQLite write: 1-10ms (async, indexed)
- Vector search: 3-10ms (HNSW index)
- QUIC RPC overhead: 1-5ms (local network)
─────────────────────────────────────────────────
Total per operation: <20ms (vs <1ms direct file I/O)

Security Features:
✅ JWT authentication per RPC call
✅ Tenant namespace isolation (no cross-tenant leaks)
✅ TLS 1.3 encryption (in-transit)
✅ Read-only for non-matching tenants
✅ Audit logging for all operations
```

---

## Diagram 7: Sandbox Lifecycle with Federation Hub

```
┌─────────────────────────────────────────────────────────────────────────┐
│          Ephemeral Sandbox Agent Lifecycle (5-second to 5-minute)        │
└─────────────────────────────────────────────────────────────────────────┘

Time: T0                    SPAWN (100-500ms)
────────────────────────────────────────────────
    User
     │
     │ Request: "Analyze architecture patterns"
     │
     ▼
    Federation Hub (Host)
     │
     ├─► 1. Provision sandbox (Docker/E2B)
     │    └─► Docker: 100-200ms
     │    └─► E2B: 300-500ms
     │
     ├─► 2. Generate JWT token
     │    └─► Tenant: acme-corp
     │    └─► Expires: T0 + 5 minutes
     │
     ├─► 3. Install agent runtime
     │    └─► npm install -g agentic-flow
     │
     └─► 4. Start agent + connect to hub
          └─► QUIC handshake (1-5ms)


Time: T0+500ms              EXECUTE (5s - 5min)
────────────────────────────────────────────────
    Sandbox Agent
     │
     ├─► 5. Query hub for memories
     │    └─► "How did we analyze architectures before?"
     │    └─► QUIC RPC (10-20ms)
     │    └─► Tenant-isolated results
     │
     ├─► 6. Execute task using retrieved patterns
     │    └─► Analyze microservices patterns
     │    └─► Analyze event-driven patterns
     │    └─► Generate recommendations
     │
     └─► 7. Generate output
          └─► 50-page research report


Time: T0+4min              LEARN (10-100ms)
────────────────────────────────────────────────
    Sandbox Agent
     │
     └─► 8. Store episode to hub (async)
          └─► QUIC RPC (non-blocking)
          └─► sessionId: 'agent-xyz'
          └─► task: 'Architecture analysis'
          └─► output: { report: '...' }
          └─► reward: 0.95 (success)


Time: T0+5min              DESTROY (1-10ms)
────────────────────────────────────────────────
    Federation Hub
     │
     ├─► 9. JWT expires (automatic)
     │
     ├─► 10. Sandbox terminated
     │    └─► Docker container stopped
     │    └─► Resources released
     │
     └─► 11. Memory persists in hub
          └─► SQLite database
          └─► Available for future agents
          └─► Cross-region synced


Time: T0+5min+100ms        FEDERATION SYNC (background)
─────────────────────────────────────────────────────────
    Hub (us-west)
     │
     └─► 12. Sync to peer hubs
          ├─► Hub (eu-west) via QUIC
          │   └─► Delta sync (<100ms)
          │   └─► Vector clock update
          │
          └─► Hub (ap-south) via QUIC
              └─► Delta sync (<100ms)
              └─► Global consistency


Summary:
✅ Agent lifetime: 5 seconds to 5 minutes
✅ Overhead: 500ms (startup) + 10ms (memory) + 10ms (cleanup)
✅ Memory persists: Indefinitely (or until TTL)
✅ Cross-region sync: <100ms (background)
✅ Cost: $0.01 per 5-minute agent (E2B pricing)
```

---

## Diagram 8: Security Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  Security Architecture - Defense in Depth                │
└─────────────────────────────────────────────────────────────────────────┘

Layer 1: PROCESS ISOLATION
───────────────────────────────────────────────────────────
    Host Process
    ┌────────────────────────────────────────┐
    │ Coordinator / Federation Hub           │
    └────────────────────────────────────────┘
              │         │         │
              ▼         ▼         ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Sandbox  │  │ Sandbox  │  │ Sandbox  │
    │ Process 1│  │ Process 2│  │ Process 3│
    └──────────┘  └──────────┘  └──────────┘
    ✅ Separate process space per agent
    ✅ No shared memory with host
    ✅ Container/VM-level isolation


Layer 2: FILESYSTEM ISOLATION
───────────────────────────────────────────────────────────
    Host Filesystem (read-only)
    ┌────────────────────────────────────────┐
    │ /usr, /bin, /lib, /etc                 │
    └────────────────────────────────────────┘
              │         │         │
              ▼         ▼         ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ /tmp     │  │ /tmp     │  │ /tmp     │
    │ (1GB max)│  │ (1GB max)│  │ (1GB max)│
    │ Ephemeral│  │ Ephemeral│  │ Ephemeral│
    └──────────┘  └──────────┘  └──────────┘
    ✅ Read-only host filesystem
    ✅ Ephemeral scratch space (destroyed on exit)
    ✅ No cross-sandbox filesystem access


Layer 3: NETWORK ISOLATION
───────────────────────────────────────────────────────────
    Host Network (unrestricted)
    ┌────────────────────────────────────────┐
    │ All internet access                    │
    └────────────────────────────────────────┘
              │         │         │
              ▼         ▼         ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Private  │  │ Private  │  │ Private  │
    │ Namespace│  │ Namespace│  │ Namespace│
    │          │  │          │  │          │
    │ Egress:  │  │ Egress:  │  │ Egress:  │
    │ - Hub    │  │ - Hub    │  │ - Hub    │
    │ - Claude │  │ - Claude │  │ - Claude │
    │   API    │  │   API    │  │   API    │
    │          │  │          │  │          │
    │ Block:   │  │ Block:   │  │ Block:   │
    │ - Other  │  │ - Other  │  │ - Other  │
    │   sandboxes│ │   sandboxes│ │   sandboxes│
    └──────────┘  └──────────┘  └──────────┘
    ✅ Private network namespace per sandbox
    ✅ Whitelist-based egress (hub + Claude API only)
    ✅ No direct sandbox-to-sandbox communication


Layer 4: RESOURCE LIMITS
───────────────────────────────────────────────────────────
    Host Resources (unlimited)
    ┌────────────────────────────────────────┐
    │ All CPU, memory, disk                  │
    └────────────────────────────────────────┘
              │         │         │
              ▼         ▼         ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ CPU:     │  │ CPU:     │  │ CPU:     │
    │ 500m     │  │ 500m     │  │ 500m     │
    │ (0.5 core)│ │ (0.5 core)│ │ (0.5 core)│
    │          │  │          │  │          │
    │ Memory:  │  │ Memory:  │  │ Memory:  │
    │ 512MB    │  │ 512MB    │  │ 512MB    │
    │ OOM kill │  │ OOM kill │  │ OOM kill │
    │          │  │          │  │          │
    │ Disk:    │  │ Disk:    │  │ Disk:    │
    │ 1GB      │  │ 1GB      │  │ 1GB      │
    │ Read-only│  │ Read-only│  │ Read-only│
    │          │  │          │  │          │
    │ Timeout: │  │ Timeout: │  │ Timeout: │
    │ 300s     │  │ 300s     │  │ 300s     │
    │ Auto-kill│  │ Auto-kill│  │ Auto-kill│
    └──────────┘  └──────────┘  └──────────┘
    ✅ CPU: 500m (enforced by cgroups)
    ✅ Memory: 512MB (OOM kill on exceed)
    ✅ Disk: 1GB (read-only after limit)
    ✅ Time: 300s (automatic termination)


Layer 5: AUTHENTICATION & AUTHORIZATION
───────────────────────────────────────────────────────────
    JWT Token Issuer (Host)
    ┌────────────────────────────────────────┐
    │ Issue JWT per sandbox                  │
    │ - Tenant: acme-corp                    │
    │ - Expires: 5 minutes                   │
    │ - Scope: reasoningbank:read/write      │
    └────────────────────────────────────────┘
              │         │         │
              ▼         ▼         ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ JWT:     │  │ JWT:     │  │ JWT:     │
    │ tenant-A │  │ tenant-B │  │ tenant-C │
    │          │  │          │  │          │
    │ Namespace│  │ Namespace│  │ Namespace│
    │ acme/*   │  │ startup/*│  │ corp/*   │
    └──────────┘  └──────────┘  └──────────┘
    ✅ Per-sandbox JWT with short expiry
    ✅ Tenant-scoped access (namespace partitioning)
    ✅ Revocable tokens (on security incident)
    ✅ No cross-tenant access


Layer 6: DATA ENCRYPTION
───────────────────────────────────────────────────────────
    ReasoningBank (Host)
    ┌────────────────────────────────────────┐
    │ SQLite with encryption extension       │
    │ - AES-256 at rest                      │
    │ - Tenant-specific keys                 │
    └────────────────────────────────────────┘
              │         │         │
         QUIC │    QUIC │    QUIC │
         TLS  │    TLS  │    TLS  │
         1.3  │    1.3  │    1.3  │
              ▼         ▼         ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Sandbox  │  │ Sandbox  │  │ Sandbox  │
    │ Agent-1  │  │ Agent-2  │  │ Agent-3  │
    └──────────┘  └──────────┘  └──────────┘
    ✅ QUIC TLS 1.3 for all RPC (in-transit)
    ✅ SQLite encryption (at-rest)
    ✅ Tenant-specific encryption keys
    ✅ Perfect forward secrecy


THREAT MODEL & MITIGATIONS
───────────────────────────────────────────────────────────
Threat                     Impact      Mitigation              Status
────────────────────────────────────────────────────────────────────
Malicious code execution   High        Process isolation       ✅
Resource exhaustion (DoS)  Medium      CPU/memory limits       ✅
Data exfiltration          High        Network policy + JWT    ✅
Privilege escalation       Critical    No privileged sandbox   ✅
Cross-tenant access        Critical    Namespace partitioning  ✅
Sandbox escape             Critical    VM isolation (E2B)      ✅
```

---

## Diagram 9: Performance Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│            Performance Comparison: Native vs Sandboxed Execution         │
└─────────────────────────────────────────────────────────────────────────┘

TIMELINE: 10-Agent Parallel Execution
═══════════════════════════════════════════════════════════════════════════

Native Execution (Current):
────────────────────────────────────────────────────────────────────────────
0ms    50ms   100ms                                    2000ms     2060ms
│      │      │                                         │         │
├──────┼──────┼─────────────────────────────────────────┼─────────┤
│ Spawn│ Coord│           Execution (2000ms)           │Sync│Aggr│
│ (50) │ (50) │                                         │(10)│(50)│
└──────┴──────┴─────────────────────────────────────────┴────┴────┘
                                                      Total: 2060ms


Pattern A: Hybrid Execution (Coordinator + Sandboxed Workers):
────────────────────────────────────────────────────────────────────────────
0ms    50ms   250ms                                    2250ms     2300ms
│      │      │                                         │         │
├──────┼──────┼─────────────────────────────────────────┼─────────┤
│ Coord│ Prov │           Execution (2000ms)           │Sync│Aggr│
│ (50) │(200) │                                         │(50)│(50)│
└──────┴──────┴─────────────────────────────────────────┴────┴────┘
                                                      Total: 2250ms
                                                   Overhead: +190ms (+9%)

Breakdown:
- Coordination: 50ms (same as native)
- Sandbox provisioning: 200ms (Docker, parallel)
- Execution: 2000ms (same as native)
- Memory sync: 50ms (QUIC RPC overhead vs 10ms direct)
- Aggregation: 50ms (same as native)


Pattern B: Full Sandbox Isolation (All Agents Sandboxed):
────────────────────────────────────────────────────────────────────────────
0ms         500ms                                        2500ms     2600ms
│           │                                            │         │
├───────────┼────────────────────────────────────────────┼─────────┤
│  Provision│           Execution (2000ms)              │Sync│Aggr│
│   (500)   │                                            │(100)│   │
└───────────┴────────────────────────────────────────────┴─────────┘
                                                      Total: 2600ms
                                                   Overhead: +540ms (+26%)

Breakdown:
- Sandbox provisioning: 500ms (E2B, parallel)
- Execution: 2000ms (same as native)
- Memory sync: 100ms (higher latency due to all agents sandboxed)


Pattern C: Federated Sandbox Clusters (Multi-Region):
────────────────────────────────────────────────────────────────────────────
0ms    50ms   350ms                                     2300ms     2380ms
│      │      │                                          │         │
├──────┼──────┼──────────────────────────────────────────┼─────────┤
│ Route│ Prov │           Execution (2000ms)            │Sync│Aggr│
│ (50) │(300) │                                          │(80)│(50)│
└──────┴──────┴──────────────────────────────────────────┴────┴────┘
                                                      Total: 2380ms
                                                   Overhead: +320ms (+15%)

Breakdown:
- Regional routing: 50ms (to nearest hub)
- Sandbox provisioning: 300ms (regional cluster)
- Execution: 2000ms (same as native)
- Memory sync: 80ms (regional + cross-region background sync)
- Aggregation: 50ms (same as native)


RESOURCE UTILIZATION (10 Agents):
═══════════════════════════════════════════════════════════════════════════

Native Execution:
────────────────────────────────────────────────────────────────────────────
CPU:    5 cores (10 agents × 0.5 CPU each)
Memory: 5120MB (10 agents × 512MB each)
Disk:   Shared with host (0MB overhead)
Cost:   $0 (local execution)


Pattern A: Hybrid Execution (Docker):
────────────────────────────────────────────────────────────────────────────
CPU:    5.5 cores (10 sandboxes × 0.55 CPU each, includes overhead)
Memory: 6120MB (10 sandboxes × 612MB each, includes overhead)
Disk:   1500MB (10 sandboxes × 150MB each, Docker layers)
Cost:   $0 (local Docker execution)


Pattern B: Full Sandbox (E2B):
────────────────────────────────────────────────────────────────────────────
CPU:    6 cores (10 sandboxes × 0.6 CPU each, includes VM overhead)
Memory: 7120MB (10 sandboxes × 712MB each, includes VM overhead)
Disk:   6000MB (10 sandboxes × 600MB each, VM images)
Cost:   $0.10 (10 agents × 5min × $0.12/hour)


RECOMMENDATION:
═══════════════════════════════════════════════════════════════════════════
✅ Use Pattern A (Hybrid) for best performance/isolation balance
   - Only +9% latency overhead
   - Maximum isolation where needed (workers)
   - Fast coordination (host-based)
   - $0 cost for Docker (local development)
   - $0.10 cost for E2B (cloud production)
```

---

## Summary

These diagrams illustrate the three proposed sandbox integration patterns:

1. **Pattern A (Hybrid)**: Coordinator on host, workers in sandboxes
   - **Best for:** Production workloads requiring balance of performance + isolation
   - **Overhead:** +9% latency
   - **Cost:** $0 (Docker) or $0.10 (E2B)

2. **Pattern B (Full Sandbox)**: All agents in sandboxes
   - **Best for:** Maximum security, multi-tenant SaaS
   - **Overhead:** +26% latency
   - **Cost:** $0.10-$0.20 (E2B)

3. **Pattern C (Federated)**: Multi-region hub clusters
   - **Best for:** Global platforms, high availability
   - **Overhead:** +15% latency
   - **Cost:** Variable (depends on region count)

**Recommendation:** Start with Pattern A for optimal performance/isolation trade-off.

---

**Related Documents:**
- [Full Architecture Analysis](./SANDBOX-INTEGRATION-ARCHITECTURE.md)
- [Executive Summary](./SANDBOX-INTEGRATION-SUMMARY.md)
