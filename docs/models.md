# Models Module

The Models module handles AI model integration, currently supporting Google's Gemini models with a flexible architecture for future extensions.

## Functions

### `model(name: ModelName): Model`

Factory function that creates and returns a model instance based on the specified model name.

**Parameters:**
- `name: ModelName` - The name of the model to instantiate

**Returns:** `Model` - Model instance implementing the Model interface

**Example:**
```typescript
import { model } from '@hgraph/agent'

const geminiModel = model('gemini')
const proModel = model('gemini-pro')
```

## Types

### ModelName

Union type of all supported model names:

```typescript
type ModelName = 
  | 'gemini'                    // Default Gemini (uses 2.5 Flash)
  | 'gemini-pro'               // Gemini Pro
  | 'gemini-1.5-pro'           // Gemini 1.5 Pro
  | 'gemini-flash'             // Gemini Flash
  | 'gemini-2.5-pro'           // Gemini 2.5 Pro
  | 'gemini-2.5-flash'         // Gemini 2.5 Flash
  | 'gemini-2.5-flash-lite'    // Gemini 2.5 Flash Lite
  | 'gemini-2.0-flash'         // Gemini 2.0 Flash
  | 'gemini-2.0-flash-lite'    // Gemini 2.0 Flash Lite
  | 'gemini-embedding-001'     // Gemini Embedding
  // ... and other Gemini variants
```

### Model

Base interface that all model implementations must follow:

```typescript
interface Model {
  startChat(history: AgentMessage[], tools?: Map<string, ToolFunction<any>>): ChatSession
  sendMessage(chat: ChatSession, message: AgentMessage): Promise<ModelResponse>
}
```

**Methods:**
- `startChat()` - Initializes a new chat session with conversation history and available tools
- `sendMessage()` - Sends a message to the model and returns the response

## Gemini Model Implementation

### GeminiModel

The primary model implementation using Google's Generative AI SDK.

#### Constructor

```typescript
constructor(modelName: GeminiModelName)
```

**Features:**
- Tool calling support via function declarations
- Conversation history management
- Streaming and non-streaming responses
- Safety settings configuration
- Generation configuration (temperature, top-p, etc.)

#### Key Methods

##### `startChat(history: AgentMessage[], tools?: Map<string, ToolFunction<any>>): GenerativeModel`

Creates a new Gemini chat session.

**Parameters:**
- `history: AgentMessage[]` - Previous conversation messages
- `tools?: Map<string, ToolFunction<any>>` - Available tools for the session

**Returns:** `GenerativeModel` - Gemini chat session instance

##### `sendMessage(chat: GenerativeModel, message: AgentMessage): Promise<GenerateContentResult>`

Sends a message to the Gemini model.

**Parameters:**
- `chat: GenerativeModel` - Active chat session
- `message: AgentMessage` - Message to send

**Returns:** `Promise<GenerateContentResult>` - Model response with potential function calls

#### Tool Integration

The Gemini model automatically converts your tool definitions into function declarations that the model can understand and call:

```typescript
// Your tool
const weatherTool = createTool({
  description: 'Gets weather information',
  parameters: z.object({
    location: z.string(),
    units: z.enum(['celsius', 'fahrenheit'])
  }),
  run: async ({ location, units }) => {
    return `Weather in ${location}: 22°${units === 'celsius' ? 'C' : 'F'}`
  }
})

// Automatically converted to Gemini function declaration
{
  name: 'weatherTool',
  description: 'Gets weather information',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string' },
      units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
    },
    required: ['location']
  }
}
```

## Model Configuration

### Environment Variables

Set your Google AI API key:
```bash
export GOOGLE_AI_API_KEY=your_api_key_here
```

### Model Capabilities

| Model | Context Length | Tool Support | Speed | Best For |
|-------|----------------|--------------|-------|----------|
| gemini-2.5-flash | 1M tokens | ✅ | Fast | General tasks |
| gemini-2.5-pro | 2M tokens | ✅ | Medium | Complex reasoning |
| gemini-pro | 1M tokens | ✅ | Medium | Balanced performance |
| gemini-flash | 1M tokens | ✅ | Very Fast | Quick responses |

## Usage Examples

### Basic Model Usage

```typescript
import { model } from '@hgraph/agent'

const geminiModel = model('gemini-pro')

// Used internally by agents - typically you don't call this directly
const chat = geminiModel.startChat(conversationHistory, toolsMap)
const response = await geminiModel.sendMessage(chat, userMessage)
```

### Model Selection Strategy

```typescript
// For quick responses
const agent = createAgent({
  name: 'QuickBot',
  description: 'Fast responses',
  instruction: 'Provide quick, concise answers',
  model: 'gemini-flash'
})

// For complex reasoning
const agent = createAgent({
  name: 'ReasoningBot', 
  description: 'Complex problem solving',
  instruction: 'Think through problems step by step',
  model: 'gemini-2.5-pro'
})

// For balanced performance (default)
const agent = createAgent({
  name: 'Assistant',
  description: 'General purpose assistant',
  instruction: 'Help with various tasks',
  model: 'gemini' // Uses gemini-2.5-flash
})
```

## Extending the Model System

### Adding New Model Providers

To add support for other AI providers, implement the `Model` interface:

```typescript
import { Model } from '@hgraph/agent'

class OpenAIModel implements Model {
  constructor(private modelName: string) {}
  
  startChat(history: AgentMessage[], tools?: Map<string, ToolFunction<any>>) {
    // Initialize OpenAI chat session
    return openaiChat
  }
  
  async sendMessage(chat: any, message: AgentMessage) {
    // Send message to OpenAI API
    return response
  }
}

// Register in model factory
export function model(name: ModelName): Model {
  switch (name) {
    // ... existing Gemini cases
    case 'gpt-4':
      return new OpenAIModel('gpt-4')
    default:
      throw new Error(`Unsupported model: ${name}`)
  }
}
```

## Error Handling

The model system handles various error scenarios:

- **API Key Missing**: Throws clear error about missing GOOGLE_AI_API_KEY
- **Rate Limiting**: Google AI SDK handles rate limiting automatically
- **Invalid Model Names**: Factory function validates model names
- **Network Errors**: Propagated with context from the underlying SDK
- **Token Limits**: Model responses indicate when context limits are approached

## Performance Considerations

- **Model Choice**: Flash models are faster but may be less capable for complex tasks
- **Context Management**: Longer conversation histories increase latency and cost
- **Tool Usage**: Models with many tools available may be slower to respond
- **Streaming**: Use streaming responses for better user experience with long outputs

## Future Extensions

The model architecture is designed to support:

- Multiple AI providers (OpenAI, Anthropic, etc.)
- Custom model configurations
- Model-specific optimizations
- Advanced features like vision, audio, etc.
- Local model support