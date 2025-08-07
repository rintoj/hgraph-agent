# System Tools

System tools provide comprehensive access to system information, process management, environment variables, and command execution capabilities.

## Available Tools

### `executeCommand`

Executes system commands and returns their output.

**Description:** Runs shell commands with full control over working directory, timeout, and error handling.

**Parameters:**
- `command` (string, required): Command to execute
- `workingDirectory` (string, optional): Working directory for command execution
- `timeout` (number, optional, default: 30000): Timeout in milliseconds (max 300000)

**Returns:** Command output as string

**Example:**
```typescript
import { createAgent, executeCommand } from '@hgraph/agent'

const agent = createAgent({
  name: 'SystemManager',
  description: 'Executes system commands',
  instruction: 'Execute system commands safely',
  model: 'gemini'
})

agent.addTool('executeCommand', executeCommand)

// Usage in conversation:
// "Run 'ls -la' to list files"
// "Execute 'git status' in the project directory"
// "Run 'npm install' with a 5 minute timeout"
```

**Security Notes:**
- Commands run with current user permissions
- Shell injection protection through proper argument handling
- Timeout protection prevents hung processes

---

### `getCurrentDirectory`

Gets the current working directory path.

**Description:** Returns the absolute path of the current working directory.

**Parameters:** None

**Returns:** Current working directory path as string

**Example:**
```typescript
agent.addTool('getCurrentDirectory', getCurrentDirectory)

// Usage: "What's the current directory?"
// Returns: "/Users/username/projects/myapp"
```

---

### `getCurrentUser`

Gets detailed information about the current system user.

**Description:** Retrieves comprehensive user information including username, user ID, group ID, home directory, and shell.

**Parameters:** None

**Returns:** JSON object with user information

**Example:**
```typescript
agent.addTool('getCurrentUser', getCurrentUser)

// Usage: "Show me information about the current user"
```

**Sample Output:**
```json
{
  "username": "john",
  "uid": 1001,
  "gid": 1001,
  "homedir": "/Users/john",
  "shell": "/bin/zsh"
}
```

---

### `getHomeDirectory`

Gets the current user's home directory path.

**Description:** Returns the absolute path to the user's home directory.

**Parameters:** None

**Returns:** Home directory path as string

**Example:**
```typescript
agent.addTool('getHomeDirectory', getHomeDirectory)

// Usage: "What's my home directory?"
// Returns: "/Users/username"
```

---

### `getTempDirectory`

Gets the system temporary directory path.

**Description:** Returns the system's temporary directory path where temporary files can be safely created.

**Parameters:** None

**Returns:** Temporary directory path as string

**Example:**
```typescript
agent.addTool('getTempDirectory', getTempDirectory)

// Usage: "Where should I create temporary files?"
// Returns: "/tmp" (Unix) or "C:\\Users\\username\\AppData\\Local\\Temp" (Windows)
```

---

### `getSystemInfo`

Gets comprehensive system information.

**Description:** Provides detailed information about the system including platform, architecture, memory, CPU, and more.

**Parameters:** None

**Returns:** JSON object with system information

**Example:**
```typescript
agent.addTool('getSystemInfo', getSystemInfo)

// Usage: "Show me system information"
```

**Sample Output:**
```json
{
  "platform": "darwin",
  "architecture": "arm64", 
  "release": "23.1.0",
  "hostname": "MacBook-Pro",
  "uptime": 86400,
  "totalMemory": 17179869184,
  "freeMemory": 2147483648,
  "cpuCount": 8,
  "homeDirectory": "/Users/username",
  "tempDirectory": "/tmp",
  "currentUser": "username"
}
```

---

### `getProcessInfo`

Gets information about the current Node.js process.

**Description:** Returns detailed information about the running Node.js process including PID, memory usage, and runtime details.

**Parameters:** None

**Returns:** JSON object with process information

**Example:**
```typescript
agent.addTool('getProcessInfo', getProcessInfo)

// Usage: "Show me process information"
```

**Sample Output:**
```json
{
  "pid": 12345,
  "version": "v20.9.0",
  "platform": "darwin",
  "arch": "arm64",
  "memoryUsage": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "uptime": 120.5,
  "cwd": "/Users/username/projects/myapp",
  "execPath": "/usr/local/bin/node"
}
```

---

### `getEnvironmentVariable`

Gets the value of a specific environment variable.

**Description:** Retrieves the value of an environment variable by name, with optional default value.

**Parameters:**
- `variableName` (string, required): Name of the environment variable
- `defaultValue` (string, optional): Default value if variable is not set

**Returns:** Environment variable value as string

**Example:**
```typescript
agent.addTool('getEnvironmentVariable', getEnvironmentVariable)

// Usage: "What's the value of NODE_ENV?"
// Usage: "Get the PATH environment variable"
```

---

### `listEnvironmentVariables`

Lists environment variables with optional filtering.

**Description:** Lists all environment variables or filters them by pattern, with option to show or hide values.

**Parameters:**
- `pattern` (string, optional): Regex pattern to filter variable names
- `showValues` (boolean, optional, default: false): Whether to show values or just names

**Returns:** Newline-separated list of environment variables

**Example:**
```typescript
agent.addTool('listEnvironmentVariables', listEnvironmentVariables)

// Usage: "List all environment variables starting with NODE"
// Usage: "Show all environment variables with their values"
```

