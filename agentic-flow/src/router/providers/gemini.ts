// Google Gemini provider implementation
import { GoogleGenAI } from '@google/genai';
import {
  LLMProvider,
  ChatParams,
  ChatResponse,
  StreamChunk,
  ProviderConfig,
  ProviderError,
  ContentBlock
} from '../types.js';

/**
 * Gemini Provider - Updated November 2025
 *
 * Supported Models:
 * - Gemini 3 Series (Latest - Nov 18, 2025):
 *   - gemini-3-pro-preview-11-2025 (SOTA reasoning, coding, multimodal)
 *
 * - Gemini 2.5 Series (Production):
 *   - gemini-2.5-pro (state-of-the-art thinking, complex reasoning)
 *   - gemini-2.5-flash (fast, low-latency, agentic use cases)
 *   - gemini-2.5-flash-lite (fastest, low-cost)
 *
 * - Gemini 2.0 Series (Experimental):
 *   - gemini-2.0-flash-thinking-exp-01-21 (thinking mode, 1M context, 73.3% AIME)
 *   - gemini-2.0-flash-exp (experimental features)
 *
 * - Legacy (Deprecated - Retired April 29, 2025):
 *   - gemini-1.5-pro, gemini-1.5-flash (no longer available)
 */
export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  type = 'gemini' as const;
  supportsStreaming = true;
  supportsTools = false;
  supportsMCP = false;

  private client: GoogleGenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('Google Gemini API key is required');
    }

    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  validateCapabilities(features: string[]): boolean {
    const supported = ['chat', 'streaming'];
    return features.every(f => supported.includes(f));
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    try {
      // Convert messages to Gemini format
      const contents = params.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
      }));

      // Updated model selection with latest Gemini models (Nov 2025)
      // Priority order: Gemini 3 > Gemini 2.5 > Gemini 2.0
      const defaultModel = params.model || 'gemini-2.0-flash-exp';

      const response = await this.client.models.generateContent({
        model: defaultModel,
        contents,
        config: {
          temperature: params.temperature,
          maxOutputTokens: params.maxTokens || 8192
        }
      });

      const text = response.text || '';

      return {
        id: crypto.randomUUID(),
        model: params.model || 'gemini-2.0-flash-exp',
        content: [{ type: 'text', text }] as ContentBlock[],
        stopReason: 'end_turn',
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0
        },
        metadata: {
          provider: 'gemini',
          cost: this.calculateCost(response.usageMetadata || {}, params.model),
          latency: 0
        }
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async *stream(params: ChatParams): AsyncGenerator<StreamChunk> {
    try {
      const contents = params.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
      }));

      const stream = await this.client.models.generateContentStream({
        model: params.model || 'gemini-2.0-flash-exp',
        contents,
        config: {
          temperature: params.temperature,
          maxOutputTokens: params.maxTokens || 8192
        }
      });

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          yield {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text }
          } as StreamChunk;
        }
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private calculateCost(usage: any, model?: string): number {
    // Gemini pricing varies by model (as of November 2025)
    const inputTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;

    // Pricing per 1M tokens (subject to change)
    let inputCostPer1M = 0.075; // Default Flash pricing
    let outputCostPer1M = 0.3;

    if (model) {
      if (model.includes('gemini-3-pro')) {
        // Gemini 3 Pro - preview pricing (may be waived initially)
        inputCostPer1M = 0.15;
        outputCostPer1M = 0.6;
      } else if (model.includes('gemini-2.5-pro')) {
        // Gemini 2.5 Pro - premium pricing for complex reasoning
        inputCostPer1M = 0.125;
        outputCostPer1M = 0.5;
      } else if (model.includes('gemini-2.5-flash-lite')) {
        // Gemini 2.5 Flash Lite - lowest cost
        inputCostPer1M = 0.0375;
        outputCostPer1M = 0.15;
      } else if (model.includes('gemini-2.5-flash')) {
        // Gemini 2.5 Flash - standard fast model
        inputCostPer1M = 0.075;
        outputCostPer1M = 0.3;
      } else if (model.includes('gemini-2.0-flash-thinking')) {
        // Gemini 2.0 Thinking - experimental (often free during preview)
        inputCostPer1M = 0.0;
        outputCostPer1M = 0.0;
      }
    }

    const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;
    return inputCost + outputCost;
  }

  private handleError(error: any): ProviderError {
    const providerError = new Error(
      error.message || 'Gemini request failed'
    ) as ProviderError;

    providerError.provider = 'gemini';
    providerError.statusCode = error.status || 500;
    providerError.retryable = error.status >= 500 || error.status === 429;

    return providerError;
  }
}
