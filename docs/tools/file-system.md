# File System Tools

File system tools provide comprehensive file and directory operations for agents to interact with the local filesystem safely and efficiently.

## Available Tools

### `readFile`

Reads and returns the complete text content of a file.

**Description:** Reads the entire contents of a file as UTF-8 text and returns it as a string.

**Parameters:**
- `filePath` (string, required): Absolute path to the file to read

**Returns:** String containing the file contents

**Example:**
```typescript
import { createAgent, readFile } from '@hgraph/agent'

const agent = createAgent({
  name: 'FileReader',
  description: 'Reads files',
  instruction: 'Read files when requested',
  model: 'gemini'
})

agent.addTool('readFile', readFile)

// Usage in conversation:
// "Please read the contents of /path/to/file.txt"
```

**Error Handling:**
- Throws error if file doesn't exist
- Throws error if path is not accessible
- Handles permission errors gracefully

---

### `writeFile`

Writes text content to a file, creating or overwriting it as needed.

**Description:** Creates a new file or overwrites an existing file with the provided text content.

**Parameters:**
- `filePath` (string, required): Absolute path where the file should be written
- `content` (string, required): Text content to write to the file

**Returns:** Success message confirming the file was written

**Example:**
```typescript
import { createAgent, writeFile } from '@hgraph/agent'

const agent = createAgent({
  name: 'FileWriter',
  description: 'Writes files',
  instruction: 'Write files when requested',
  model: 'gemini'
})

agent.addTool('writeFile', writeFile)

// Usage in conversation:
// "Please write 'Hello World' to /tmp/greeting.txt"
```

**Error Handling:**
- Creates parent directories if they don't exist (when possible)
- Throws error if path is not writable
- Handles disk space and permission errors

---

### `listDirectory`

Lists the contents of a specified directory.

**Description:** Retrieves all files and subdirectories within a given directory path.

**Parameters:**
- `directoryPath` (string, required): Absolute path to the directory to list
- `recursive` (boolean, optional, default: false): Whether to list files recursively in subdirectories

**Returns:** Newline-separated list of file and directory paths

**Example:**
```typescript
import { createAgent, listDirectory } from '@hgraph/agent'

const agent = createAgent({
  name: 'FileLister',
  description: 'Lists directory contents',
  instruction: 'List directory contents when requested',
  model: 'gemini'
})

agent.addTool('listDirectory', listDirectory)

// Usage in conversation:
// "List all files in /home/user/documents"
// "List all files recursively in /project/src"
```

**Output Format:**
- Files are listed with their full paths
- Directories are suffixed with `/`
- Recursive mode includes subdirectory contents
- Empty directories return a "No files found" message

**Error Handling:**
- Throws error if directory doesn't exist
- Handles permission errors
- Gracefully handles unreadable subdirectories

## Common Use Cases

### Document Processing Agent
```typescript
const docAgent = createAgent({
  name: 'DocumentProcessor',
  description: 'Processes documents',
  instruction: 'Help with document operations',
  model: 'gemini-pro'
})

docAgent.addTools({
  readFile,
  writeFile,
  listDirectory
})

// Can handle requests like:
// "Read all .txt files in /documents and create a summary"
// "List all markdown files in /project/docs"
// "Create a new document with the following content..."
```

### Code Analysis Agent
```typescript
const codeAgent = createAgent({
  name: 'CodeAnalyzer',
  description: 'Analyzes code files',
  instruction: 'Analyze and understand code files',
  model: 'gemini-pro'
})

codeAgent.addTools({
  readFile,
  listDirectory
})

// Can handle requests like:
// "Read all JavaScript files in /src and identify functions"
// "List all TypeScript files and their sizes"
```

## Security Considerations

### File Path Validation
- All tools require absolute paths for security
- Relative paths are rejected to prevent directory traversal
- Path sanitization is performed internally

### Permission Handling
- Tools respect filesystem permissions
- Graceful error handling for permission denied scenarios
- No privilege escalation attempts

### Content Safety
- File content is treated as UTF-8 text
- Binary files may not display correctly
- Large files are read entirely into memory (consider file size limits)

## Best Practices

### Error Handling
```typescript
// Always handle file operations gracefully
agent.addTool('safeReadFile', createTool({
  description: 'Safely reads a file with error handling',
  parameters: z.object({
    filePath: z.string(),
  }),
  run: async ({ filePath }) => {
    try {
      return await readFile.run({ filePath })
    } catch (error) {
      return `Could not read file: ${error.message}`
    }
  }
}))
```

### Path Validation
```typescript
// Validate paths before use
const validatePath = (path: string): boolean => {
  return path.startsWith('/') && !path.includes('..')
}
```

### Performance Considerations
- Large files may take time to read/write
- Recursive directory listing can be expensive
- Consider file size limits for your use case
- Use streaming for very large files when possible

## Integration Examples

### Backup Agent
```typescript
const backupAgent = createAgent({
  name: 'BackupManager',
  description: 'Manages file backups',
  instruction: 'Create and manage file backups',
  model: 'gemini'
})

backupAgent.addTools({
  readFile,
  writeFile,
  listDirectory
})

// Usage:
// "Create a backup of all files in /important/documents"
// "List all backup files in /backups"
```

### Configuration Manager
```typescript
const configAgent = createAgent({
  name: 'ConfigManager', 
  description: 'Manages configuration files',
  instruction: 'Read and modify configuration files safely',
  model: 'gemini-flash'
})

configAgent.addTools({
  readFile,
  writeFile,
  listDirectory
})

// Usage:
// "Read the config file and show me the database settings"
// "Update the port number in the configuration"
```