**Sample Usage:**
```javascript
// List all NODE_* variables with values
listEnvironmentVariables({ pattern: "NODE", showValues: true })

// List all variable names only
listEnvironmentVariables({ showValues: false })
```

---

### `setEnvironmentVariable`

Sets an environment variable for the current process.

**Description:** Sets an environment variable that will be available to the current process and any child processes it spawns.

**Parameters:**
- `name` (string, required): Name of the environment variable
- `value` (string, required): Value to set

**Returns:** Success confirmation message

**Example:**
```typescript
agent.addTool('setEnvironmentVariable', setEnvironmentVariable)

// Usage: "Set DEBUG environment variable to 'true'"
```

**Note:** This only affects the current process and its children, not the system globally.

---

### File Operation Tools

The system module also includes several file operation tools:

### `createDirectory`

Creates directories with optional recursive creation.

**Parameters:**
- `path` (string, required): Directory path to create
- `recursive` (boolean, optional, default: true): Create parent directories if needed

### `deleteFile`

Deletes files or directories.

**Parameters:**
- `path` (string, required): Path to delete
- `recursive` (boolean, optional, default: false): Delete directories recursively
- `force` (boolean, optional, default: false): Force deletion without prompts

### `copyFile`

Copies files or directories.

**Parameters:**
- `source` (string, required): Source path
- `destination` (string, required): Destination path
- `recursive` (boolean, optional, default: false): Copy directories recursively
- `preserveAttributes` (boolean, optional, default: false): Preserve file attributes

### `moveFile`

Moves or renames files and directories.

**Parameters:**
- `source` (string, required): Source path
- `destination` (string, required): Destination path

### `checkFileExists`

Checks if a file or directory exists.

**Parameters:**
- `path` (string, required): Path to check

**Returns:** "exists" or "does not exist"

### `getFileInfo`

Gets detailed information about a file or directory.

**Parameters:**
- `path` (string, required): Path to get information for

**Returns:** Detailed file information from `ls -la`

### `findFiles`

Finds files matching a pattern in a directory.

**Parameters:**
- `directory` (string, required): Directory to search in
- `pattern` (string, required): File pattern (e.g., "*.ts", "README*")
- `recursive` (boolean, optional, default: true): Search recursively
- `maxDepth` (number, optional, default: 5): Maximum depth for recursive search

## Common Use Cases

### DevOps Agent
```typescript
const devopsAgent = createAgent({
  name: 'DevOpsManager',
  description: 'Manages development and deployment operations',
  instruction: 'Help with system administration and deployment tasks',
  model: 'gemini-pro'
})

devopsAgent.addTools({
  executeCommand,
  getSystemInfo,
  listEnvironmentVariables,
  getCurrentDirectory
})

// Usage examples:
// "Check system memory and CPU usage"
// "Run deployment script in the project directory"
// "List all environment variables for debugging"
// "Execute docker commands to manage containers"
```

### System Monitoring Agent
```typescript
const monitorAgent = createAgent({
  name: 'SystemMonitor',
  description: 'Monitors system health and performance',
  instruction: 'Monitor system performance and report issues',
  model: 'gemini'
})

monitorAgent.addTools({
  executeCommand,
  getSystemInfo,
  getProcessInfo
})

// Usage examples:
// "Check disk space usage"
// "Monitor running processes"
// "Report system memory usage"
```

### Environment Manager
```typescript
const envAgent = createAgent({
  name: 'EnvironmentManager',
  description: 'Manages environment configuration',
  instruction: 'Help manage environment variables and configuration',
  model: 'gemini-flash'
})

envAgent.addTools({
  getEnvironmentVariable,
  listEnvironmentVariables,
  setEnvironmentVariable
})

// Usage examples:
// "Show all database-related environment variables"
// "Set the API endpoint URL"
// "Check if DEBUG mode is enabled"
```

## Security Considerations

### Command Execution Safety
- Commands run with current user permissions only
- No privilege escalation capabilities
- Timeout protection prevents resource exhaustion
- Working directory isolation

### Environment Variable Access
- Read access to environment variables
- Temporary environment variable setting (process-scoped)
- No system-wide environment modification

### File System Access
- Respects file system permissions
- No automatic privilege escalation
- Path traversal protection
- Safe file operations with error handling

## Best Practices

### Command Execution
```typescript
// Always use timeouts for long-running commands
executeCommand({ 
  command: "npm install", 
  workingDirectory: "/project",
  timeout: 300000 // 5 minutes
})

// Use specific working directories
executeCommand({
  command: "git status",
  workingDirectory: "/path/to/repo"
})
```

### Error Handling
```typescript
// Wrap system operations in try-catch
try {
  const result = await executeCommand({ command: "risky-command" })
  return result
} catch (error) {
  return `Command failed: ${error.message}`
}
```

### Environment Management
```typescript
// Check before setting environment variables
const existing = await getEnvironmentVariable({ variableName: "API_URL" })
if (!existing) {
  await setEnvironmentVariable({ 
    name: "API_URL", 
    value: "https://api.example.com" 
  })
}
```

## Performance Considerations

- **Command Execution**: Long-running commands should use appropriate timeouts
- **System Info**: Cached for better performance on repeated calls
- **Environment Variables**: Fast access, minimal overhead
- **File Operations**: Consider file sizes and permissions
- **Directory Operations**: Recursive operations can be expensive on large directories