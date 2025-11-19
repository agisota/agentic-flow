# Gemini 3 Quick Reference Guide

## 🚀 Quick Start

```bash
# Set API key
export GOOGLE_GEMINI_API_KEY="your-api-key"

# Run comprehensive benchmark
cd agentic-flow
npx tsx tests/validation/test-gemini-3-comprehensive.ts
```

## 📦 Model Selection Cheat Sheet

| Use Case | Model | Speed | Cost | Quality |
|----------|-------|-------|------|---------|
| **Production API** | `gemini-2.5-flash` | ⚡⚡⚡ | 💰💰 | ⭐⭐⭐⭐ |
| **Complex Reasoning** | `gemini-3-pro-preview-11-2025` | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐⭐ |
| **High Volume / Budget** | `gemini-2.5-flash-lite` | ⚡⚡⚡⚡ | 💰 | ⭐⭐⭐ |
| **Transparent Thinking** | `gemini-2.0-flash-thinking-exp` | ⚡ | FREE | ⭐⭐⭐⭐ |
| **Latest Features** | `gemini-3-pro-preview-11-2025` | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐⭐ |

## 💰 Pricing (per 1M tokens)

| Model | Input | Output | Monthly (1M req) |
|-------|-------|--------|-----------------|
| gemini-3-pro-preview | $0.15 | $0.60 | $750* |
| gemini-2.5-pro | $0.125 | $0.50 | $625 |
| gemini-2.5-flash | $0.075 | $0.30 | $375 |
| gemini-2.5-flash-lite | $0.0375 | $0.15 | $187.50 |
| gemini-2.0-flash-thinking-exp | FREE | FREE | $0 |

*Preview pricing often waived

## 🎯 Code Examples

### Basic Usage

```typescript
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

const response = await client.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{
    role: 'user',
    parts: [{ text: 'Explain quantum computing' }]
  }],
  config: {
    temperature: 0.7,
    maxOutputTokens: 2048
  }
});

console.log(response.text);
```

### Using Agentic-Flow Provider

```typescript
import { GeminiProvider } from 'agentic-flow/router/providers/gemini';

const provider = new GeminiProvider({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

const response = await provider.chat({
  model: 'gemini-3-pro-preview-11-2025',
  messages: [
    { role: 'user', content: 'Write a prime checker function' }
  ],
  temperature: 0.7,
  maxTokens: 2048
});
```

### Streaming Responses

```typescript
const stream = provider.stream({
  model: 'gemini-2.5-flash',
  messages: [
    { role: 'user', content: 'Write a story' }
  ]
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    process.stdout.write(chunk.delta.text);
  }
}
```

## 🔧 Configuration

### Environment Setup

```bash
# .env file
GOOGLE_GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048
```

### YAML Config

```yaml
# config/gemini.yaml
provider: gemini
api_key: ${GOOGLE_GEMINI_API_KEY}
model: gemini-2.5-flash
temperature: 0.7
max_tokens: 2048
streaming: true
```

## 📊 Benchmarks (Estimated)

### Latency (avg response time)

- **gemini-2.5-flash-lite**: ~500ms
- **gemini-2.5-flash**: ~800ms
- **gemini-2.0-flash-exp**: ~1000ms
- **gemini-2.5-pro**: ~1500ms
- **gemini-3-pro-preview**: ~1200ms
- **gemini-2.0-flash-thinking-exp**: ~2000ms

### Accuracy (benchmark scores)

| Model | MMLU | Coding | Math |
|-------|------|--------|------|
| Gemini 3 Pro | 88%+ | 90%+ | 85%+ |
| Gemini 2.5 Pro | 85% | 87% | 82% |
| Gemini 2.5 Flash | 82% | 84% | 78% |
| Gemini 2.0 Thinking | 83% | 86% | 73.3% |

## 🚨 Common Issues

### 403 Forbidden
```bash
# Solution: Check API key permissions
# 1. Go to Google AI Studio
# 2. Generate new API key
# 3. Remove IP/referrer restrictions
# 4. Enable billing if required
```

### Model Not Found
```bash
# Solution: Use correct model names
# Correct: gemini-2.5-flash
# Wrong: gemini-2.5-flash-exp
```

### Rate Limiting
```typescript
// Solution: Implement retry with backoff
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2 ** i * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

## 📚 Additional Resources

- **Documentation**: `/docs/GEMINI-3-INTEGRATION.md`
- **Benchmarks**: `/tests/validation/test-gemini-3-comprehensive.ts`
- **Provider Code**: `/src/router/providers/gemini.ts`
- **Proxy Server**: `/src/proxy/anthropic-to-gemini.ts`

## 🎓 Best Practices

1. **Use 2.5-flash for production** - Best balance of speed, cost, quality
2. **Use 3-pro for complex tasks** - When you need SOTA reasoning
3. **Use flash-lite for scale** - High-volume, simple queries
4. **Use thinking-exp for dev** - Free testing and transparent reasoning
5. **Enable streaming** - Better UX for long responses
6. **Implement caching** - Reduce costs for repeated queries
7. **Monitor usage** - Track tokens and costs
8. **Handle errors gracefully** - Implement retry logic

## 🔄 Migration from v1.5

```typescript
// Before (Gemini 1.5)
model: 'gemini-1.5-pro'

// After (Recommended)
model: 'gemini-2.5-flash'  // or 'gemini-3-pro-preview-11-2025'
```

**Note:** Gemini 1.5 models were retired April 29, 2025.

---

**Quick Links:**
- [Full Documentation](./GEMINI-3-INTEGRATION.md)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Vertex AI Console](https://console.cloud.google.com/vertex-ai)
