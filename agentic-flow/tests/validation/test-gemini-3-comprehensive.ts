#!/usr/bin/env tsx

/**
 * Comprehensive Gemini 3 Benchmark Test Suite
 * Tests all available Gemini models (3.0, 2.5, 2.0) with direct Google AI SDK
 * Updated November 2025
 */

import { GoogleGenAI } from '@google/genai';

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!GOOGLE_GEMINI_API_KEY) {
  console.error('❌ GOOGLE_GEMINI_API_KEY not set in environment');
  process.exit(1);
}

// All Gemini models to benchmark (as of November 2025)
const MODELS_TO_TEST = [
  // Gemini 3 Series - Latest (Released Nov 18, 2025)
  {
    name: 'gemini-3-pro-preview-11-2025',
    series: 'Gemini 3',
    description: 'SOTA reasoning, coding, multimodal - Latest model',
    released: '2025-11-18'
  },

  // Gemini 2.5 Series - Production
  {
    name: 'gemini-2.5-pro',
    series: 'Gemini 2.5',
    description: 'State-of-the-art thinking model for complex problems',
    released: '2025-02-06'
  },
  {
    name: 'gemini-2.5-flash',
    series: 'Gemini 2.5',
    description: 'Fast, low-latency for high-volume agentic tasks',
    released: '2025-02-06'
  },
  {
    name: 'gemini-2.5-flash-lite',
    series: 'Gemini 2.5',
    description: 'Fastest, lowest cost Gemini 2.5 model',
    released: '2025-02-06'
  },

  // Gemini 2.0 Series - Experimental
  {
    name: 'gemini-2.0-flash-thinking-exp-01-21',
    series: 'Gemini 2.0',
    description: 'Thinking mode, 1M context, 73.3% AIME score',
    released: '2025-01-21'
  },
  {
    name: 'gemini-2.0-flash-exp',
    series: 'Gemini 2.0',
    description: 'Experimental features, 1M context window',
    released: '2024-12-11'
  },

  // Legacy models (for comparison - may not work if retired)
  {
    name: 'gemini-1.5-pro',
    series: 'Gemini 1.5',
    description: 'Legacy Pro model (retired April 29, 2025)',
    released: '2024-05-14',
    deprecated: true
  },
  {
    name: 'gemini-1.5-flash',
    series: 'Gemini 1.5',
    description: 'Legacy Flash model (retired April 29, 2025)',
    released: '2024-05-14',
    deprecated: true
  }
];

interface BenchmarkTask {
  name: string;
  prompt: string;
  category: string;
  expectedFeatures?: string[];
}

const BENCHMARK_TASKS: BenchmarkTask[] = [
  {
    name: 'Simple Reasoning',
    prompt: 'What is 2+2? Respond with just the number.',
    category: 'basic',
    expectedFeatures: ['accuracy']
  },
  {
    name: 'Code Generation',
    prompt: 'Write a TypeScript function that checks if a number is prime. Include comments.',
    category: 'coding',
    expectedFeatures: ['syntax', 'logic', 'documentation']
  },
  {
    name: 'Complex Reasoning',
    prompt: 'Explain the concept of recursion with an example. Be concise but complete.',
    category: 'reasoning',
    expectedFeatures: ['clarity', 'examples', 'accuracy']
  },
  {
    name: 'Math Problem',
    prompt: 'If a train travels 120 miles in 2 hours, what is its average speed in mph?',
    category: 'math',
    expectedFeatures: ['calculation', 'units']
  },
  {
    name: 'Creative Writing',
    prompt: 'Write a haiku about artificial intelligence.',
    category: 'creative',
    expectedFeatures: ['creativity', 'format']
  }
];

interface ModelResult {
  model: string;
  series: string;
  available: boolean;
  error?: string;
  tasks: TaskResult[];
  averageLatency: number;
  totalTokens: number;
  estimatedCost: number;
}

interface TaskResult {
  name: string;
  success: boolean;
  latency: number;
  responseLength: number;
  tokenUsage?: {
    input: number;
    output: number;
  };
  error?: string;
}

async function testModelWithTask(
  client: GoogleGenAI,
  modelName: string,
  task: BenchmarkTask
): Promise<TaskResult> {
  const startTime = Date.now();

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: [{
        role: 'user',
        parts: [{ text: task.prompt }]
      }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });

    const latency = Date.now() - startTime;
    const text = response.text || '';

    return {
      name: task.name,
      success: true,
      latency,
      responseLength: text.length,
      tokenUsage: {
        input: response.usageMetadata?.promptTokenCount || 0,
        output: response.usageMetadata?.candidatesTokenCount || 0
      }
    };

  } catch (error: any) {
    const latency = Date.now() - startTime;

    return {
      name: task.name,
      success: false,
      latency,
      responseLength: 0,
      error: error.message?.substring(0, 100) || 'Unknown error'
    };
  }
}

