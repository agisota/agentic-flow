#!/bin/bash
# Example workflow for CALM Flow

set -e

echo "🚀 CALM Flow Example Workflow"
echo "================================"
echo ""

# Initialize database
echo "1. Initializing database..."
npx calm-flow init

# Ingest example documents
echo ""
echo "2. Ingesting example documents..."
npx calm-flow ingest examples/

# Show statistics
echo ""
echo "3. Database statistics:"
npx calm-flow stats

# Search example
echo ""
echo "4. Searching for 'neural networks'..."
npx calm-flow search "neural networks" -k 3

# Generate trajectories
echo ""
echo "5. Generating vector trajectories..."
npx calm-flow generate "deep learning applications" -s 3 -k 3

# Validate (if training pairs exist)
if [ -f "examples/training-pairs.jsonl" ]; then
  echo ""
  echo "6. Validating model..."
  npx calm-flow validate examples/training-pairs.jsonl -k 3
fi

echo ""
echo "✅ Workflow complete!"
