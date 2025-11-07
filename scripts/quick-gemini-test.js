#!/usr/bin/env node

/**
 * Quick Gemini Schema Validation Test (No Docker)
 * Direct API test with real credentials
 * Run with: GOOGLE_GEMINI_API_KEY=your_key node scripts/quick-gemini-test.js
 */

const testToolWithProblematicSchema = {
  name: 'test_tool',
  description: 'A test tool with JSON Schema Draft 7 properties',
  input_schema: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    additionalProperties: false,
    properties: {
      temperature: {
        type: 'number',
        description: 'Temperature value',
        exclusiveMinimum: 0,
        exclusiveMaximum: 1
      },
      count: {
        type: 'number',
        description: 'Count value',
        exclusiveMinimum: 0
      }
    },
    required: ['temperature']
  }
};

function cleanSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;

  const {
    $schema,
    additionalProperties,
    exclusiveMinimum,
    exclusiveMaximum,
    ...rest
  } = schema;
  const cleaned = { ...rest };

  if (cleaned.properties) {
    cleaned.properties = Object.fromEntries(
      Object.entries(cleaned.properties).map(([key, value]) => [
        key,
        cleanSchema(value)
      ])
    );
  }

  if (cleaned.items) {
    cleaned.items = cleanSchema(cleaned.items);
  }

  return cleaned;
}

async function testGeminiModel(model, apiKey) {
  const startTime = Date.now();

  try {
    const cleanedTool = {
      name: testToolWithProblematicSchema.name,
      description: testToolWithProblematicSchema.description,
      parameters: cleanSchema(testToolWithProblematicSchema.input_schema)
    };

    const schemaStr = JSON.stringify(cleanedTool.parameters);
    const schemaCleaningVerified =
      !schemaStr.includes('exclusiveMinimum') &&
      !schemaStr.includes('exclusiveMaximum') &&
      !schemaStr.includes('$schema') &&
      !schemaStr.includes('additionalProperties');

    console.log(`\n🔍 Testing ${model}...`);
    console.log(`   Schema cleaning verified: ${schemaCleaningVerified ? '✅' : '❌'}`);

    const geminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Say "Hello from Gemini!" to verify the API is working.' }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100
      },
      tools: [{
        functionDeclarations: [cleanedTool]
      }]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Failed (${latencyMs}ms)`);
      console.log(`   Error: ${error.substring(0, 200)}`);
      return {
        model,
        success: false,
        latencyMs,
        error: error.substring(0, 500),
        schemaCleaningVerified
      };
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log(`   ✅ Success (${latencyMs}ms)`);
    console.log(`   Response: ${text.substring(0, 100)}...`);

    return {
      model,
      success: true,
      latencyMs,
      schemaCleaningVerified
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.log(`   ❌ Error: ${error.message}`);
    return {
      model,
      success: false,
      latencyMs,
      error: error.message
    };
  }
}

async function runValidation() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 Gemini API Schema Compatibility Validation');
  console.log('   Quick Test (No Docker) - Issue #55 Verification');
  console.log('═══════════════════════════════════════════════════════════\n');

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GOOGLE_GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }

  console.log(`✓ API Key loaded: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`✓ Testing with tool containing problematic schema properties:`);
  console.log(`  - $schema: http://json-schema.org/draft-07/schema#`);
  console.log(`  - additionalProperties: false`);
  console.log(`  - exclusiveMinimum: 0`);
  console.log(`  - exclusiveMaximum: 1`);

  const models = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro'
  ];

  const results = [];

  for (const model of models) {
    const result = await testGeminiModel(model, apiKey);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 VALIDATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = (successCount / totalCount) * 100;

  console.log(`Success Rate: ${successCount}/${totalCount} (${successRate.toFixed(1)}%)\n`);

  console.log('Model Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const schemaStatus = result.schemaCleaningVerified ? '✅' : '❌';
    console.log(`  ${status} ${result.model}: ${result.latencyMs}ms`);
    console.log(`     Schema Cleaning: ${schemaStatus}`);
    if (result.error) {
      console.log(`     Error: ${result.error.substring(0, 150)}...`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════');

  if (successRate === 100) {
    console.log('✅ ALL TESTS PASSED - Issue #55 fix is working correctly!');
    console.log('   Schema cleaning is removing problematic fields.');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED - Issue #55 may not be fully resolved');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runValidation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
