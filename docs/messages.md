# Messages Module

The Messages module handles all communication between users, agents, and tools, providing a comprehensive message system with type safety and utility functions.

## Types

### AgentMessage

The core message interface used throughout the agent system.

```typescript
interface AgentMessage {
  id: string                    // Unique message identifier
  role: 'user' | 'assistant' | 'tool'  // Message sender role
  content: string              // Message content/text
  threadId: string            // Thread/conversation identifier
  tool_call_id?: string       // Tool call identifier (for tool responses)
}
```

**Properties:**
- `id`: Unique identifier for message tracking and correlation
- `role`: Indicates who sent the message (user, assistant, or tool)
- `content`: The actual message text or response
- `threadId`: Groups related messages in a conversation thread
- `tool_call_id`: Present on tool response messages to link back to the tool call

### ToolCall

Represents a request to execute a tool.

```typescript
interface ToolCall {
  id: string                   // Unique call identifier
  name: string                // Tool name to execute
  arguments: Record<string, any>  // Tool parameters
  threadId: string            // Thread identifier
}
```

**Properties:**
- `id`: Unique identifier for the tool call
- `name`: Name of the tool to execute (must match registered tool)
- `arguments`: Parameters to pass to the tool (validated against tool schema)
- `threadId`: Thread context for the tool call

### StreamingMessageType

Types for streaming message events.

```typescript
type StreamingMessageType = 
  | 'log'              // Informational messages
  | 'error'            // Error messages  
  | 'warn'             // Warning messages
  | 'completed'        // Task completion notifications
  | 'final_response'   // Final agent response
```

### StreamingMessage

Extended message type for streaming responses.

```typescript
interface StreamingMessage extends Omit<AgentMessage, 'role'> {
  type: StreamingMessageType   // Message type for streaming
  role?: never                // Role not used in streaming
}
```

## Utility Functions

### `createAssistantMessage(type: StreamingMessageType, content: string, threadId: string): StreamingMessage`

Creates a streaming message from the assistant.

**Parameters:**
- `type: StreamingMessageType` - Type of streaming message
- `content: string` - Message content
- `threadId: string` - Thread identifier

**Returns:** `StreamingMessage` - Formatted streaming message

**Example:**
```typescript
import { createAssistantMessage } from '@hgraph/agent'

// Log message
const logMsg = createAssistantMessage('log', 'Processing request...', 'thread-1')

// Error message
const errorMsg = createAssistantMessage('error', 'Tool execution failed', 'thread-1')

// Final response
const responseMsg = createAssistantMessage('final_response', 'Task completed!', 'thread-1')
```

### `createToolMessage(toolCallId: string, content: string, threadId: string): AgentMessage`

Creates a tool response message.

**Parameters:**
- `toolCallId: string` - ID of the tool call being responded to
- `content: string` - Tool execution result
- `threadId: string` - Thread identifier

**Returns:** `AgentMessage` - Formatted tool response message

**Example:**
```typescript
import { createToolMessage } from '@hgraph/agent'

const toolResponse = createToolMessage(
  'call_12345',
  'File read successfully: content here...',
  'thread-1'
)
```

### `generateId(): string`

Generates a unique identifier for messages and tool calls.

**Returns:** `string` - Unique identifier using nanoid

**Example:**
```typescript
import { generateId } from '@hgraph/agent'

const messageId = generateId()  // "V1StGXR8_Z5jdHi6B-myT"
```

## Message Flow Patterns

### Basic Conversation

```typescript
// User message
const userMessage: AgentMessage = {
  id: generateId(),
  role: 'user',
  content: 'What is the weather like?',
  threadId: 'conversation-1'
}

// Assistant response
const assistantMessage: AgentMessage = {
  id: generateId(),
  role: 'assistant', 
  content: 'I need to check the weather for you.',
  threadId: 'conversation-1'
}
```

### Tool Execution Flow

```typescript
// 1. Assistant decides to use a tool (internal to agent)
const toolCall: ToolCall = {
  id: 'call_weather_123',
  name: 'getWeather',
  arguments: { location: 'New York' },
  threadId: 'conversation-1'
}

// 2. Tool execution result
const toolResponse: AgentMessage = {
  id: generateId(),
  role: 'tool',
  content: 'Weather in New York: 72°F, sunny',
  threadId: 'conversation-1',
  tool_call_id: 'call_weather_123'
}

// 3. Final assistant response
const finalResponse: AgentMessage = {
  id: generateId(),
  role: 'assistant',
  content: 'The weather in New York is 72°F and sunny!',
  threadId: 'conversation-1'
}
```

