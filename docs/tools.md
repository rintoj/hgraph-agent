# Tools Module

The Tools module provides the framework for creating and managing agent tools, including built-in file system tools.

## Core Functions

### `createTool<T>(tool: ToolFunction<T>): ToolFunction<T>`

Factory function to create a new tool with proper type safety and validation.

**Parameters:**
- `tool: ToolFunction<T>` - Tool function definition

**Returns:** `ToolFunction<T>` - Validated tool function

**Example:**
```typescript
import { createTool } from '@hgraph/agent'
import { z } from 'zod'

const weatherTool = createTool({
  description: 'Gets current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name or coordinates'),
    units: z.enum(['celsius', 'fahrenheit']).optional()
  }),
  run: async ({ location, units = 'celsius' }) => {
    // Implementation
    return `Weather in ${location}: 25°${units === 'celsius' ? 'C' : 'F'}`
  }
})
```

## Types

### ToolFunction<T>

Base interface for all tool functions.

```typescript
type ToolFunction<T extends z.ZodSchema = z.ZodSchema> = {
  description: string  // Human-readable description
  parameters: T       // Zod schema for parameters
} & (
  | { run: (args: z.infer<T>) => Promise<string>; runWithStream?: never }
  | { runWithStream: (args: z.infer<T>) => AsyncGenerator<AgentMessage, string, unknown>; run?: never }
)
```

**Properties:**
- `description: string` - Clear description of what the tool does
- `parameters: T` - Zod schema defining expected parameters
- `run: Function` - Synchronous execution function (returns Promise<string>)
- `runWithStream: Function` - Streaming execution function (returns AsyncGenerator)

**Note:** Tools must implement either `run` or `runWithStream`, but not both.

## Built-in File System Tools

### `readFile`

Reads and returns the complete text content of a file.

**Parameters:**
```typescript
{
  filePath: string  // Absolute path to file
}
```

**Example:**
```typescript
import { readFile } from '@hgraph/agent'

agent.addTool('readFile', readFile)

// Usage in conversation:
// "Please read the contents of /path/to/file.txt"
```

### `writeFile`

Writes text content to a file, creating or overwriting as needed.

**Parameters:**
```typescript
{
  filePath: string  // Absolute path to file
  content: string   // Text content to write
}
```

**Example:**
```typescript
import { writeFile } from '@hgraph/agent'

agent.addTool('writeFile', writeFile)

// Usage in conversation:
// "Please write 'Hello World' to /tmp/greeting.txt"
```

### `listDirectory`

Lists all files and subdirectories in a given directory.

**Parameters:**
```typescript
{
  directoryPath: string  // Absolute path to directory
}
```

**Example:**
```typescript
import { listDirectory } from '@hgraph/agent'

agent.addTool('listDirectory', listDirectory)

// Usage in conversation:
// "List all files in /home/user/documents"
```

## Creating Custom Tools

### Simple Tool Example

```typescript
const uppercaseTool = createTool({
  description: 'Converts text to uppercase',
  parameters: z.object({
    text: z.string().describe('Text to convert')
  }),
  run: async ({ text }) => {
    return text.toUpperCase()
  }
})
```

### Streaming Tool Example

```typescript
const countdownTool = createTool({
  description: 'Counts down from a number',
  parameters: z.object({
    start: z.number().min(1).max(10)
  }),
  runWithStream: async function* ({ start }) {
    for (let i = start; i >= 0; i--) {
      yield createAssistantMessage('log', `${i}`, 'countdown-thread')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    return 'Countdown complete!'
  }
})
```

### Advanced Tool with Validation

```typescript
const databaseQueryTool = createTool({
  description: 'Executes a safe database query',
  parameters: z.object({
    query: z.string()
      .refine(q => q.toLowerCase().startsWith('select'), 'Only SELECT queries allowed')
      .describe('SQL SELECT query to execute'),
    limit: z.number().min(1).max(100).default(10).describe('Maximum rows to return')
  }),
  run: async ({ query, limit }) => {
    // Validate query is safe
    if (!/^select\s+/i.test(query.trim())) {
      throw new Error('Only SELECT queries are allowed')
    }
    
    // Execute query (implementation specific)
    const results = await executeQuery(query, { limit })
    return JSON.stringify(results, null, 2)
  }
})
```

## Tool Best Practices

### 1. Clear Descriptions
```typescript
// Good
description: 'Calculates the area of a rectangle given width and height in meters'

// Bad
description: 'Does math'
```

### 2. Comprehensive Parameter Schemas
```typescript
parameters: z.object({
  width: z.number()
    .min(0.01, 'Width must be positive')
    .describe('Rectangle width in meters'),
  height: z.number()
    .min(0.01, 'Height must be positive') 
    .describe('Rectangle height in meters'),
  precision: z.number()
    .int()
    .min(0)
    .max(10)
    .default(2)
    .describe('Decimal places for result')
})
```

### 3. Error Handling
```typescript
run: async ({ filePath }) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`)
    }
    throw new Error(`Failed to read file: ${error.message}`)
  }
}
```

### 4. Input Validation
```typescript
run: async ({ email }) => {
  if (!email.includes('@')) {
    throw new Error('Invalid email format')
  }
  // Process email
}
```

## Tool Integration

### Adding Multiple Tools
```typescript
import { readFile, writeFile, listDirectory } from '@hgraph/agent'

// Add all at once
agent.addTools({
  readFile,
  writeFile,
  listDirectory,
  customTool: myCustomTool
})

// Or add individually
agent.addTool('readFile', readFile)
agent.addTool('writeFile', writeFile)
```

### Tool Composition
```typescript
// Create a higher-level tool that uses multiple operations
const analyzeProjectTool = createTool({
  description: 'Analyzes a project directory structure and files',
  parameters: z.object({
    projectPath: z.string().describe('Path to project directory')
  }),
  run: async ({ projectPath }) => {
    // This tool would internally coordinate multiple file operations
    const structure = await listDirectory({ directoryPath: projectPath })
    // ... additional analysis logic
    return analysisResult
  }
})
```

## Runtime Behavior

- Tools are executed in isolation with parameter validation
- Zod schema validation occurs before tool execution
- Tools can throw errors which are caught and returned as error messages
- Streaming tools yield messages incrementally
- Tool execution timeouts can be implemented in the tool itself