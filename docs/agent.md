# Agent Module

The Agent module provides the core functionality for creating and managing AI agents with tool support.

## Classes

### Agent

The main agent class that handles AI interactions, tool management, and conversation history.

#### Constructor

```typescript
constructor(config: AgentConfig)
```

Creates a new agent instance with the specified configuration.

**Parameters:**
- `config: AgentConfig` - Agent configuration object

#### Properties

- `description: string` - Get the agent's description
- `name: string` - Get the agent's name

#### Methods

##### `addTool(name: string, toolFunction: ToolFunction<any>): void`

Adds a single tool to the agent's toolkit.

**Parameters:**
- `name: string` - Name of the tool
- `toolFunction: ToolFunction<any>` - Tool function implementation

**Example:**
```typescript
const myTool = createTool({
  description: 'Example tool',
  parameters: z.object({ input: z.string() }),
  run: async ({ input }) => `Processed: ${input}`
})

agent.addTool('example', myTool)
```

##### `addTools(tools: Record<string, ToolFunction<any>>): void`

Adds multiple tools to the agent at once.

**Parameters:**
- `tools: Record<string, ToolFunction<any>>` - Object mapping tool names to tool functions

**Example:**
```typescript
agent.addTools({
  readFile,
  writeFile,
  calculate: calculatorTool
})
```

##### `run(messages: AgentMessage[], options?: { maxTurns?: number }): Promise<AgentMessage[]>`

Executes the agent with the provided messages and returns all responses.

**Parameters:**
- `messages: AgentMessage[]` - Array of conversation messages
- `options.maxTurns?: number` - Maximum number of conversation turns (default: 150)

**Returns:** `Promise<AgentMessage[]>` - Array of response messages

**Example:**
```typescript
const messages = [{
  id: '1',
  role: 'user',
  content: 'Hello!',
  threadId: 'thread-1'
}]

const responses = await agent.run(messages)
console.log(responses[0].content)
```

##### `runWithStream(messages: AgentMessage[], options?: { maxTurns?: number }): AsyncGenerator<AgentMessage, AgentMessage[], unknown>`

Executes the agent with streaming responses for real-time interaction.

**Parameters:**
- `messages: AgentMessage[]` - Array of conversation messages  
- `options.maxTurns?: number` - Maximum number of conversation turns (default: 150)

**Returns:** `AsyncGenerator<AgentMessage, AgentMessage[], unknown>` - Stream of messages

**Example:**
```typescript
for await (const message of agent.runWithStream(messages)) {
  console.log(`[${message.type}] ${message.content}`)
}
```

## Functions

### `createAgent(config: AgentConfig): Agent`

Factory function to create a new Agent instance.

**Parameters:**
- `config: AgentConfig` - Agent configuration

**Returns:** `Agent` - New agent instance

**Example:**
```typescript
// Using environment variables for API key
const agent = createAgent({
  name: 'Assistant',
  description: 'Helpful AI assistant',
  instruction: 'You are a helpful assistant.',
  model: 'gemini'
})

// Using custom API key
const agentWithApiKey = createAgent({
  name: 'Assistant',
  description: 'Helpful AI assistant',
  instruction: 'You are a helpful assistant.',
  model: 'gemini',
  apiKey: 'your-gemini-api-key'
})
```

## Types

### AgentConfig

Configuration interface for creating agents.

```typescript
interface AgentConfig {
  name: string          // Agent name
  description: string   // Agent description
  instruction: string   // System instruction/prompt
  model: ModelName     // AI model to use
  apiKey?: string      // Optional API key for the model (overrides environment variables)
}
```

### AgentState

Interface representing the internal state of an agent.

```typescript
interface AgentState {
  conversationHistory: AgentMessage[]  // All conversation messages
  timestamp: string                   // State timestamp
  modelName: string                   // Current model name
  metadata?: Record<string, any>      // Optional metadata
}
```

## Internal Methods

The following methods are internal to the Agent class:

- `ensureInstruction()` - Ensures system instruction is included in messages
- `executeToolCall()` - Executes individual tool calls with error handling

## Error Handling

The Agent class provides comprehensive error handling:

- Tool execution errors are caught and returned as error messages
- Invalid tool arguments are validated using Zod schemas
- Model errors are propagated with context
- Maximum turn limits prevent infinite loops

## API Key Configuration

Agents support flexible API key configuration with the following priority order:

1. **AgentConfig.apiKey** - API key provided directly in the agent configuration
2. **GOOGLE_AI_API_KEY** - Google AI Studio API key environment variable
3. **GEMINI_API_KEY** - Gemini API key environment variable
4. **GEMINI_KEY** - Alternative Gemini API key environment variable

**Environment Variables:**
```bash
# Option 1: Google AI Studio format
export GOOGLE_AI_API_KEY=your-api-key-here

# Option 2: Gemini format
export GEMINI_API_KEY=your-api-key-here

# Option 3: Alternative format
export GEMINI_KEY=your-api-key-here
```

**Programmatic Configuration:**
```typescript
const agent = createAgent({
  name: 'Assistant',
  description: 'Helpful AI assistant',
  instruction: 'You are a helpful assistant.',
  model: 'gemini-2.5-flash',
  apiKey: 'your-api-key-here' // Overrides all environment variables
})
```

## Threading

Each agent run creates a unique thread ID that tracks the conversation context. This allows for:

- Message correlation
- Tool call tracking
- Response streaming
- Error context preservation