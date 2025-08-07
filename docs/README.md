# @hgraph/agent Documentation

Welcome to the comprehensive documentation for `@hgraph/agent` - a powerful AI agent framework with tool support.

## Quick Navigation

### Core Concepts
- **[Agent Module](./agent.md)** - Creating and managing AI agents
- **[Tools Module](./tools.md)** - Building custom tools and using built-in ones
- **[Models Module](./models.md)** - AI model integration and configuration
- **[Messages Module](./messages.md)** - Message handling and conversation management

## Getting Started

1. **Installation**: `npm install @hgraph/agent`
2. **Setup**: Configure your Google AI API key
3. **Create Agent**: Use `createAgent()` to build your first agent
4. **Add Tools**: Extend capabilities with `createTool()` or built-in tools
5. **Start Conversing**: Use `.run()` or `.runWithStream()` for interactions

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Agent       │───▶│     Model       │───▶│   Google AI     │
│                 │    │   (Gemini)      │    │     API         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Tools       │───▶│    Messages     │───▶│  Conversation   │
│   (Custom &     │    │   (Threads)     │    │    History      │
│   Built-in)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Features

### 🤖 **Intelligent Agents**
- Custom instructions and personalities
- Context-aware conversations
- Multi-turn dialogue support
- Streaming responses

### 🛠️ **Extensible Tools**
- Type-safe tool creation with Zod validation
- Built-in file system, git, and system tools
- Custom tool development
- Streaming tool execution

### 📝 **Message Management**
- Thread-based conversations
- Tool call correlation
- Message utilities and helpers
- Error handling and validation

### 🎯 **Model Integration**
- Multiple Gemini model variants
- Automatic function calling
- Context management
- Performance optimization

## Built-in Tool Categories

### File System Tools
- `readFile` - Read file contents
- `writeFile` - Write to files
- `listDirectory` - Directory listings
- `createDirectory` - Create directories
- `deleteFile` - Remove files/directories
- `copyFile` - Copy files/directories
- `moveFile` - Move/rename files
- `findFiles` - Search for files

### Git Tools
- `gitStatus` - Repository status
- `gitAdd` - Stage files
- `gitCommit` - Create commits
- `gitDiff` - Show differences
- `gitLog` - Commit history
- `gitBranch` - Branch management
- `gitPull` - Fetch from remote
- `gitPush` - Push to remote

### System Tools
- `executeCommand` - Run shell commands
- `getCurrentDirectory` - Get working directory
- `getEnvironmentVariable` - Access env vars
- `checkFileExists` - Check file existence
- `getFileInfo` - File/directory information

## Common Use Cases

### Code Assistant
```typescript
import { createAgent, readFile, writeFile, gitStatus } from '@hgraph/agent'

const codeAssistant = createAgent({
  name: 'CodeHelper',
  description: 'AI coding assistant',
  instruction: 'Help with coding tasks, reviews, and git operations',
  model: 'gemini-pro'
})

codeAssistant.addTools({ readFile, writeFile, gitStatus })
```

### File Manager
```typescript
import { createAgent, listDirectory, createDirectory, moveFile } from '@hgraph/agent'

const fileManager = createAgent({
  name: 'FileManager',
  description: 'File system management assistant',
  instruction: 'Help organize and manage files and directories',
  model: 'gemini-flash'
})

fileManager.addTools({ listDirectory, createDirectory, moveFile })
```

### DevOps Assistant
```typescript
import { createAgent, executeCommand, getEnvironmentVariable } from '@hgraph/agent'

const devopsBot = createAgent({
  name: 'DevOpsBot',
  description: 'DevOps automation assistant', 
  instruction: 'Help with deployments, monitoring, and system operations',
  model: 'gemini-2.5-pro'
})

devopsBot.addTools({ executeCommand, getEnvironmentVariable })
```

## Best Practices

### Agent Design
- Use clear, specific instructions
- Choose appropriate models for your use case
- Provide helpful agent names and descriptions
- Test with various inputs and edge cases

### Tool Development
- Write comprehensive descriptions
- Use detailed Zod schemas for parameters
- Handle errors gracefully
- Include helpful error messages
- Test tool functions independently

### Message Management
- Use consistent thread IDs for conversations
- Leverage utility functions like `createUserMessage`
- Handle streaming messages appropriately
- Implement proper error handling

### Performance
- Choose fast models (Flash variants) for simple tasks
- Use Pro models for complex reasoning
- Manage conversation history length
- Consider tool execution timeouts

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Ensure `GOOGLE_AI_API_KEY` environment variable is set
   - Check API key has proper permissions

2. **Tool Execution Errors**
   - Validate tool parameters with schemas
   - Check file paths and permissions
   - Handle async operations properly

3. **Model Responses**
   - Verify model name is supported
   - Check for rate limiting
   - Monitor token usage

4. **Streaming Issues**
   - Handle async generators correctly
   - Check for proper error propagation
   - Implement timeout handling

### Getting Help

- Check the individual module documentation
- Review example code in the main README
- Ensure all dependencies are properly installed
- Verify TypeScript configuration if using TypeScript

## Contributing

We welcome contributions! Please see the main repository for:
- Issue reporting
- Feature requests  
- Pull request guidelines
- Development setup

## Version History

- **v1.0.0** - Initial release with core agent, tools, models, and messages modules