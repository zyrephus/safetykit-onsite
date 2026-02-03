# OpenAI Node.js SDK Documentation

> Reference documentation for OpenAI API with Node.js/TypeScript - chat completions and structured output.

## Installation

```bash
npm install openai
# For structured output with Zod (optional but recommended)
npm install zod
```

## Basic Setup

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to this env var
});
```

## Chat Completions

### Basic Usage
```typescript
const completion = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' }
  ],
});

console.log(completion.choices[0].message.content);
```

### With JSON Response Format
```typescript
const completion = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'Analyze this website and respond with JSON.' },
    { role: 'user', content: 'Website content here...' }
  ],
  response_format: { type: 'json_object' },
  temperature: 0.1,  // Lower = more consistent
});

const result = JSON.parse(completion.choices[0].message.content);
```

## Structured Output with Zod

### Basic Structured Parsing
```typescript
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const client = new OpenAI();

// Define your schema
const AnalysisResult = z.object({
  is_violation: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
  evidence: z.array(z.string()),
});

// Use with parse()
const completion = await client.chat.completions.parse({
  model: 'gpt-4o-2024-08-06',
  messages: [
    { role: 'system', content: 'Analyze websites for violations.' },
    { role: 'user', content: 'Website content here...' }
  ],
  response_format: zodResponseFormat(AnalysisResult, 'analysis_result'),
});

// Access typed, parsed data
const message = completion.choices[0]?.message;
if (message?.parsed) {
  console.log(message.parsed.is_violation);  // boolean
  console.log(message.parsed.confidence);     // 'high' | 'medium' | 'low'
  console.log(message.parsed.reasoning);      // string
}
```

### Complex Schema Example
```typescript
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const ViolationAnalysis = z.object({
  accepts_visa: z.boolean(),
  visa_evidence: z.string(),
  sells_adderall: z.boolean(),
  adderall_evidence: z.string(),
  is_licensed_pharmacy: z.boolean(),
  license_evidence: z.string(),
  is_violation: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
});

const completion = await client.chat.completions.parse({
  model: 'gpt-4o-2024-08-06',
  messages: [
    {
      role: 'system',
      content: `You analyze websites for Visa payment network violations.
        A violation requires ALL THREE:
        1. Accepts Visa payment
        2. Sells Adderall (controlled substance)
        3. NOT a licensed pharmacy`
    },
    {
      role: 'user',
      content: `URL: ${url}\n\nContent:\n${websiteContent}`
    }
  ],
  response_format: zodResponseFormat(ViolationAnalysis, 'violation_analysis'),
  temperature: 0.1,
});

const result = completion.choices[0]?.message?.parsed;
if (result) {
  console.log(`Violation: ${result.is_violation} (${result.confidence})`);
  console.log(`Reasoning: ${result.reasoning}`);
}
```

## Error Handling

```typescript
import OpenAI from 'openai';

try {
  const completion = await client.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [...],
    response_format: zodResponseFormat(Schema, 'schema_name'),
  });

  const message = completion.choices[0]?.message;

  if (message?.parsed) {
    // Success - use parsed data
    console.log(message.parsed);
  } else if (message?.refusal) {
    // Model refused to answer
    console.log('Model refused:', message.refusal);
  }
} catch (error) {
  if (error instanceof OpenAI.LengthFinishReasonError) {
    console.error('Response truncated due to length');
  } else if (error instanceof OpenAI.ContentFilterFinishReasonError) {
    console.error('Response blocked by content filter');
  } else if (error instanceof OpenAI.APIError) {
    console.error('API Error:', error.status, error.message);
  } else {
    throw error;
  }
}
```

## Function Calling / Tools

```typescript
import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod';

const QuerySchema = z.object({
  table: z.enum(['users', 'orders', 'products']),
  columns: z.array(z.string()),
  conditions: z.array(z.object({
    column: z.string(),
    operator: z.enum(['=', '>', '<', '!=', 'LIKE']),
    value: z.union([z.string(), z.number()]),
  })),
});

const completion = await client.chat.completions.parse({
  model: 'gpt-4o-2024-08-06',
  messages: [
    { role: 'system', content: 'Help users query the database.' },
    { role: 'user', content: 'Find all orders from last month' }
  ],
  tools: [zodFunction({ name: 'query', parameters: QuerySchema })],
});

const toolCall = completion.choices[0]?.message.tool_calls?.[0];
if (toolCall) {
  const args = toolCall.function.parsed_arguments;
  console.log(args.table);      // typed as 'users' | 'orders' | 'products'
  console.log(args.columns);    // typed as string[]
  console.log(args.conditions); // typed array of condition objects
}
```

## Available Models

| Model | Best For | Notes |
|-------|----------|-------|
| `gpt-4o` | Most capable, multimodal | Recommended for complex analysis |
| `gpt-4o-2024-08-06` | Structured output | Required for `parse()` method |
| `gpt-4o-mini` | Fast, cost-effective | Good for simple classification |
| `gpt-4-turbo` | Previous generation | Still capable |

## Best Practices

### 1. Use Low Temperature for Consistency
```typescript
temperature: 0.1  // More deterministic responses
```

### 2. Be Explicit in System Prompts
```typescript
{
  role: 'system',
  content: `You are analyzing websites for violations.

    CRITERIA (all must be true):
    1. Accepts Visa
    2. Sells controlled substances
    3. Not licensed

    Respond with JSON only.`
}
```

### 3. Limit Input Size
```typescript
// Truncate long content
const truncated = websiteContent.slice(0, 15000);
```

### 4. Handle Rate Limits
```typescript
async function classifyWithRetry(content: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await classify(content);
    } catch (error) {
      if (error instanceof OpenAI.RateLimitError && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}
```

## Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
```

The SDK automatically reads `OPENAI_API_KEY` from environment.
