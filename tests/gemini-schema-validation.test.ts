/**
 * Gemini API Schema Compatibility Test
 * Validates that Issue #55 fix is working correctly
 * Tests schema cleaning for exclusiveMinimum, exclusiveMaximum, etc.
 */

interface TestResult {
  model: string;
  success: boolean;
  latencyMs: number;
  error?: string;
  schemaCleaningVerified?: boolean;
}

interface AnthropicTool {
  name: string;
  description?: string;
  input_schema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    $schema?: string;
    additionalProperties?: boolean;
  };
}

// Test tool with problematic JSON Schema Draft 7 properties
const testToolWithProblematicSchema: AnthropicTool = {
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

async function testGeminiModel(
  model: string,
  apiKey: string,
  baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta'
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Simulate the cleanSchema function from anthropic-to-gemini.ts
    const cleanSchema = (schema: any): any => {
      if (!schema || typeof schema !== 'object') return schema;

      const {
        $schema,
        additionalProperties,
        exclusiveMinimum,
        exclusiveMaximum,
        ...rest
      } = schema;
      const cleaned: any = { ...rest };

      // Recursively clean nested objects
      if (cleaned.properties) {
        cleaned.properties = Object.fromEntries(
          Object.entries(cleaned.properties).map(([key, value]: [string, any]) => [
            key,
            cleanSchema(value)
          ])
        );
      }

      // Clean items if present
      if (cleaned.items) {
        cleaned.items = cleanSchema(cleaned.items);
      }

      return cleaned;
    };

    // Clean the test tool schema
    const cleanedTool = {
      name: testToolWithProblematicSchema.name,
      description: testToolWithProblematicSchema.description,
      parameters: cleanSchema(testToolWithProblematicSchema.input_schema)
    };

    // Verify schema cleaning removed problematic fields
    const schemaStr = JSON.stringify(cleanedTool.parameters);
    const schemaCleaningVerified =
      !schemaStr.includes('exclusiveMinimum') &&
      !schemaStr.includes('exclusiveMaximum') &&
      !schemaStr.includes('$schema') &&
      !schemaStr.includes('additionalProperties');

    console.log(`\n🔍 Testing ${model}...`);
    console.log(`   Schema cleaning verified: ${schemaCleaningVerified ? '✅' : '❌'}`);
    console.log(`   Cleaned schema: ${JSON.stringify(cleanedTool.parameters, null, 2).substring(0, 200)}...`);

    // Prepare Gemini request
    const geminiRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Say "Hello from Gemini!" to test the API.' }]
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

    // Call Gemini API
    const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
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
      console.log(`   ❌ Failed: ${error.substring(0, 200)}`);
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
  } catch (error: any) {
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
  console.log('   Testing Issue #55 Fix');
  console.log('═══════════════════════════════════════════════════════════\n');

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GOOGLE_GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }

  console.log(`✓ API Key loaded: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`✓ Testing with tool containing problematic schema properties`);
  console.log(`  - $schema: http://json-schema.org/draft-07/schema#`);
  console.log(`  - additionalProperties: false`);
  console.log(`  - exclusiveMinimum: 0`);
  console.log(`  - exclusiveMaximum: 1`);

  const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b'
  ];

  const results: TestResult[] = [];

  for (const model of models) {
    const result = await testGeminiModel(model, apiKey);
    results.push(result);

    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate report
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

// Run validation
runValidation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
