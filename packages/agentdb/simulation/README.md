# AgentDB v2 Simulation System - Overview

**Version**: 2.0.0
**Status**: Production-Ready
**Total Scenarios**: 17 (9 Basic + 8 Advanced)
**Success Rate**: 100%

---

## 🎯 Purpose

The AgentDB Simulation System provides comprehensive testing and demonstration of AgentDB v2's capabilities across diverse AI scenarios.

See individual scenario READMEs in `scenarios/README-basic/` and `scenarios/README-advanced/` for detailed documentation.

---

## 📊 All 17 Scenarios

### Basic Scenarios (9)
1. lean-agentic-swarm - Lightweight coordination
2. reflexion-learning - Episodic memory
3. voting-system-consensus - Democratic decisions
4. stock-market-emergence - Trading simulation
5. strange-loops - Meta-cognition
6. causal-reasoning - Causal analysis
7. skill-evolution - Lifelong learning
8. multi-agent-swarm - Concurrent access
9. graph-traversal - Cypher queries

### Advanced Simulations (8)
1. bmssp-integration - Symbolic-subsymbolic
2. sublinear-solver - O(log n) optimization
3. temporal-lead-solver - Time-series
4. psycho-symbolic-reasoner - Cognitive modeling
5. consciousness-explorer - Consciousness layers
6. goalie-integration - Goal-oriented learning
7. aidefence-integration - Security threats
8. research-swarm - Distributed research

## 🚀 Quick Start

```bash
# List scenarios
npx tsx simulation/cli.ts list

# Run scenario
npx tsx simulation/cli.ts run reflexion-learning --iterations 10

# Benchmark all
npx tsx simulation/cli.ts benchmark --all
```

See FINAL-STATUS.md for complete system status.