### Streaming Message Flow

```typescript
// During agent execution, streaming messages are emitted:

for await (const message of agent.runWithStream(messages)) {
  switch (message.type) {
    case 'log':
      console.log(`🔍 ${message.content}`)
      break
    case 'error':
      console.error(`❌ ${message.content}`)
      break
    case 'final_response':
      console.log(`✅ ${message.content}`)
      break
  }
}
```

## Threading System

### Thread Management

Threads group related messages and maintain conversation context:

```typescript
// All messages in a conversation share the same threadId
const threadId = generateId()

const messages: AgentMessage[] = [
  {
    id: generateId(),
    role: 'user',
    content: 'Hello',
    threadId
  },
  {
    id: generateId(),
    role: 'assistant', 
    content: 'Hi there!',
    threadId
  },
  {
    id: generateId(),
    role: 'user',
    content: 'How are you?',
    threadId
  }
]
```

### Multi-Threading

Different conversations can run simultaneously:

```typescript
const thread1 = generateId()
const thread2 = generateId()

// Conversation 1: Weather discussion
const weatherMessages = [
  { id: generateId(), role: 'user', content: 'Weather?', threadId: thread1 }
]

// Conversation 2: Math problem
const mathMessages = [
  { id: generateId(), role: 'user', content: '2+2=?', threadId: thread2 }
]

// These can be processed independently
```

## Message Validation

### Input Validation

```typescript
function validateMessage(message: AgentMessage): boolean {
  return (
    typeof message.id === 'string' &&
    ['user', 'assistant', 'tool'].includes(message.role) &&
    typeof message.content === 'string' &&
    typeof message.threadId === 'string'
  )
}
```

### Content Sanitization

```typescript
function sanitizeContent(content: string): string {
  // Remove potentially harmful content
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim()
}
```

## Error Handling

### Error Message Creation

```typescript
function createErrorMessage(error: Error, threadId: string): StreamingMessage {
  return createAssistantMessage(
    'error',
    `Error: ${error.message}`,
    threadId
  )
}
```

### Tool Error Handling

```typescript
// When a tool fails, create appropriate error response
try {
  const result = await tool.run(arguments)
  return createToolMessage(toolCallId, result, threadId)
} catch (error) {
  return createToolMessage(
    toolCallId, 
    `Tool error: ${error.message}`,
    threadId
  )
}
```

## Best Practices

### Message IDs

- Always use `generateId()` for consistent ID generation
- Never reuse message IDs within the same system
- Include timestamp information if needed for debugging

### Content Guidelines

- Keep message content focused and clear
- Use appropriate message types for streaming
- Sanitize user input when necessary
- Provide meaningful error messages

### Thread Management

- Use consistent threadId for related messages
- Create new threads for independent conversations  
- Clean up old threads to manage memory

### Tool Integration

- Always link tool responses to their calls via `tool_call_id`
- Handle tool errors gracefully with clear messages
- Validate tool arguments before execution

## Advanced Usage

### Message Filtering

```typescript
function getMessagesByType(
  messages: AgentMessage[], 
  role: AgentMessage['role']
): AgentMessage[] {
  return messages.filter(msg => msg.role === role)
}

// Get all user messages
const userMessages = getMessagesByType(conversationHistory, 'user')
```

### Conversation Statistics

```typescript
function analyzeConversation(messages: AgentMessage[]) {
  const stats = {
    totalMessages: messages.length,
    userMessages: messages.filter(m => m.role === 'user').length,
    assistantMessages: messages.filter(m => m.role === 'assistant').length,
    toolCalls: messages.filter(m => m.role === 'tool').length
  }
  return stats
}
```

### Message History Management

```typescript
function trimConversationHistory(
  messages: AgentMessage[], 
  maxMessages: number = 100
): AgentMessage[] {
  if (messages.length <= maxMessages) return messages
  
  // Keep system messages and recent messages
  const systemMessages = messages.filter(m => m.content.startsWith('You are'))
  const recentMessages = messages.slice(-maxMessages + systemMessages.length)
  
  return [...systemMessages, ...recentMessages]
}
```