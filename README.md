# @hgraph/agent

A powerful AI agent framework with tool support, built on top of Google's Gemini AI models.

## Features

- 🤖 **AI Agent Creation**: Create intelligent agents with custom instructions and behaviors
- 🛠️ **Tool System**: Extensible tool system for agent capabilities
- 📝 **Message Handling**: Comprehensive message and conversation management
- 🔄 **Streaming Support**: Both synchronous and streaming responses
- 🧩 **TypeScript**: Full TypeScript support with type safety
- 🎯 **Gemini Integration**: Built-in support for various Gemini models

## Installation

```bash
npm install @hgraph/agent
```

## Quick Start

### Creating an Agent

```typescript
import { createAgent, createUserMessage } from '@hgraph/agent'

const agent = createAgent({
  name: 'MyAgent',
  description: 'A helpful AI assistant',
  instruction: 'You are a helpful assistant that provides clear and concise answers.',
  model: 'gemini'
})

// Simple conversation
const messages = [
  createUserMessage('Hello, how are you?', 'thread-1')
]

const responses = await agent.run(messages)
console.log(responses[0].content)
```

### Creating Custom Tools

```typescript
import { createTool } from '@hgraph/agent'
import { z } from 'zod'

const calculateTool = createTool({
  description: 'Performs basic mathematical calculations',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number()
  }),
  run: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return String(a + b)
      case 'subtract': return String(a - b)
      case 'multiply': return String(a * b)
      case 'divide': return String(a / b)
      default: throw new Error('Unknown operation')
    }
  }
})

// Add tool to agent
agent.addTool('calculate', calculateTool)
```

### Using Built-in Tools

```typescript
import { 
  readFile, writeFile, listDirectory,
  executeCommand, getCurrentDirectory
} from '@hgraph/agent'

// Add various tools
agent.addTools({
  // File system tools
  readFile,
  writeFile,
  listDirectory,
  
  // System tools (includes git operations)
  executeCommand,
  getCurrentDirectory
})

// Now the agent can perform various operations including git
const messages = [
  createUserMessage('Please run "git status" and read the README file', 'thread-1')
]

const responses = await agent.run(messages)
```

### Streaming Responses

```typescript
// Get streaming responses
for await (const message of agent.runWithStream(messages)) {
  console.log(`[${message.type}] ${message.content}`)
}
```

## API Reference

### `createAgent(config: AgentConfig): Agent`

Creates a new AI agent instance.

**AgentConfig:**
- `name: string` - Name of the agent
- `description: string` - Description of the agent's purpose
- `instruction: string` - System instruction for the agent
- `model: ModelName` - AI model to use (see supported models below)

### `createTool<T>(tool: ToolFunction<T>): ToolFunction<T>`

Creates a new tool that can be added to an agent.

**ToolFunction:**
- `description: string` - Description of what the tool does
- `parameters: ZodSchema` - Zod schema for tool parameters
- `run: (args) => Promise<string>` - Tool execution function
- `runWithStream: (args) => AsyncGenerator<AgentMessage>` - Optional streaming execution

### Agent Methods

#### `agent.addTool(name: string, tool: ToolFunction): void`
Adds a single tool to the agent.

#### `agent.addTools(tools: Record<string, ToolFunction>): void`
Adds multiple tools to the agent.

#### `agent.run(messages: AgentMessage[], options?: { maxTurns?: number }): Promise<AgentMessage[]>`
Runs the agent with the given messages and returns responses.

#### `agent.runWithStream(messages: AgentMessage[], options?: { maxTurns?: number }): AsyncGenerator<AgentMessage>`
Runs the agent with streaming responses.

## Supported Models

The following Gemini models are supported:

- `'gemini'` - Default Gemini model (uses Gemini 2.5 Flash)
- `'gemini-pro'` - Gemini Pro
- `'gemini-1.5-pro'` - Gemini 1.5 Pro
- `'gemini-flash'` - Gemini Flash
- `'gemini-2.5-pro'` - Gemini 2.5 Pro
- `'gemini-2.5-flash'` - Gemini 2.5 Flash
- `'gemini-2.0-flash'` - Gemini 2.0 Flash

## Built-in Tools

### File System Tools

```typescript
import { readFile, writeFile, listDirectory } from '@hgraph/agent'
```

- **readFile**: Reads file contents
- **writeFile**: Writes content to a file
- **listDirectory**: Lists directory contents

### System Tools

```typescript
import { executeCommand, getCurrentDirectory, getEnvironmentVariable, createDirectory, deleteFile, copyFile, moveFile, findFiles } from '@hgraph/agent'
```

- **executeCommand**: Executes system commands (including git, npm, etc.)
- **getCurrentDirectory**: Gets current working directory
- **getEnvironmentVariable**: Retrieves environment variables
- **createDirectory**: Creates directories
- **deleteFile**: Deletes files or directories
- **copyFile**: Copies files or directories
- **moveFile**: Moves or renames files
- **findFiles**: Finds files matching patterns

#### Git Operations via executeCommand
```typescript
// Git operations can be performed using executeCommand
const messages = [
  createUserMessage('Run "git status" to check repository status', 'thread-1'),
  createUserMessage('Execute "git add ." and "git commit -m "Update files""', 'thread-1'),
  createUserMessage('Run "git push origin main" to push changes', 'thread-1')
]
```

## Message Types

### AgentMessage

```typescript
interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  threadId: string
  tool_call_id?: string // For tool responses
}
```

### Message Types (Streaming)

- `'log'` - Informational messages
- `'error'` - Error messages
- `'warn'` - Warning messages
- `'completed'` - Task completion
- `'final_response'` - Final agent response

## Environment Setup

Make sure you have your Google AI API key set up:

```bash
export GOOGLE_AI_API_KEY=your_api_key_here
```

## Documentation

For detailed documentation on each module, see the [docs](./docs) directory:

- **[Agent Module](./docs/agent.md)** - Comprehensive guide to creating and managing agents
- **[Tools Module](./docs/tools.md)** - Creating custom tools and using built-in tools
- **[Models Module](./docs/models.md)** - Model integration and configuration
- **[Messages Module](./docs/messages.md)** - Message handling, threading, and utilities

## Examples

### Advanced Agent with Multiple Tools

```typescript
import { createAgent, createTool, readFile, writeFile } from '@hgraph/agent'
import { z } from 'zod'

// Create a code review agent
const codeReviewAgent = createAgent({
  name: 'CodeReviewer',
  description: 'An AI agent that reviews code for best practices',
  instruction: `You are an expert code reviewer. Analyze code files for:
  - Best practices
  - Potential bugs
  - Performance issues
  - Security concerns
  Provide constructive feedback and suggestions.`,
  model: 'gemini-pro'
})

// Add file tools
codeReviewAgent.addTools({
  readFile,
  writeFile
})

// Add custom analysis tool
const analyzeCode = createTool({
  description: 'Analyzes code and provides detailed feedback',
  parameters: z.object({
    code: z.string(),
    language: z.string(),
    focusAreas: z.array(z.string()).optional()
  }),
  run: async ({ code, language, focusAreas = [] }) => {
    // Your custom analysis logic here
    return `Analysis complete for ${language} code focusing on: ${focusAreas.join(', ')}`
  }
})

codeReviewAgent.addTool('analyzeCode', analyzeCode)

// Use the agent
const messages = [
  createUserMessage(
    'Please review the TypeScript file at /src/components/Button.tsx',
    'review-session-1'
  )
]

for await (const message of codeReviewAgent.runWithStream(messages)) {
  console.log(`[${message.type}] ${message.content}`)
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT