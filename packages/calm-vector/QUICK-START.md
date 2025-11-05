# 🚀 CALM Vector - Quick Start Guide

## ⚡ Installation

```bash
# Install globally
npm install -g calm-flow

# Or use with npx (no install needed)
npx calm-flow --version
```

## 🎯 5-Minute Tutorial

### 1. Initialize Database
```bash
npx calm-flow init
```

**Output:**
```
✔ Database initialized successfully!
Location: /home/user/.calm-flow/vectors.db
Dimension: 384
Hidden: 768
```

### 2. Ingest Documents
```bash
# Ingest example documents
npx calm-flow ingest examples/

# Or ingest your own documents
npx calm-flow ingest ./my-docs/
```

**Supported formats:** `.txt`, `.md`, `.json`

**Output:**
```
✔ Successfully ingested 4 documents!
Total vectors: 4
```

### 3. Search for Similar Content
```bash
npx calm-flow search "machine learning algorithms" -k 3
```

**Output:**
```
🔍 Top 3 Results for: "machine learning algorithms"

1. sample.txt (distance: 0.2341)
   Machine learning is a subset of artificial intelligence...

2. ai-concepts.md (distance: 0.3127)
   Neural networks are computing systems inspired by...

3. training-pairs.jsonl (distance: 0.4521)
   {"prev": "Machine learning enables computers...
```

### 4. Generate Vector Trajectories
```bash
npx calm-flow generate "deep learning applications" --steps 3 --k 2
```

**Output:**
```
📊 Vector-Only Generation with Retrieval

Prompt: deep learning applications
Steps: 3, Top-K: 2

🔍 Step 1 - Top 2 Similar Documents:
────────────────────────────────────────────────
1. ai-concepts.md (dist: 0.2156)
   Neural networks are computing systems inspired by biological...

2. sample.txt (dist: 0.3421)
   Deep learning is a subfield of machine learning that uses...

🔍 Step 2 - Top 2 Similar Documents:
...
```

### 5. Validate Model Performance
```bash
npx calm-flow validate examples/training-pairs.jsonl -k 3
```

**Output:**
```
✔ Validation complete!

📊 Validation Results:

Pairs evaluated: 8
Average MSE: 0.012456
Precision@3: 75.00%
```

### 6. Check Database Stats
```bash
npx calm-flow stats
```

**Output:**
```
📊 Database Statistics

Database: /home/user/.calm-flow/vectors.db
Documents: 4
Dimension: 384
Hidden: 768
```

---

## 💻 Programmatic Usage

### Basic Example
```typescript
import { Calm, VectorDB } from 'calm-flow';

// Initialize model
const model = new Calm(384, 768);

// Encode text
const embedding = model.encode("Hello world");
console.log(embedding.length); // 384

// Predict next vector
const next = model.step(embedding);

// Multi-step prediction
const trajectory = model.steps(embedding, 5);
console.log(trajectory.length); // 5
```

### Vector Database
```typescript
import { VectorDB } from 'calm-flow';

const db = new VectorDB();

// Insert document
db.insert({
  id: 'doc1',
  text: 'Example document',
  embedding: model.encode('Example document'),
  timestamp: Date.now(),
});

// Search
const results = db.search(model.encode('search query'), 5);
results.forEach(r => {
  console.log(`${r.id}: ${r.distance}`);
});

// Clean up
db.close();
```

### Advanced Usage
```typescript
import { Calm, VectorDB, cosineSimilarity, mse } from 'calm-flow';

const model = new Calm(384, 768);
const db = new VectorDB();

// Batch insert
const docs = [
  { id: '1', text: 'First doc', embedding: model.encode('First doc'), timestamp: Date.now() },
  { id: '2', text: 'Second doc', embedding: model.encode('Second doc'), timestamp: Date.now() },
];
db.insertBatch(docs);

// Compute metrics
const v1 = model.encode("text 1");
const v2 = model.encode("text 2");
const similarity = cosineSimilarity(v1, v2);
console.log(`Similarity: ${similarity}`);

// Multi-step with analysis
const start = model.encode("Initial concept");
const trajectory = model.steps(start, 10);

trajectory.forEach((vec, i) => {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v*v, 0));
  console.log(`Step ${i}: L2 norm = ${norm.toFixed(4)}`);

  // Search at each step
  const results = db.search(vec, 3);
  console.log(`  Top result: ${results[0].id}`);
});

db.close();
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Set vector dimension (default: 384)
export CALM_DIM=384

# Set hidden layer size (default: 768)
export CALM_HIDDEN=768

# Set database path (default: ~/.calm-flow/vectors.db)
export CALM_DB_PATH=/custom/path/vectors.db

# Set data directory (default: ~/.calm-flow)
export CALM_DATA_DIR=/custom/data/dir
```

### .env File
Create `.env` in your project root:
```env
CALM_DIM=384
CALM_HIDDEN=768
CALM_DB_PATH=./data/vectors.db
CALM_DATA_DIR=./data
```

---

## 📚 Common Workflows

### Document Q&A System
```bash
# 1. Ingest knowledge base
npx calm-flow ingest ./knowledge-base/

# 2. Ask questions
npx calm-flow search "What is machine learning?" -k 5
npx calm-flow search "How do neural networks work?" -k 5
```

### Content Recommendation
```typescript
import { VectorDB, Calm } from 'calm-flow';

const model = new Calm(384, 768);
const db = new VectorDB();

// Ingest user preferences
const userPrefs = model.encode("user likes sci-fi movies and technology");

// Find similar content
const recommendations = db.search(userPrefs, 10);
console.log('Recommended:', recommendations.map(r => r.id));
```

### Model Evaluation
```bash
# 1. Create validation pairs (JSONL)
echo '{"prev": "input text", "next": "expected output"}' > pairs.jsonl

# 2. Validate
npx calm-flow validate pairs.jsonl -k 3
```

---

## 🐛 Troubleshooting

### Database Not Found
```bash
# Solution: Initialize first
npx calm-flow init
```

### No Documents Found
```bash
# Solution: Check file extensions (.txt, .md, .json)
ls -la ./documents/
```

### Import Error (TypeScript)
```typescript
// Wrong
import Calm from 'calm-flow';

// Correct
import { Calm, VectorDB } from 'calm-flow';
```

### Dimension Mismatch
```bash
# Ensure consistent dimensions
export CALM_DIM=384  # Must match across encode/search/predict
```

---

## 📖 Next Steps

- Read [README.md](README.md) for full documentation
- Check [examples/](examples/) for more use cases
- Run [examples/workflow.sh](examples/workflow.sh) for end-to-end demo
- Review [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical details

---

## 🔗 Links

- [GitHub Repository](https://github.com/ruvnet/agentic-flow)
- [Issue Tracker](https://github.com/ruvnet/agentic-flow/issues)
- [NPM Package](https://www.npmjs.com/package/calm-flow)
- [Agentic Flow Docs](https://github.com/ruvnet/agentic-flow/tree/main/docs)

---

**Happy Vector Computing! 🧠⚡**
