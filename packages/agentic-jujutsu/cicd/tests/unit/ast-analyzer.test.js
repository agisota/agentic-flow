/**
 * Unit Tests for AST Analyzer
 *
 * Tests AST-based code analysis with fallback mode
 */

const assert = require('assert');
const ASTAnalyzer = require('../../src/ast-analyzer');

console.log('\n🧪 Testing AST Analyzer\n');

async function runTests() {
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Initialization
  try {
    console.log('Test 1: AST Analyzer Initialization');
    const analyzer = new ASTAnalyzer({ enabled: true });
    await analyzer.initialize();

    assert(analyzer.enabled, 'Analyzer should be enabled');
    assert.strictEqual(analyzer.fallbackMode, !analyzer.boosterAvailable, 'Should set fallback mode correctly');

    console.log('  ✅ AST analyzer initializes correctly');
    console.log(`     Mode: ${analyzer.boosterAvailable ? 'agent-booster' : 'fallback'}`);
    passedTests++;

    await analyzer.cleanup();
  } catch (error) {
    console.log('  ❌ Initialization test failed:', error.message);
    failedTests++;
  }

  // Test 2: Workflow Analysis (Fallback Mode)
  try {
    console.log('\nTest 2: Workflow Analysis (Fallback Mode)');
    const analyzer = new ASTAnalyzer({ enabled: true });
    await analyzer.initialize();

    const workflow = {
      name: 'test-workflow',
      files: [
        {
          path: 'src/example.js',
          content: `
function longFunction() {
  // This function has many lines
  let count = 0;
  ${Array(60).fill('  count++;').join('\n')}
  return count;
}

function complexNesting() {
  if (true) {
    if (true) {
      if (true) {
        if (true) {
          return 'deeply nested';
        }
      }
    }
  }
}
          `
        }
      ]
    };

    const result = await analyzer.analyzeWorkflow(workflow);

    assert(result.enabled, 'Analysis should be enabled');
    assert(result.summary.totalFiles === 1, 'Should analyze 1 file');
    assert(result.summary.patterns.length > 0, 'Should find patterns');

    console.log('  ✅ Workflow analysis works correctly');
    console.log(`     Files: ${result.summary.totalFiles}, Patterns: ${result.summary.patterns.length}`);
    passedTests++;

    await analyzer.cleanup();
  } catch (error) {
    console.log('  ❌ Workflow analysis test failed:', error.message);
    failedTests++;
  }

  // Test 3: Pattern Detection
  try {
    console.log('\nTest 3: Code Pattern Detection');
    const analyzer = new ASTAnalyzer({ enabled: true });
    await analyzer.initialize();

    const fileWithPatterns = {
      path: 'src/patterns.js',
      content: `
// Magic numbers
const timeout = 5000;
const maxRetries = 10;
const bufferSize = 1024;
const port = 8080;

// Long function (60+ lines)
function veryLongFunction() {
  ${Array(65).fill('  console.log("line");').join('\n')}
}
      `
    };

    const workflow = { files: [fileWithPatterns] };
    const result = await analyzer.analyzeWorkflow(workflow);

    const hasMagicNumbers = result.summary.patterns.some(p => p.type === 'magic-numbers');
    const hasLongFunction = result.summary.patterns.some(p => p.type === 'long-function');

    assert(result.enabled, 'Analysis should be enabled');
    assert(hasMagicNumbers, 'Should detect magic numbers');
    assert(hasLongFunction, 'Should detect long function');

    console.log('  ✅ Pattern detection works correctly');
    passedTests++;

    await analyzer.cleanup();
  } catch (error) {
    console.log('  ❌ Pattern detection test failed:', error.message);
    failedTests++;
  }

  // Test 4: Quality Score Calculation
  try {
    console.log('\nTest 4: Code Quality Score Calculation');
    const analyzer = new ASTAnalyzer({ enabled: true });
    await analyzer.initialize();

    // Good code
    const goodWorkflow = {
      files: [{
        path: 'good.js',
        content: 'function simple() { return true; }'
      }]
    };

    const goodResult = await analyzer.analyzeWorkflow(goodWorkflow);

    // Bad code
    const badWorkflow = {
      files: [{
        path: 'bad.js',
        content: `
function bad() {
  ${Array(70).fill('  console.log("bad");').join('\n')}
  if (1) { if (2) { if (3) { if (4) { if (5) { return; }}}}}
}
        `
      }]
    };

    const badResult = await analyzer.analyzeWorkflow(badWorkflow);

    assert(goodResult.summary.qualityScore > badResult.summary.qualityScore,
      'Good code should have higher quality score');

    console.log('  ✅ Quality score calculation works correctly');
    console.log(`     Good code: ${goodResult.summary.qualityScore}/100`);
    console.log(`     Bad code: ${badResult.summary.qualityScore}/100`);
    passedTests++;

    await analyzer.cleanup();
  } catch (error) {
    console.log('  ❌ Quality score test failed:', error.message);
    failedTests++;
  }

  // Test 5: Caching
  try {
    console.log('\nTest 5: AST Analysis Caching');
    const analyzer = new ASTAnalyzer({ enabled: true, maxCacheSize: 100 });
    await analyzer.initialize();

    const workflow = {
      files: [{
        path: 'cached.js',
        content: 'function test() { return 42; }'
      }]
    };

    // First analysis (cache miss)
    await analyzer.analyzeWorkflow(workflow);
    const firstMisses = analyzer.stats.cacheMisses;

    // Second analysis (should hit cache)
    await analyzer.analyzeWorkflow(workflow);
    const secondMisses = analyzer.stats.cacheMisses;

    assert.strictEqual(secondMisses, firstMisses, 'Second analysis should use cache');
    assert(analyzer.stats.cacheHits > 0, 'Should have cache hits');

    console.log('  ✅ Caching works correctly');
    console.log(`     Cache hits: ${analyzer.stats.cacheHits}, Misses: ${analyzer.stats.cacheMisses}`);
    passedTests++;

    await analyzer.cleanup();
  } catch (error) {
    console.log('  ❌ Caching test failed:', error.message);
    failedTests++;
  }

  // Test 6: Disabled Mode
  try {
    console.log('\nTest 6: AST Analyzer Disabled Mode');
    const analyzer = new ASTAnalyzer({ enabled: false });
    await analyzer.initialize();

    const workflow = {
      files: [{
        path: 'test.js',
        content: 'function test() {}'
      }]
    };

    const result = await analyzer.analyzeWorkflow(workflow);

    assert(!result.enabled, 'Analysis should be disabled');
    assert(result.reason, 'Should have reason for disabled');

    console.log('  ✅ Disabled mode works correctly');
    passedTests++;

    await analyzer.cleanup();
  } catch (error) {
    console.log('  ❌ Disabled mode test failed:', error.message);
    failedTests++;
  }

  // Test 7: Empty Workflow
  try {
    console.log('\nTest 7: Empty Workflow Handling');
    const analyzer = new ASTAnalyzer({ enabled: true });
    await analyzer.initialize();

    const emptyWorkflow = { files: [] };
    const result = await analyzer.analyzeWorkflow(emptyWorkflow);

    assert(result.enabled, 'Should still be enabled');
    assert.strictEqual(result.summary.totalFiles, 0, 'Should have 0 files');

    console.log('  ✅ Empty workflow handling works correctly');
    passedTests++;

    await analyzer.cleanup();
  } catch (error) {
    console.log('  ❌ Empty workflow test failed:', error.message);
    failedTests++;
  }

  // Test 8: Statistics Tracking
  try {
    console.log('\nTest 8: Statistics Tracking');
    const analyzer = new ASTAnalyzer({ enabled: true });
    await analyzer.initialize();

    const workflow = {
      files: [{
        path: 'stats.js',
        content: 'function stats() { return; }'
      }]
    };

    await analyzer.analyzeWorkflow(workflow);
    await analyzer.analyzeWorkflow(workflow);
    await analyzer.analyzeWorkflow(workflow);

    const stats = analyzer.getStats();

    assert.strictEqual(stats.totalAnalyses, 3, 'Should track total analyses');
    assert(stats.avgAnalysisTime > 0, 'Should track average time');
    assert(stats.cacheHitRate >= 0 && stats.cacheHitRate <= 1, 'Should calculate hit rate');

    console.log('  ✅ Statistics tracking works correctly');
    console.log(`     Total: ${stats.totalAnalyses}, Avg time: ${stats.avgAnalysisTime.toFixed(2)}ms`);
    passedTests++;

    await analyzer.cleanup();
  } catch (error) {
    console.log('  ❌ Statistics tracking test failed:', error.message);
    failedTests++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 AST Analyzer Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}/8`);
  console.log(`❌ Failed: ${failedTests}/8`);
  console.log(`📈 Success Rate: ${((passedTests / 8) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
