#!/usr/bin/env node
/**
 * Verify Provider Selection for Research Swarm
 * Shows which provider will be selected based on current environment
 */

const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

console.log(`${BLUE}╔════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BLUE}║  Provider Selection Verification                  ║${RESET}`);
console.log(`${BLUE}╚════════════════════════════════════════════════════╝${RESET}`);
console.log('');

// Check API keys
const apiKeys = {
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  openrouter: !!process.env.OPENROUTER_API_KEY,
  gemini: !!process.env.GOOGLE_GEMINI_API_KEY
};

console.log(`${BLUE}API Keys Detected:${RESET}`);
console.log(`  Anthropic:  ${apiKeys.anthropic ? `${GREEN}✓ Set${RESET}` : `${RED}✗ Not set${RESET}`}`);
console.log(`  OpenRouter: ${apiKeys.openrouter ? `${GREEN}✓ Set${RESET}` : `${RED}✗ Not set${RESET}`}`);
console.log(`  Gemini:     ${apiKeys.gemini ? `${GREEN}✓ Set${RESET}` : `${RED}✗ Not set${RESET}`}`);
console.log('');

// Check PROVIDER environment variable
const providerEnv = process.env.PROVIDER;
console.log(`${BLUE}PROVIDER Environment Variable:${RESET}`);
console.log(`  ${providerEnv ? `${GREEN}Set to: "${providerEnv}"${RESET}` : `${YELLOW}Not set (will default to 'anthropic')${RESET}`}`);
console.log('');

// Simulate provider selection logic
console.log(`${BLUE}Provider Selection Simulation:${RESET}`);

let selectedProvider = 'none';
let reason = '';

if (providerEnv) {
  // If PROVIDER is explicitly set, use it
  if (apiKeys[providerEnv]) {
    selectedProvider = providerEnv;
    reason = `PROVIDER env var set to "${providerEnv}" and API key available`;
  } else {
    selectedProvider = 'error';
    reason = `PROVIDER env var set to "${providerEnv}" but API key not found`;
  }
} else {
  // Default selection logic (matches agentic-flow router)
  if (apiKeys.anthropic) {
    selectedProvider = 'anthropic';
    reason = 'ANTHROPIC_API_KEY detected, used as default';
  } else if (apiKeys.openrouter) {
    selectedProvider = 'openrouter';
    reason = 'No ANTHROPIC_API_KEY, falling back to OPENROUTER_API_KEY';
  } else if (apiKeys.gemini) {
    selectedProvider = 'gemini';
    reason = 'No Anthropic/OpenRouter, falling back to GEMINI';
  } else {
    selectedProvider = 'none';
    reason = 'No API keys found';
  }
}

if (selectedProvider === 'error') {
  console.log(`  ${RED}✗ ERROR${RESET}`);
  console.log(`  Reason: ${reason}`);
} else if (selectedProvider === 'none') {
  console.log(`  ${RED}✗ No provider available${RESET}`);
  console.log(`  Reason: ${reason}`);
} else {
  const color = selectedProvider === 'openrouter' ? GREEN : YELLOW;
  console.log(`  ${color}→ Will use: ${selectedProvider}${RESET}`);
  console.log(`  Reason: ${reason}`);
}
console.log('');

// Research-swarm hardcoded behavior warning
if (apiKeys.anthropic && selectedProvider !== 'anthropic' && providerEnv === 'openrouter') {
  console.log(`${YELLOW}⚠️  WARNING: Research-Swarm Hardcoded Behavior${RESET}`);
  console.log(`  Research-swarm hardcodes 'anthropic' as provider.`);
  console.log(`  Even though PROVIDER=openrouter, it may still use Anthropic.`);
  console.log('');
  console.log(`  ${BLUE}Solution:${RESET} Use the wrapper scripts:`);
  console.log(`    ./run-with-openrouter.sh "Your task"`);
  console.log('');
}

// Recommendations
console.log(`${BLUE}Recommendations:${RESET}`);

if (selectedProvider === 'openrouter') {
  console.log(`  ${GREEN}✓ OpenRouter will be used${RESET}`);
  console.log(`  ${GREEN}✓ Cost savings: ~99% vs Anthropic direct${RESET}`);
  console.log('');
  console.log(`  Run research with:`);
  console.log(`    ./run-with-openrouter.sh "Your research task"`);
} else if (selectedProvider === 'anthropic' && apiKeys.openrouter) {
  console.log(`  ${YELLOW}To use OpenRouter instead:${RESET}`);
  console.log(`    1. Temporarily unset ANTHROPIC_API_KEY:`);
  console.log(`       unset ANTHROPIC_API_KEY`);
  console.log('');
  console.log(`    2. Set PROVIDER to openrouter:`);
  console.log(`       export PROVIDER=openrouter`);
  console.log('');
  console.log(`    3. Or use the wrapper script:`);
  console.log(`       ./run-with-openrouter.sh "Your task"`);
} else if (selectedProvider === 'anthropic') {
  console.log(`  ${YELLOW}Using Anthropic (highest quality, highest cost)${RESET}`);
  console.log(`  To enable OpenRouter (99% cost savings):`);
  console.log(`    export OPENROUTER_API_KEY="sk-or-v1-..."`);
} else {
  console.log(`  ${RED}No valid provider configuration found${RESET}`);
  console.log(`  Set at least one API key:`);
  console.log(`    export OPENROUTER_API_KEY="sk-or-v1-..."`);
}

console.log('');
console.log(`${BLUE}═══════════════════════════════════════════════════${RESET}`);

// Exit with appropriate code
process.exit(selectedProvider === 'error' || selectedProvider === 'none' ? 1 : 0);
