#!/usr/bin/env tsx

/**
 * Check available Gemini models via @google/genai package
 */

import { GoogleGenAI } from '@google/genai';

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!GOOGLE_GEMINI_API_KEY) {
  console.error('❌ GOOGLE_GEMINI_API_KEY not set in environment');
  process.exit(1);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Checking Available Gemini Models');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = new GoogleGenAI({ apiKey: GOOGLE_GEMINI_API_KEY });

  console.log(`API Key: ${GOOGLE_GEMINI_API_KEY.substring(0, 15)}...\n`);

  // Try to list models
  try {
    console.log('🔍 Attempting to list models...\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Models retrieved successfully!\n');

      const geminiModels = data.models?.filter((m: any) =>
        m.name.includes('gemini')
      ) || [];

      console.log(`Found ${geminiModels.length} Gemini models:\n`);

      for (const model of geminiModels) {
        console.log(`📦 ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description?.substring(0, 100) || 'N/A'}...`);
        console.log('');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to retrieve models');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      console.log('\n');
    }
  } catch (error: any) {
    console.error('❌ Error listing models:', error.message);
  }

  // Test with known models
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Testing Known Models');
  console.log('═══════════════════════════════════════════════════════════\n');

  const modelsToTest = [
    'gemini-3-pro-preview-11-2025',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-thinking-exp-01-21',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName.padEnd(40)} ... `);

      const response = await client.models.generateContent({
        model: modelName,
        contents: [{
          role: 'user',
          parts: [{ text: 'Say "ok" if you can read this.' }]
        }],
        config: {
          maxOutputTokens: 10
        }
      });

      if (response.text) {
        console.log(`✅ AVAILABLE`);
      } else {
        console.log(`⚠️  UNKNOWN (no text response)`);
      }
    } catch (error: any) {
      const errorMsg = error.message?.substring(0, 100) || 'Unknown error';
      if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        console.log(`❌ NOT FOUND`);
      } else if (errorMsg.includes('quota') || errorMsg.includes('429')) {
        console.log(`⚠️  QUOTA EXCEEDED`);
      } else {
        console.log(`❌ ERROR: ${errorMsg}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
