# agentic-jujutsu

> **WASM-enabled Jujutsu VCS wrapper for AI agent collaboration and learning**

[![Crate](https://img.shields.io/crates/v/agentic-jujutsu.svg)](https://crates.io/crates/agentic-jujutsu)
[![Documentation](https://docs.rs/agentic-jujutsu/badge.svg)](https://docs.rs/agentic-jujutsu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/ruvnet/agentic-flow)
[![Rust](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](https://www.rust-lang.org/)
[![WASM](https://img.shields.io/badge/WASM-ready-blue.svg)](https://webassembly.org/)

Fast, safe, and efficient Jujutsu VCS operations powered by Rust and WebAssembly. Designed for AI agents, with zero-copy operations, conflict-free multi-agent workflows, and cross-platform support.

---

## 🌟 Introduction

**agentic-jujutsu** is a high-performance Rust library that brings the power of [Jujutsu VCS](https://github.com/jj-vcs/jj) to AI agent workflows. It solves the fundamental problem of concurrent multi-agent code editing by leveraging jj's revolutionary operation log and first-class conflict handling.

### Why agentic-jujutsu?

Traditional version control (Git) blocks when conflicts occur, making it impossible for multiple AI agents to edit code simultaneously. **agentic-jujutsu** changes this:

- ✅ **Multiple agents edit concurrently** without blocking
- ✅ **Every operation is logged** for learning and replay
- ✅ **Conflicts are recorded**, not show-stoppers
- ✅ **Run anywhere**: Native Rust, WASM (browser/Node.js/Deno)
- ✅ **Zero-copy operations** with minimal overhead
- ✅ **AgentDB integration** for pattern learning from code evolution

### The Vision

Imagine AI agents collaborating on a codebase like a swarm of developers:
- **Agent 1** refactors authentication
- **Agent 2** updates database schema
- **Agent 3** writes tests
- **Agent 4** reviews changes

All working **simultaneously**, with automatic conflict detection and resolution strategies learned from past operations.

---

## 🆚 Jujutsu vs Git Worktrees

**TL;DR**: Git worktrees provide multiple working directories for the same repo. Jujutsu is a fundamentally different VCS with operation-first design. They solve different problems.

| Feature | Git Worktrees | Jujutsu (jj) |
|---------|---------------|--------------|
| **Multiple directories** | ✅ Yes | ❌ Not the focus |
| **Operation log** | ❌ No | ✅ Yes (every operation recorded) |
| **First-class conflicts** | ❌ No (blocks operations) | ✅ Yes (conflicts are commits) |
| **Auto-commit working copy** | ❌ No (manual staging) | ✅ Yes (working copy IS a commit) |
| **Concurrent agent edits** | ⚠️ Conflicts block | ✅ Conflicts recorded, don't block |
| **Learning from history** | ❌ Limited reflog | ✅ Complete operation log |

**For AI Agents**: Git worktrees still suffer from blocking conflicts. Jujutsu's operation log and first-class conflicts enable true concurrent multi-agent workflows with automatic learning from code evolution.

📖 **[Read full comparison](docs/JJ_VS_WORKTREES.md)** - Detailed analysis with code examples

---

## 🚀 Features & Benefits

### Core Features

#### 🔧 **Zero-Copy jj CLI Operations**
Direct command execution with minimal overhead. Commands execute in <50ms with <5ms logging overhead.

```rust
let jj = JJWrapper::new(JJConfig::default())?;
let result = jj.execute(&["status"]).await?;
// ⚡ Executed in ~20ms
```

#### 🧠 **AI-First Design**
Built specifically for AI agent workflows:
- **Operation Log Tracking**: Every change recorded with full context
- **Conflict Detection**: Automatic conflict identification and notification
- **Pattern Learning**: Sync with AgentDB for learning from code evolution
- **Multi-Agent Coordination**: Built-in hooks for swarm coordination

#### 📦 **WASM Everywhere**
Single codebase, multiple platforms:
- **Browser**: Run in web applications
- **Node.js**: Server-side JavaScript
- **Deno**: Modern JavaScript runtime
- **Native**: Maximum performance Rust binary

```typescript
import { JJWrapper } from '@agentic-flow/jujutsu';
const jj = await JJWrapper.new();
const status = await jj.status();
```

#### ⚡ **Ultra-Fast Performance**
Rust-powered performance with aggressive optimizations:
- **326KB** shared library (highly optimized)
- **<50ms** CLI execution
- **<5ms** operation logging overhead
- **<1ms** serialization per operation

#### 🔒 **Type-Safe APIs**
Full TypeScript definitions included:
```typescript
interface JJOperation {
    operation_id: string;
    command: string;
    user: string;
    timestamp: DateTime;
    success: boolean;
    // ... full type safety
}
```

#### 🌐 **Cross-Platform**
Build once, run anywhere:
- Linux (x64, ARM)
- macOS (Intel, Apple Silicon)
- Windows
- WebAssembly (all browsers)

#### 💾 **AgentDB Integration**
Optional persistence and learning:
```rust
let sync = AgentDBSync::new(true);
sync.sync_operation(&op, "session-001").await?;
```

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **Conflict-Free Collaboration** | Multiple agents edit simultaneously without blocking |
| **Complete Audit Trail** | Every operation logged with full context for debugging and learning |
| **Learn from History** | AgentDB integration enables pattern recognition from code evolution |
| **Time-Travel Debugging** | Explore alternate solutions in parallel branches |
| **Zero Migration Cost** | Git compatibility maintained via jj's Git backend |
| **Developer-Friendly** | Clean APIs, comprehensive docs, extensive examples |

---

## ⚡ Quick Start

### Installation

#### Rust / Native

Add to your `Cargo.toml`:

```toml
[dependencies]
agentic-jujutsu = "0.1.0"
```

#### JavaScript / TypeScript

```bash
npm install @agentic-flow/jujutsu
```

Or with other package managers:
```bash
yarn add @agentic-flow/jujutsu
pnpm add @agentic-flow/jujutsu
```

### Prerequisites

Install Jujutsu VCS:

```bash
# macOS
brew install jj

# Linux (from source)
cargo install jj-cli

# Or download binary from https://github.com/jj-vcs/jj/releases
```

### Basic Usage (Rust)

```rust
use agentic_jujutsu::{JJWrapper, JJConfig};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize wrapper
    let jj = JJWrapper::new(JJConfig::default())?;

    // Execute jj command
    let status = jj.status().await?;
    println!("Status: {}", status.stdout);

    // Get operation history
    let ops = jj.get_operations(10).await?;
    for op in ops {
        println!("Op {}: {} by {}",
            op.operation_id,
            op.command,
            op.user
        );
    }

    // Create a new commit
    let result = jj.describe("AI agent: implement feature X").await?;
    println!("Commit created: {:?}", result);

    Ok(())
}
```

### Basic Usage (JavaScript/TypeScript)

```typescript
import { JJWrapper, JJConfig } from '@agentic-flow/jujutsu';

async function main() {
    // Initialize wrapper
    const jj = await JJWrapper.new(JJConfig.default());

    // Get repository status
    const status = await jj.status();
    console.log('Status:', status.stdout);

    // Get recent operations
    const ops = await jj.getOperations(10);
    ops.forEach(op => {
        console.log(`Op ${op.operation_id}: ${op.command} by ${op.user}`);
    });

    // Create commit
    await jj.describe('AI agent: implement feature X');
}

main().catch(console.error);
```

---

## 📖 Usage

### Configuration

```rust
use agentic_jujutsu::JJConfig;

let config = JJConfig::default()
    .with_jj_path("/usr/local/bin/jj")  // Custom jj path
    .with_repo_path("/path/to/repo")     // Repository location
    .with_timeout(60000)                 // 60 second timeout
    .with_verbose(true)                  // Enable logging
    .with_max_log_entries(5000)          // Keep 5000 operations
    .with_agentdb_sync(true);            // Enable AgentDB sync

let jj = JJWrapper::new(config)?;
```

### Operation History

```rust
// Get all operations
let all_ops = jj.get_operations(100).await?;

// Get operations by specific user
let user_ops = jj.get_user_operations("agent-1", 50).await?;

// Filter operations (requires direct log access)
let wrapper = jj.get_wrapper(); // Access internal log
let log = wrapper.operation_log.lock().unwrap();
let commits = log.filter_by_type(OperationType::Commit);
let recent = log.recent_operations(24); // Last 24 hours
```

### Repository Operations

```rust
// Status
let status = jj.status().await?;

// Log
let log = jj.log(None, 10).await?;

// Diff between commits
let diff = jj.diff("main", "HEAD").await?;
println!("Files changed: {}", diff.files_changed);
println!("Additions: {}, Deletions: {}", diff.additions, diff.deletions);

// New commit
let commit = jj.new_commit(None).await?;

// Describe (edit commit message)
jj.describe("Updated authentication logic").await?;

// Edit specific commit
jj.edit("abc123").await?;

// Abandon changes
jj.abandon(None).await?;
```

### Branch Management

```rust
// Create branch
jj.branch_create("feature-x", None).await?;

// Delete branch
jj.branch_delete("old-feature").await?;

// List branches
let branches = jj.branch_list().await?;
for branch in branches {
    println!("Branch: {} -> {}", branch.name, branch.target);
    if let Some(remote) = branch.remote {
        println!("  Remote: {}", remote);
    }
}
```

### Advanced Operations

```rust
// Squash changes
jj.squash(None, None).await?;

// Rebase
jj.rebase(Some("feature"), "main").await?;

// Conflict resolution
let conflicts = jj.get_conflicts(None).await?;
for conflict in conflicts {
    println!("Conflict in {}: {} sides", conflict.path, conflict.num_sides);
}
jj.resolve("src/main.rs").await?;

// Undo operations
jj.undo(None).await?;

// Restore files
jj.restore(vec!["src/lib.rs"], None, None).await?;
```

### Multi-Agent Workflow

```rust
use agentic_jujutsu::{JJWrapper, JJHooksIntegration, HookContext};

async fn multi_agent_workflow() -> anyhow::Result<()> {
    let jj = JJWrapper::new(JJConfig::default())?;
    let mut hooks = JJHooksIntegration::new(jj, true);

    // Agent 1: Start task
    let ctx = HookContext {
        agent_id: "coder-agent".to_string(),
        session_id: "swarm-001".to_string(),
        task_description: "Implement auth".to_string(),
        timestamp: chrono::Utc::now().timestamp(),
    };

    hooks.on_pre_task(ctx.clone()).await?;

    // Agent 1: Make changes
    // ... edit files ...
    hooks.on_post_edit("src/auth.rs", ctx.clone()).await?;

    // Agent 1: Complete task
    let ops = hooks.on_post_task(ctx).await?;
    println!("Completed {} operations", ops.len());

    Ok(())
}
```

### AgentDB Integration

```rust
use agentic_jujutsu::AgentDBSync;

async fn learn_from_history() -> anyhow::Result<()> {
    let jj = JJWrapper::new(JJConfig::default())?;
    let sync = AgentDBSync::new(true);

    // Get recent operations
    let ops = jj.get_operations(100).await?;

    // Sync to AgentDB for learning
    for op in ops {
        sync.sync_operation(&op, "learning-session").await?;
    }

    // Query statistics
    let stats = sync.get_task_statistics("learning-session").await?;
    println!("Total operations: {}", stats.total_operations);
    println!("Success rate: {:.2}%", stats.success_rate * 100.0);

    Ok(())
}
```

### TypeScript/JavaScript Examples

#### Browser Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Agentic-Jujutsu Demo</title>
</head>
<body>
    <h1>Jujutsu WASM Demo</h1>
    <button id="status-btn">Get Status</button>
    <pre id="output"></pre>

    <script type="module">
        import init, { JJWrapper, JJConfig } from './pkg/agentic_jujutsu.js';

        await init();

        const jj = await JJWrapper.new(JJConfig.default());

        document.getElementById('status-btn').onclick = async () => {
            const status = await jj.status();
            document.getElementById('output').textContent = status.stdout;
        };
    </script>
</body>
</html>
```

#### Node.js Example

```javascript
const { JJWrapper, JJConfig } = require('@agentic-flow/jujutsu');

async function agentWorkflow() {
    const jj = await JJWrapper.new();

    // Agent loop
    while (true) {
        // Get current status
        const status = await jj.status();

        // Make AI-driven changes
        // ... agent edits files ...

        // Commit changes
        await jj.describe(`Agent: ${aiGeneratedMessage}`);

        // Check for conflicts
        const conflicts = await jj.getConflicts();
        if (conflicts.length > 0) {
            console.log('Conflicts detected:', conflicts);
            // Implement conflict resolution strategy
        }

        await new Promise(r => setTimeout(r, 5000));
    }
}

agentWorkflow().catch(console.error);
```

---

## 📚 Documentation

### API Reference

- **[Rust API Docs](https://docs.rs/agentic-jujutsu)** - Complete API documentation
- **[TypeScript Definitions](typescript/index.d.ts)** - Type definitions for JavaScript/TypeScript
- **[Architecture](docs/ARCHITECTURE.md)** - System design and architecture decisions
- **[Hooks Integration](docs/hooks-integration.md)** - Integrating with agentic-flow hooks
- **[WASM Usage](docs/wasm-usage.md)** - WebAssembly usage guide

### Guides

- **[Quick Start](docs/quickstart.md)** - Get started in 5 minutes
- **[Multi-Agent Workflows](examples/integration/)** - Example multi-agent scenarios
- **[Testing](docs/testing.md)** - Testing guide and best practices
- **[Performance](docs/performance.md)** - Optimization and benchmarking

### Examples

- **[Basic Usage](examples/basic_usage.rs)** - Simple examples
- **[Multi-Agent Refactoring](examples/integration/multi_agent_workflow.rs)** - 3 agents collaborating
- **[AgentDB Learning](examples/integration/agentdb_learning.ts)** - Learning from operation history
- **[Browser Integration](examples/javascript/browser-example.html)** - WASM in browser

---

## 🔧 Building

### Native

```bash
# Development build
cargo build

# Release build (optimized)
cargo build --release

# Run tests
cargo test --all-features

# Run clippy
cargo clippy --all-features
```

### WASM

```bash
# Install wasm-pack
cargo install wasm-pack

# Build for web
wasm-pack build --target web --out-dir pkg/web

# Build for Node.js
wasm-pack build --target nodejs --out-dir pkg/node

# Build for bundler
wasm-pack build --target bundler --out-dir pkg/bundler

# Or use convenience script
./scripts/wasm-pack-build.sh
```

### All Targets

```bash
# Build everything
cargo build --release --all-features
./scripts/wasm-pack-build.sh
```

---

## 🧪 Testing

```bash
# Run all tests
cargo test --all-features

# Run specific test suite
cargo test --test integration_tests

# Run with coverage
./scripts/coverage.sh

# Run benchmarks
cargo bench
```

---

## 📊 Performance

| Operation | Latency | Notes |
|-----------|---------|-------|
| CLI Execution | <50ms | Native command execution |
| Operation Logging | <5ms | Overhead per operation |
| Serialization | <1ms | Per operation to JSON |
| WASM Overhead | ~2-3x | Compared to native |

**Library Size**:
- Native `.so`: 326KB
- WASM (web): ~200KB (gzipped)
- WASM (node): ~250KB

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/ruvnet/agentic-flow.git
cd agentic-flow/packages/agentic-jujutsu

# Install dependencies
cargo build

# Run tests
cargo test

# Format code
cargo fmt

# Check lints
cargo clippy
```

---

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Jujutsu VCS](https://github.com/jj-vcs/jj)** - Revolutionary version control system
- **[Agentic-Flow](https://github.com/ruvnet/agentic-flow)** - Multi-agent orchestration framework
- **[AgentDB](https://github.com/ruvnet/agentic-flow/tree/main/packages/agentdb)** - Vector database for AI agents

---

## 🔗 Related Projects

- **[Jujutsu VCS](https://github.com/jj-vcs/jj)** - The underlying version control system
- **[Agentic-Flow](https://github.com/ruvnet/agentic-flow)** - Multi-agent framework
- **[AgentDB](../agentdb)** - Agent memory and learning system

---

## 📞 Support

- **Documentation**: https://docs.rs/agentic-jujutsu
- **Issues**: https://github.com/ruvnet/agentic-flow/issues
- **Discussions**: https://github.com/ruvnet/agentic-flow/discussions

---

**Built with ❤️ for the AI agent community**
