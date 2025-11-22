#!/usr/bin/env node
/**
 * Run all tests for CI/CD module
 */

const { runTests: runUnitTests } = require('./unit/vectordb.test');
const { runTests: runIntegrationTests } = require('./integration/workflow.test');
const { benchmark } = require('./benchmarks/performance.bench');

async function runAllTests() {
  console.log('\n🚀 Running Complete CI/CD Test Suite\n');
  console.log('='.repeat(60));

  let allPassed = true;

  try {
    // Unit Tests
    console.log('\n📦 Phase 1: Unit Tests\n');
    await runUnitTests();
    console.log('✅ Unit tests completed\n');

  } catch (error) {
    console.error('❌ Unit tests failed:', error.message);
    allPassed = false;
  }

  try {
    // Integration Tests
    console.log('\n🔗 Phase 2: Integration Tests\n');
    await runIntegrationTests();
    console.log('✅ Integration tests completed\n');

  } catch (error) {
    console.error('❌ Integration tests failed:', error.message);
    allPassed = false;
  }

  try {
    // Benchmarks
    console.log('\n⚡ Phase 3: Performance Benchmarks\n');
    await benchmark();
    console.log('✅ Benchmarks completed\n');

  } catch (error) {
    console.error('❌ Benchmarks failed:', error.message);
    allPassed = false;
  }

  // Final Summary
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED\n');
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
