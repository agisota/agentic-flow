# 🧠 AgentDB: Vector Intelligence for AI That Learns

## My Story: From Claude Flow to AgentDB

I've separated the Claude Flow Memory system into a standalone package with built-in self-learning. Here's why that matters.

Every AI agent needs memory. Every intelligent system needs to learn from experience. Every production deployment needs performance that doesn't crumble under scale. When I built the vector database and reasoning engine for Claude Flow, I realized these components solved problems bigger than one framework.

So I extracted them. AgentDB is now a complete vector intelligence platform that any developer can use—whether you're building with Claude Flow, LangChain, custom agents, or integrating directly into agentic applications.

**The vector database with a brain.** Store embeddings, search semantically, and build agents that learn from experience—all with 150x-12,500x performance improvements over traditional solutions.

**Visit:** [agentdb.ruv.io](https://agentdb.ruv.io) • **Demo:** [agentdb.ruv.io/demo](https://agentdb.ruv.io/demo)

---

## 🎯 Why AgentDB?
### Built for the Agentic Era

Most memory systems were designed for data retrieval. **AgentDB was built for autonomous cognition**—agents that need to remember, learn, and act together in real time.

In agentic systems, memory isn't a feature. It's the foundation of continuity. AgentDB gives each agent a lightweight, persistent brain that grows through experience and syncs with others as needed. Whether running solo or as part of a swarm, every agent stays informed, adaptive, and self-improving.

### What Makes It Different

AgentDB lives where the agent lives—**inside the runtime, not as an external service**. It turns short-term execution into long-term intelligence without touching a network call.

When you build agentic systems, every millisecond matters. Most memory layers slow agents down with remote hops and orchestration overhead. AgentDB flips that. It embeds memory within the agent loop—lightweight, adaptive, and always ready to learn.

**AgentDB gives agents a real cognitive layer that:**
- Starts in **<10ms** (disk) or **~100ms** (browser)
- Runs entirely in disk or memory
- Keeps swarms synchronized in real time
- No servers. No latency overhead. Just instant recall, continuous learning, and distributed coordination—all happening inside the agent, not behind a network call.

### ⚙️ Built for Engineers Who Care About Milliseconds

| Feature | Benefit |
|---------|---------|
| ⚡ **Instant startup** | Boots in under 10ms (disk) or ~100ms (browser) |
| 🪶 **Lightweight** | Memory or disk mode, zero config, minimal footprint |
| 🧠 **Reasoning-aware** | Stores patterns, tracks outcomes, recalls context |
| 🔗 **Vector graph search** | HNSW multi-level graph for 116x faster similarity queries |
| 🔄 **Real-time sync** | Swarms share discoveries in sub-second intervals |
| 🌍 **Universal runtime** | Node.js, browser, edge, and agent hosts |

AgentDB runs anywhere: **Claude Code, Cursor, GitHub Copilot, Node.js, browsers, edge functions, or distributed agent networks.** It's memory designed for motion.


---

## What Makes AgentDB Different

### 🚀 Rust/WASM Performance Core

The secret to our speed: compute-intensive operations—vector similarity calculations, HNSW graph traversal, quantization algorithms—run in WebAssembly compiled from Rust.

**What this means for you:**
- **90-95% of native Rust performance** in pure JavaScript
- **No system dependencies** to install or configure
- **No compilation steps** for end users
- **Works everywhere** JavaScript runs: Node.js, browsers, edge runtimes
- **Just `npm install`** and you're running production-grade vector operations

Python is slow. Python with numpy is better. Rust compiled to WASM is 10-100x faster for neural operations while staying in the JavaScript ecosystem you already use.

### 💾 Vector Database That Scales

Not just another similarity search wrapper. AgentDB is engineered for production:

**Performance Numbers:**
- **<100µs searches** at 10K vectors (was 15ms)
- **120µs searches** at 100K vectors (was 150ms)
- **8ms searches** at 1M vectors (was 100 seconds)
- **2ms batch inserts** for 100 vectors (was 1 second)
- **4-32x memory compression** with quantization (3GB → 96MB)

**How we do it:**
- **HNSW indexing** - O(log n) search complexity, not O(n) linear scans
- **Smart quantization** - Binary, scalar, or product quantization with <5% accuracy loss
- **LRU caching** - Sub-millisecond retrieval for frequent queries
- **QUIC sync** - <1ms cross-node synchronization for distributed deployments

### 🧠 Self-Learning System (9 RL Algorithms)

Agents that improve themselves. Not just vector search—full reinforcement learning stack:

**Offline Learning** (learn from historical data):
- **Decision Transformer** - Train on past successes/failures, deploy intelligent agents
- No environment needed, no live interaction required

**Active Learning** (learn by doing):
- **Q-Learning** - Discrete action optimization
- **SARSA** - Safety-critical, conservative learning
- **Actor-Critic** - Continuous control tasks

**Specialized Algorithms:**
- Curiosity-driven exploration
- Active learning (minimal data requirements)
- Adversarial training (robust agents)
- Curriculum learning (progressive difficulty)
- Federated learning (privacy-preserving)

**Real-world example:** Your deployment agent fails 3 times with approach A, succeeds 15 times with approach B. Next deployment, it automatically chooses B. No code changes. Just experience accumulating in the database.

### 🎯 ReasoningBank: How Agents Get Smarter

The learning loop that turns novices into experts:

1. **Trajectory Tracking** - Record what the agent did
   *"Analyzed query → Added index → Tested performance"*

2. **Verdict Judgment** - Evaluate the outcome
   *Success: 87% latency reduction → Store as good pattern
   Failure: Timeout increased → Avoid this approach*

3. **Memory Distillation** - Learn patterns from experience
   *After 50 successes: "Indexes help read-heavy queries"*

4. **Experience Replay** - Apply learned patterns
   *New slow query → Retrieve similar → Apply index → Success*

**The progression:**
- **First time:** Agent tries 10 approaches, 3 work
- **Tenth time:** Agent recalls successful patterns, picks right approach immediately
- **Hundredth time:** Agent is an expert, rarely fails

No code changes. No model retraining. Just experience informing future decisions.

### 🌐 Production-Ready from Day One

**Built for scale:**
- **TypeScript native** - No Python dependencies, conda, or Docker required
- **Multi-database management** - Separate concerns with domain isolation
- **Hybrid search** - Combine vector similarity + metadata filtering
- **Custom distance metrics** - Cosine, Euclidean, Hamming, or define your own
- **Distributed sync** - QUIC protocol for multi-node coordination
- **Comprehensive CLI** - Zero code needed for prototyping and operations

**Deploy anywhere:**
- **Local development** - Node.js, Bun, Deno
- **Production servers** - Any Node.js environment
- **Edge runtimes** - Cloudflare Workers, Vercel Edge, Deno Deploy
- **Browsers** - Chrome, Firefox, Safari, Edge (runs entirely client-side)
- **Mobile applications** - React Native, Expo, Capacitor
- **AI coding tools** - Claude Code, Cursor, GitHub Copilot, Continue

### 🌐 Yes, It Runs in Your Browser

AgentDB works completely in the browser with zero backend required. The same code that runs in Node.js runs in your browser using a WASM-compiled SQLite backend:

```typescript
// Automatic WASM backend in browser
import { createVectorDB } from 'agentdb';

const db = await createVectorDB({ inMemory: true });

// Store embeddings client-side
await db.insert({
  embedding: [0.1, 0.2, 0.3, ...],
  metadata: { text: "Your data never leaves the browser" }
});

// Search semantically - all computation happens locally
const results = await db.search({
  query: [0.15, 0.25, 0.35, ...],
  k: 5
});
```

**What this enables:**
- **Privacy-first applications** - Data never touches a server
- **Offline-capable AI** - Works without internet connection
- **Instant prototyping** - No backend setup, just open a browser
- **Client-side RAG** - Build documentation search that runs locally
- **Personal AI assistants** - Memory stored in browser localStorage

**Try it live:** [agentdb.ruv.io/demo](https://agentdb.ruv.io/demo)

---

## Get Started in 60 Seconds

```bash
# Run directly (no installation)
npx agentdb@latest benchmark

# See your performance numbers
# ✅ Pattern Search: <100µs (150x faster)
# ✅ Batch Insert: 2ms for 100 vectors (500x faster)
# ✅ Large Query: 8ms at 1M vectors (12,500x faster)

# Install for development
npm install agentdb

# Or get AgentDB skills for Claude Code
npx claude-flow@alpha init --force
```

**Next:** [Quick Start Guide](#how-to-get-started-3-steps) • [Use Cases](#what-you-can-actually-do-with-it) • [API Docs](./API_GUIDE.md)

---

## Who Is This For?

**AgentDB is built for:**
- **AI Engineers** building autonomous agents that need persistent memory
- **Full-stack developers** adding semantic search to applications
- **AI tooling creators** (IDE extensions, coding assistants, AI plugins)
- **Researchers** experimenting with reinforcement learning and agent systems
- **Indie hackers** building AI products without backend infrastructure
- **Enterprise teams** needing production-grade vector search with learning capabilities

**You'll love AgentDB if you:**
- Need vector search that actually runs in production (not just prototypes)
- Want agents that learn from experience, not just retrieve data
- Care about millisecond latency and minimal resource usage
- Prefer TypeScript/JavaScript over Python
- Need to deploy everywhere (browsers, edge, mobile, servers)
- Want zero-config setup that just works

**AgentDB might not be right if:**
- You need billion-scale vector storage (AgentDB optimizes for <10M vectors)
- Your team is Python-only and can't integrate JavaScript/TypeScript
- You need GPU acceleration for neural network training
- You require enterprise SLAs and managed hosting (AgentDB is self-hosted)
- Simple key-value storage is sufficient (use Redis instead)

## Why This Exists

I got tired of the pattern:
1. Build smart agent
2. Realize it has no memory
3. Add ChromaDB or Pinecone
4. Hit performance walls at scale
5. Hack together learning logic
6. Watch it fall apart in production

AgentDB solves this properly. One package, one install, complete solution.

## Real-World Examples (From the Demo)

### 🎮 Interactive Demos

Visit [agentdb.ruv.io/demo](https://agentdb.ruv.io/demo) to try these live in your browser:

**1. Semantic Code Search**
- Search your codebase by meaning, not keywords
- Find "authentication logic" even if code doesn't contain those words
- Works entirely client-side with instant results

**2. Personal Memory Assistant**
- Store notes and retrieve them semantically
- Ask "what did I learn about React hooks?" and get relevant memories
- All data stays in your browser's localStorage

**3. Multi-Agent Swarm Coordination**
- Watch agents share knowledge in real-time
- Distributed memory synchronization visualization
- See QUIC protocol in action

**4. ReasoningBank Learning**
- Agent learns optimal strategies from experience
- Trajectory tracking and verdict judgment visualization
- Pattern distillation in real-time

All demos run 100% in your browser. No servers. No API calls. Just pure WebAssembly performance.

---

## What You Can Actually Do With It

### Use Case 1: Build a Chatbot with Memory

Your chatbot remembers every conversation, even across restarts. Ask "what did we discuss last week?" and it recalls the context:

```bash
# Initialize conversation memory
npx agentdb@latest init ./chatbot-memory.db --dimension 1536

# Store every conversation turn automatically
# (Your app stores embeddings of user questions + responses)

# Later, retrieve similar past conversations
npx agentdb@latest query ./chatbot-memory.db "[user question embedding]" \
  --limit 5 \
  --threshold 0.75

# Result: 5 most similar past conversations for context
```

Your chatbot gets smarter over time, learning from successful interactions.

### Use Case 2: Semantic Code Search

Search your codebase by meaning, not keywords. Find "how we handle authentication" even if the code doesn't contain those exact words:

```bash
# Index your codebase
npx agentdb@latest init ./code-search.db --dimension 1536

# Search finds similar code semantically
npx agentdb@latest query ./code-search.db "[authentication query]" \
  --limit 10 \
  --metadata-filter '{"language":"typescript"}'

# Result: 10 most relevant code snippets, ranked by semantic similarity
```

Works for finding similar bugs, patterns, API usage—anything where exact keyword matching fails.

### Use Case 3: RAG (Retrieval Augmented Generation)

Build documentation Q&A where the AI retrieves relevant docs before answering:

```bash
# Index your documentation
npx agentdb@latest init ./docs-rag.db --dimension 1536

# User asks question
# 1. Query similar docs
npx agentdb@latest query ./docs-rag.db "[user question embedding]" --limit 3

# 2. Send retrieved docs + question to LLM
# 3. LLM answers using retrieved context
```

Your AI answers are grounded in actual documentation, reducing hallucinations.

### Use Case 4: Self-Learning Agents

Agents that improve from experience. Track what worked, what didn't, and learn optimal strategies:

```bash
# Create a learning plugin
npx agentdb@latest create-plugin -t decision-transformer -n deployment-agent

# Agent tracks: approach → outcome → metrics
# Next time: retrieves similar past deployments
# Follows strategies that worked, avoids approaches that failed
```

Agents evolve from novice to expert without code changes.

## How to Get Started (3 Steps)

### Step 1: Install & Initialize

```bash
# No installation needed - run directly with npx
npx agentdb@latest init ./my-database.db --dimension 1536

# Or install globally
npm install -g agentdb
agentdb init ./my-database.db --dimension 1536
```

Creates a vector database ready to store embeddings (1536 dimensions for OpenAI ada-002).

### Step 2: Add Your Data

```bash
# Store a document with vector embedding
npx agentdb@latest insert ./my-database.db \
  --embedding "[0.1,0.2,0.3,...]" \
  --text "Your document content" \
  --metadata '{"category":"documentation","date":"2025-01-20"}'

# Batch import from JSON
npx agentdb@latest import ./my-database.db ./documents.json
```

The embedding array comes from your embedding model (OpenAI, Cohere, local models, etc.).

### Step 3: Search & Retrieve

```bash
# Find similar documents
npx agentdb@latest query ./my-database.db "[query embedding]" \
  --limit 10 \
  --threshold 0.7 \
  --metadata-filter '{"category":"documentation"}'

# Results show most similar documents with similarity scores
```

That's it. You now have semantic search with <100µs query times.

## Complete CLI Reference

The CLI handles everything without writing code:

**Database Operations:**
```bash
npx agentdb@latest init <path> --dimension <num>    # Create database
npx agentdb@latest stats <path>                      # Show statistics
npx agentdb@latest optimize <path>                   # Optimize/vacuum
npx agentdb@latest export <db> <output.json>         # Export data
npx agentdb@latest import <output.json> <db>         # Import data
```

**Vector Operations:**
```bash
npx agentdb@latest insert <db> --embedding "[...]" --text "..." --metadata '{}'
npx agentdb@latest query <db> "[embedding]" --limit 10 --threshold 0.7
npx agentdb@latest delete <db> --id <pattern-id>
```

**Performance:**
```bash
npx agentdb@latest benchmark              # Run performance tests
npx agentdb@latest benchmark --vectors 100000  # Custom vector count
```

**Learning Plugins:**
```bash
npx agentdb@latest create-plugin -t decision-transformer -n agent-name
npx agentdb@latest list-templates         # Show available algorithms
npx agentdb@latest list-plugins           # Show installed plugins
npx agentdb@latest plugin-info <name>     # Plugin details
```

**Migration:**
```bash
npx agentdb@latest migrate --source .swarm/memory.db --target ./new.db
```

Everything you need, zero code required. Perfect for prototyping, testing, or production scripts.

## MCP Server - Connect to Claude Code

AgentDB runs as an MCP (Model Context Protocol) server, giving Claude Code direct access to vector intelligence:

```bash
# Start MCP server
npx agentdb@latest mcp

# Or add to Claude Code permanently
claude mcp add agentdb npx agentdb@latest mcp
```

Now Claude can:
- Store conversation context with vector embeddings
- Search similar past interactions semantically
- Learn patterns from successful task completions
- Retrieve relevant memories across sessions
- Optimize workflows through experience

This is the brain behind intelligent agents. Claude Flow uses it. Your custom agents can too.

## Try Claude Flow Skills (Optional)

If you want pre-built skills for working with AgentDB in Claude Code, install Claude Flow:

```bash
# Install Claude Flow with AgentDB skills
npx claude-flow@alpha init --force

# You get 6 AgentDB skills:
# - agentdb-vector-search (semantic search & RAG)
# - agentdb-optimization (performance tuning)
# - agentdb-advanced (QUIC, custom metrics, hybrid search)
# - agentdb-learning (9 RL algorithms)
# - agentdb-memory-patterns (persistent agent memory)
# - reasoningbank-agentdb (adaptive intelligence)
```

But you don't need Claude Flow to use AgentDB. The CLI and MCP server work standalone.

## Core Capabilities

### 1. Vector Search (150x-12,500x Faster)

Not your typical vector database. HNSW indexing gives you O(log n) complexity. Quantization reduces memory 4-32x. Caching makes frequent queries <1ms.

**Real Numbers:**
- 10K vectors: 100µs search (was 15ms)
- 100K vectors: 120µs search (was 150ms)
- 1M vectors: 8ms search (was 100s)
- Batch insert: 2ms for 100 vectors (was 1s)

**Hybrid Search:**
Combine vector similarity with metadata filters:
```typescript
const results = await db.retrieveWithReasoning(embedding, {
  domain: 'code',
  k: 20,
  filters: {
    language: 'typescript',
    category: 'authentication',
    date: { $gte: '2024-01-01' }
  }
});
```

Find similar code, but only TypeScript, only auth-related, only recent. This is what production systems need.

### 2. Self-Learning System (9 RL Algorithms)

Agents that learn from experience instead of requiring constant reprogramming. Nine algorithms built in:

**For Offline Learning** (learn from logs without live interaction):
- **Decision Transformer** - Feed it historical successes/failures, it learns optimal patterns
- Ideal for: Code generation, deployment strategies, workflow optimization

**For Active Learning** (learn by trying things):
- **Q-Learning** - Discrete actions (click button A or B?)
- **SARSA** - Safety-critical tasks (more conservative)
- **Actor-Critic** - Continuous control (how much to scale?)

**For Specialized Learning**:
- Curiosity-driven exploration - Discovers novel solutions
- Active learning - Minimizes required training data
- Adversarial training - Builds robust agents
- Curriculum learning - Progressively harder tasks
- Federated learning - Privacy-preserving multi-agent training

**Real-World Example:**
Your deployment agent fails 3 times using approach A, succeeds 15 times with approach B. Next deployment, it chooses approach B automatically. No code changes needed—it learned from experience.

```bash
# Create a learning agent
npx agentdb@latest create-plugin -t decision-transformer -n deployment-optimizer

# It tracks: action → outcome → metrics
# Next time: follows strategies that worked, avoids failures
```

This is how agents improve themselves without you rewriting code every time requirements change.

### 3. ReasoningBank - How Agents Get Smarter

ReasoningBank is the learning loop: track what happened → evaluate if it worked → remember what to do next time.

**Four Steps to Intelligence:**

1. **Trajectory Tracking** - Record what the agent actually did
   - Example: "Analyzed query → Added index → Tested performance"

2. **Verdict Judgment** - Did it work?
   - Success: Latency reduced 87%, store as good pattern
   - Failure: Timeout increased, avoid this approach

3. **Memory Distillation** - Learn patterns from similar experiences
   - After 50 successful query optimizations, distill: "Indexes help read-heavy queries"

4. **Experience Replay** - Apply learned patterns to new tasks
   - New slow query → Retrieve: "Similar queries fixed with indexes" → Try that first

**The Result:**
First time: Agent tries 10 approaches, 3 work.
Tenth time: Agent recalls successful patterns, picks right approach immediately.
Hundredth time: Agent is an expert, rarely fails.

No code changes. No retraining models. Just experience accumulating in the database, informing future decisions.

### 4. Production Optimization

**Quantization Strategies:**

- **Binary (32x compression)**: 3GB → 96MB, ~2-5% accuracy loss, 10x faster search
- **Scalar (4x compression)**: 3GB → 768MB, ~1-2% accuracy loss, 3x faster search
- **Product (8-16x compression)**: 3GB → 192MB, ~3-7% accuracy loss, 5x faster search
- **None (full precision)**: Maximum accuracy, full memory usage

Pick your trade-off. Mobile deployment? Binary. High accuracy needed? Scalar. Standard production? Scalar hits the sweet spot.

**HNSW Indexing:**
Hierarchical navigable small world graphs. Fancy name, simple idea: build a multi-layer network of nearest neighbors. Search becomes O(log n) instead of O(n). At 1M vectors, that's the difference between 8ms and 100 seconds.

**QUIC Synchronization:**
Distribute your database across nodes. Sub-millisecond synchronization. Built-in encryption. Multiplexed streams. Not academic theory—production feature.

```typescript
const node1 = await createAgentDBAdapter({
  enableQUICSync: true,
  syncPeers: ['node2:4433', 'node3:4433']
});

// Pattern inserted on node1
await node1.insertPattern({ /* ... */ });

// Available on node2 and node3 within ~1ms
```

### 5. Multi-Database Management

Separate databases for separate concerns:

```typescript
// Knowledge base
const knowledge = await createAgentDBAdapter({
  dbPath: '.agentdb/knowledge.db'
});

// Conversation history
const conversations = await createAgentDBAdapter({
  dbPath: '.agentdb/conversations.db'
});

// Code patterns
const codePatterns = await createAgentDBAdapter({
  dbPath: '.agentdb/code.db'
});
```

Domain isolation, independent scaling, clear boundaries. Production systems have multiple concerns. AgentDB handles that.

## How This Fits With Claude Flow

Claude Flow uses AgentDB as its memory and learning backend. When you run `npx claude-flow@alpha init --force`, you get Claude Flow's skills system plus AgentDB integration.

But you don't need Claude Flow to use AgentDB. Use it standalone:
- Custom LangChain agents
- Direct OpenAI integration
- Your own agent framework
- As a smart vector database
- Anywhere you need vector search + learning

AgentDB is the engine. Claude Flow is one vehicle that uses it.

## Performance Benchmarks

**Test System:** AMD Ryzen 9 5950X, 64GB RAM

| Operation | Vectors | Unoptimized | Optimized | Improvement |
|-----------|---------|-------------|-----------|-------------|
| Search | 10K | 15ms | 100µs | **150x** |
| Search | 100K | 150ms | 120µs | **1,250x** |
| Search | 1M | 100s | 8ms | **12,500x** |
| Batch Insert (100) | - | 1s | 2ms | **500x** |
| Memory (1M, binary) | - | 3GB | 96MB | **32x** |

These aren't theoretical. Run `npx agentdb@latest benchmark` yourself.

## TypeScript API - For Developers

If you need programmatic access (not just CLI), AgentDB has a clean TypeScript API:

```typescript
import { createAgentDBAdapter, computeEmbedding } from 'agentdb';

// Initialize with optimization
const db = await createAgentDBAdapter({
  dbPath: '.agentdb/vectors.db',
  quantizationType: 'scalar',      // 4x compression
  cacheSize: 1000,                  // LRU cache
  enableLearning: true,             // RL plugins
  enableReasoning: true,            // ReasoningBank
});

// Store document
const embedding = await computeEmbedding("AI agents need memory");
await db.insertPattern({
  id: '',
  type: 'document',
  domain: 'knowledge',
  pattern_data: JSON.stringify({ embedding, text: "AI agents need memory" }),
  confidence: 1.0,
  usage_count: 0,
  success_count: 0,
  created_at: Date.now(),
  last_used: Date.now(),
});

// Search with reasoning
const results = await db.retrieveWithReasoning(queryEmbedding, {
  domain: 'knowledge',
  k: 10,
  useMMR: true,                    // Diverse results
  synthesizeContext: true,         // Rich context
  optimizeMemory: true,            // Auto-consolidation
});

console.log('Memories:', results.memories);
console.log('Context:', results.context);
console.log('Patterns:', results.patterns);
```

The API is fully typed, fast (Rust/WASM core), and production-ready. Perfect for integrating into applications, custom agents, or frameworks like LangChain.

## When To Use AgentDB

**Use AgentDB when:**
- Building agents that need memory beyond single conversations
- Implementing semantic search (code, docs, knowledge bases)
- Creating self-learning systems that improve over time
- Scaling to millions of vectors with tight performance budgets
- Deploying to production where Python dependencies are problematic
- Needing distributed vector databases with cross-node sync
- Building RAG (Retrieval Augmented Generation) pipelines
- Tracking agent experiences and learning from outcomes

**Maybe look elsewhere if:**
- You just need a simple key-value store (use Redis)
- Pure SQL queries are sufficient (use Postgres)
- You're locked into Python ecosystems (use ChromaDB/Pinecone)
- Vectors are rarely searched (<1K total, occasional queries)

AgentDB is for production AI systems that need to remember, learn, and scale.

## What's Next

### Documentation Structure

This introduction covers the "why" and "what." The rest of the docs break down the "how":

- **CLI Reference** - Every command, every flag, every option
- **API Guide** - TypeScript API with examples
- **Vector Search** - Semantic search, hybrid search, distance metrics
- **Learning System** - RL algorithms, training, plugins
- **ReasoningBank** - Trajectory tracking, verdict judgment, memory distillation
- **Optimization** - Quantization, HNSW, caching, scaling strategies
- **Advanced Features** - QUIC sync, multi-database, custom metrics
- **Migration Guide** - Moving from legacy systems to AgentDB
- **Performance Tuning** - Benchmarks, profiling, optimization recipes

Each doc is focused, practical, and example-driven. No fluff.


## 🆚 How AgentDB Compares

| Feature | AgentDB | ChromaDB | Pinecone | Weaviate |
|---------|---------|----------|----------|----------|
| **Startup Time** | <10ms (disk), ~100ms (browser) | Seconds | N/A (cloud) | Seconds |
| **Self-Learning** | ✅ 9 RL algorithms built-in | ❌ No | ❌ No | ❌ No |
| **Browser Support** | ✅ Full WASM | ❌ No | ❌ No | ❌ No |
| **Edge Runtime** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Offline Mode** | ✅ Yes | ✅ Yes | ❌ Cloud-only | ✅ Yes |
| **Setup** | Zero config | Docker/API | API key | Docker/Cloud |
| **Language** | TypeScript/JS | Python | Any (API) | Any (API) |
| **Memory/Vector** | 700 bytes | ~7-70KB | N/A | ~5-10KB |
| **Distributed Sync** | ✅ QUIC built-in | ❌ Manual | ✅ Cloud | ✅ Yes |
| **Pricing** | Free (MIT/Apache-2.0) | Free | $70+/mo | Free + Cloud |
| **Best For** | Agentic systems, learning, edge | Python ML workflows | Managed cloud, scale | GraphQL, hybrid search |

**AgentDB's sweet spot:** You need vector search + learning in JavaScript/TypeScript, want to deploy anywhere (including browsers/edge), and care about sub-10ms startup and minimal resource usage.

---

## 📜 License & Support

### Open Source, Dual Licensed

AgentDB is **free and open source** under dual license:
- **MIT License** - Commercial-friendly, permissive
- **Apache 2.0** - Patent protection, enterprise-safe

Choose whichever license works best for your use case. Both allow commercial use, modification, and distribution.

### Community & Support

- **GitHub**: [ruvnet/agentic-flow](https://github.com/ruvnet/agentic-flow/tree/main/packages/agentdb)
- **Issues**: [Report bugs or request features](https://github.com/ruvnet/agentic-flow/issues)
- **npm Package**: [agentdb on npm](https://www.npmjs.com/package/agentdb)
- **Website**: [agentdb.ruv.io](https://agentdb.ruv.io)
- **Documentation**: [Complete guides](https://github.com/ruvnet/agentic-flow/tree/main/packages/agentdb/docs)

**Getting Help:**
- Open a GitHub issue for bugs or feature requests
- Check existing issues for solutions
- Read the comprehensive documentation
- Explore the interactive demos

### Contributing

AgentDB welcomes contributions:
- 🐛 Bug fixes
- ✨ Feature implementations
- 📖 Documentation improvements
- 🎓 Example code and tutorials
- 🔬 Performance optimizations

See [Contributing Guide](https://github.com/ruvnet/agentic-flow/blob/main/CONTRIBUTING.md)

---

### Resources

- **GitHub**: https://github.com/ruvnet/agentic-flow/tree/main/packages/agentdb
- **Issues**: https://github.com/ruvnet/agentic-flow/issues
- **Package**: https://www.npmjs.com/package/agentdb
- **Website**: https://agentdb.ruv.io

## Final Thoughts

I built AgentDB because the AI agent space needs better infrastructure. Vector databases that actually perform. Learning systems that aren't academic toys. Memory that survives restarts. TypeScript APIs that don't fight you.

It's not perfect. It's evolving. But it's production-ready today, and it solves real problems I've hit building AI systems.

If you're building agents, you need memory and learning. AgentDB gives you both, fast and production-ready.

Let's build intelligent systems that remember and improve.

— ruv

---

**Next:** [CLI Reference](./CLI_REFERENCE.md) | [API Guide](./API_GUIDE.md) | [Quick Start](./QUICK_START.md)