async function benchmarkModel(
  client: GoogleGenAI,
  modelInfo: typeof MODELS_TO_TEST[0]
): Promise<ModelResult> {
  console.log(`\n📊 Benchmarking: ${modelInfo.name}`);
  console.log(`   Series: ${modelInfo.series}`);
  console.log(`   Description: ${modelInfo.description}`);

  if (modelInfo.deprecated) {
    console.log(`   ⚠️  DEPRECATED - May not be available`);
  }

  const tasks: TaskResult[] = [];
  let totalLatency = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Test each benchmark task
  for (const task of BENCHMARK_TASKS) {
    process.stdout.write(`   Testing ${task.name.padEnd(20)} ... `);

    const result = await testModelWithTask(client, modelInfo.name, task);
    tasks.push(result);

    if (result.success) {
      totalLatency += result.latency;
      totalInputTokens += result.tokenUsage?.input || 0;
      totalOutputTokens += result.tokenUsage?.output || 0;
      console.log(`✅ ${result.latency}ms`);
    } else {
      console.log(`❌ ${result.error}`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const successCount = tasks.filter(t => t.success).length;
  const available = successCount > 0;

  // Calculate estimated cost based on model
  let estimatedCost = 0;
  if (modelInfo.name.includes('gemini-3-pro')) {
    estimatedCost = (totalInputTokens / 1_000_000) * 0.15 + (totalOutputTokens / 1_000_000) * 0.6;
  } else if (modelInfo.name.includes('gemini-2.5-pro')) {
    estimatedCost = (totalInputTokens / 1_000_000) * 0.125 + (totalOutputTokens / 1_000_000) * 0.5;
  } else if (modelInfo.name.includes('gemini-2.5-flash-lite')) {
    estimatedCost = (totalInputTokens / 1_000_000) * 0.0375 + (totalOutputTokens / 1_000_000) * 0.15;
  } else if (modelInfo.name.includes('gemini-2.5-flash')) {
    estimatedCost = (totalInputTokens / 1_000_000) * 0.075 + (totalOutputTokens / 1_000_000) * 0.3;
  } else if (modelInfo.name.includes('gemini-2.0-flash-thinking')) {
    estimatedCost = 0; // Free during preview
  } else {
    estimatedCost = (totalInputTokens / 1_000_000) * 0.075 + (totalOutputTokens / 1_000_000) * 0.3;
  }

  console.log(`   Results: ${successCount}/${tasks.length} tasks passed`);
  console.log(`   Total Tokens: ${totalInputTokens + totalOutputTokens} (in: ${totalInputTokens}, out: ${totalOutputTokens})`);
  console.log(`   Estimated Cost: $${estimatedCost.toFixed(6)}`);

  return {
    model: modelInfo.name,
    series: modelInfo.series,
    available,
    tasks,
    averageLatency: successCount > 0 ? totalLatency / successCount : 0,
    totalTokens: totalInputTokens + totalOutputTokens,
    estimatedCost
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Gemini 3 Comprehensive Benchmark Suite');
  console.log('  Updated November 2025');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`API Key: ${GOOGLE_GEMINI_API_KEY.substring(0, 15)}...\n`);

  const client = new GoogleGenAI({ apiKey: GOOGLE_GEMINI_API_KEY });

  console.log('📋 Models to Test:');
  for (const model of MODELS_TO_TEST) {
    const status = model.deprecated ? '⚠️  DEPRECATED' : '✓';
    console.log(`   ${status} ${model.name} (${model.series})`);
  }

  console.log(`\n📊 Benchmark Tasks: ${BENCHMARK_TASKS.length}`);
  for (const task of BENCHMARK_TASKS) {
    console.log(`   - ${task.name} (${task.category})`);
  }

  console.log('\n' + '═'.repeat(63));
  console.log('  Starting Benchmarks');
  console.log('═'.repeat(63));

  const results: ModelResult[] = [];

  for (const modelInfo of MODELS_TO_TEST) {
    try {
      const result = await benchmarkModel(client, modelInfo);
      results.push(result);
    } catch (error: any) {
      console.log(`\n❌ Failed to benchmark ${modelInfo.name}: ${error.message}`);
      results.push({
        model: modelInfo.name,
        series: modelInfo.series,
        available: false,
        error: error.message,
        tasks: [],
        averageLatency: 0,
        totalTokens: 0,
        estimatedCost: 0
      });
    }
  }

  // Generate comprehensive report
  console.log('\n' + '═'.repeat(63));
  console.log('  BENCHMARK RESULTS SUMMARY');
  console.log('═'.repeat(63) + '\n');

  // Group by series
  const seriesGroups = results.reduce((acc, result) => {
    if (!acc[result.series]) {
      acc[result.series] = [];
    }
    acc[result.series].push(result);
    return acc;
  }, {} as Record<string, ModelResult[]>);

  for (const [series, seriesResults] of Object.entries(seriesGroups)) {
    console.log(`\n📦 ${series} Series:`);
    console.log('─'.repeat(63));

    for (const result of seriesResults) {
      const status = result.available ? '✅' : '❌';
      console.log(`\n   ${status} ${result.model}`);

      if (result.available) {
        const successRate = (result.tasks.filter(t => t.success).length / result.tasks.length * 100).toFixed(1);
        console.log(`      Success Rate: ${successRate}%`);
        console.log(`      Avg Latency: ${result.averageLatency.toFixed(0)}ms`);
        console.log(`      Total Tokens: ${result.totalTokens}`);
        console.log(`      Est. Cost: $${result.estimatedCost.toFixed(6)}`);

        // Task breakdown
        console.log(`      Tasks:`);
        for (const task of result.tasks) {
          const taskStatus = task.success ? '✓' : '✗';
          console.log(`         ${taskStatus} ${task.name}: ${task.latency}ms`);
        }
      } else {
        console.log(`      Error: ${result.error || 'Model not available'}`);
      }
    }
  }

  // Performance comparison
  console.log('\n' + '═'.repeat(63));
  console.log('  PERFORMANCE COMPARISON');
  console.log('═'.repeat(63) + '\n');

  const availableModels = results.filter(r => r.available);

  if (availableModels.length > 0) {
    console.log('⚡ Speed Ranking (by average latency):');
    const bySpeed = [...availableModels].sort((a, b) => a.averageLatency - b.averageLatency);
    bySpeed.forEach((result, i) => {
      console.log(`   ${i + 1}. ${result.model}: ${result.averageLatency.toFixed(0)}ms`);
    });

    console.log('\n💰 Cost Efficiency Ranking (by cost per task):');
    const byCost = [...availableModels].sort((a, b) => a.estimatedCost - b.estimatedCost);
    byCost.forEach((result, i) => {
      const costPerTask = result.estimatedCost / BENCHMARK_TASKS.length;
      console.log(`   ${i + 1}. ${result.model}: $${costPerTask.toFixed(8)}/task`);
    });

    console.log('\n🎯 Reliability Ranking (by success rate):');
    const byReliability = [...availableModels].sort((a, b) => {
      const aRate = a.tasks.filter(t => t.success).length / a.tasks.length;
      const bRate = b.tasks.filter(t => t.success).length / b.tasks.length;
      return bRate - aRate;
    });
    byReliability.forEach((result, i) => {
      const rate = (result.tasks.filter(t => t.success).length / result.tasks.length * 100).toFixed(1);
      console.log(`   ${i + 1}. ${result.model}: ${rate}%`);
    });
  } else {
    console.log('⚠️  No models were successfully tested.');
    console.log('   This could be due to:');
    console.log('   - API key restrictions or permissions');
    console.log('   - Network connectivity issues');
    console.log('   - Rate limiting');
    console.log('   - Model deprecation or unavailability');
  }

  // Recommendations
  console.log('\n' + '═'.repeat(63));
  console.log('  RECOMMENDATIONS');
  console.log('═'.repeat(63) + '\n');

  if (availableModels.length > 0) {
    const fastest = bySpeed[0];
    const cheapest = byCost[0];
    const gemini3 = results.find(r => r.series === 'Gemini 3' && r.available);

    console.log('🚀 For Speed: ' + fastest.model);
    console.log('💰 For Cost: ' + cheapest.model);

    if (gemini3) {
      console.log('🌟 Latest Technology: ' + gemini3.model);
      console.log('   (Gemini 3 - Released Nov 18, 2025)');
    }

    console.log('\n📝 Use Case Recommendations:');
    console.log('   • Complex Reasoning: gemini-3-pro-preview or gemini-2.5-pro');
    console.log('   • Fast API Responses: gemini-2.5-flash-lite');
    console.log('   • Thinking/Planning: gemini-2.0-flash-thinking-exp');
    console.log('   • Cost-Sensitive: gemini-2.5-flash-lite (or thinking-exp for free)');
    console.log('   • Production: gemini-2.5-flash (balanced speed/cost)');
  }

  console.log('\n' + '═'.repeat(63));
  console.log('  Benchmark Complete!');
  console.log('═'.repeat(63) + '\n');

  // Exit code based on results
  if (availableModels.length === 0) {
    console.log('❌ No models were successfully tested.');
    process.exit(1);
  } else if (availableModels.some(r => r.series === 'Gemini 3')) {
    console.log('✅ Gemini 3 integration confirmed and working!');
    process.exit(0);
  } else {
    console.log('⚠️  Some models tested, but Gemini 3 not available.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
