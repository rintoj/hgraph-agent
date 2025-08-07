# Tools Documentation

Comprehensive documentation for all available tools in the @hgraph/agent package. Each tool category provides specialized functionality for different aspects of agent automation.

## Tool Categories Overview

### 🗂️ [File System Tools](./file-system.md)
Essential file and directory operations for agents to interact with the local filesystem.

**Tools:** `readFile`, `writeFile`, `listDirectory`

**Use Cases:**
- Document processing and analysis
- Configuration file management
- Code analysis and manipulation
- Backup and archival operations

### ⚙️ [System Tools](./system.md)
Comprehensive system access including command execution, environment management, and system information.

**Tools:** `executeCommand`, `getCurrentDirectory`, `getCurrentUser`, `getHomeDirectory`, `getTempDirectory`, `getSystemInfo`, `getProcessInfo`, `getEnvironmentVariable`, `listEnvironmentVariables`, `setEnvironmentVariable`, `createDirectory`, `deleteFile`, `copyFile`, `moveFile`, `checkFileExists`, `getFileInfo`, `findFiles`

**Use Cases:**
- DevOps automation
- System monitoring and administration
- Environment configuration
- Process management

### 🌐 [Network Tools](./network.md)
HTTP client capabilities, file downloading, and network utilities for web service interaction.

**Tools:** `httpRequest`, `downloadFile`, `checkUrlStatus`, `getPublicIP`

**Use Cases:**
- API integration and testing
- Web scraping and content extraction
- Network diagnostics
- File downloading and management

### 📝 [Text Processing Tools](./text-processing.md)
Comprehensive text manipulation, parsing, encoding, and transformation capabilities.

**Tools:** `parseJson`, `parseCsv`, `hashText`, `base64Encode`, `base64Decode`, `urlEncode`, `urlDecode`, `generateUuid`, `textSearch`, `textReplace`, `slugify`

**Use Cases:**
- Data format conversion
- Content management and SEO
- Security and validation
- API data transformation

### ⏰ [Date/Time Tools](./datetime.md)
Complete date and time manipulation with timezone support and temporal calculations.

**Tools:** `getCurrentDateTime`, `formatDateTime`, `parseDateTime`, `calculateDateDifference`, `addToDate`, `getTimezone`

**Use Cases:**
- Scheduling and calendar management
- Log analysis and time-series data
- Project timeline management
- Time tracking and reporting

### 🔧 [Utility Tools](./utility.md)
Essential validation, security, mathematical, and general-purpose functions.

**Tools:** `validateEmail`, `validateUrl`, `validateJson`, `generatePassword`, `calculateMath`, `generateRandomNumber`, `convertUnits`

**Use Cases:**
- Data validation and quality assurance
- Security and cryptographic operations
- Mathematical calculations and conversions
- Random data generation

## Quick Reference

### Most Common Tools

#### File Operations
```typescript
import { readFile, writeFile, executeCommand } from '@hgraph/agent'

// Read configuration
const config = await readFile({ filePath: '/path/to/config.json' })

// Execute system commands
const result = await executeCommand({ command: 'npm install' })
```

#### Network Operations
```typescript
import { httpRequest, downloadFile } from '@hgraph/agent'

// API calls
const response = await httpRequest({ 
  url: 'https://api.example.com/data',
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' }
})

// File downloads
await downloadFile({ 
  url: 'https://example.com/file.zip',
  filePath: '/tmp/download.zip'
})
```

#### Data Processing
```typescript
import { parseJson, parseCsv, textSearch } from '@hgraph/agent'

// JSON processing
const data = await parseJson({ 
  jsonString: response,
  path: 'user.profile.email'
})

// Text analysis
const emails = await textSearch({
  text: document,
  pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
})
```

#### Date/Time Operations
```typescript
import { getCurrentDateTime, calculateDateDifference, addToDate } from '@hgraph/agent'

// Current time with timezone
const now = await getCurrentDateTime({ 
  format: 'iso',
  timezone: 'America/New_York'
})

// Calculate project timeline
const deadline = await addToDate({
  dateTime: startDate,
  amount: 30,
  unit: 'days'
})
```

#### Validation & Security
```typescript
import { validateEmail, generatePassword, hashText } from '@hgraph/agent'

// Input validation
const emailValid = await validateEmail({ 
  email: 'user@example.com',
  strict: true
})

// Secure password generation
const password = await generatePassword({
  length: 16,
  includeSymbols: true,
  excludeSimilar: true
})
```

## Tool Selection Guidelines

### Choose the Right Tool Category

**For File Operations:**
- Simple read/write: Use File System Tools
- Complex file management: Combine File System + System Tools
- Remote files: Use Network Tools for download, then File System Tools

**For Data Processing:**
- Structured data (JSON, CSV): Text Processing Tools
- Unstructured text: Text Processing Tools with regex
- Time-series data: Date/Time Tools + Text Processing Tools

**For System Integration:**
- Command execution: System Tools
- Environment setup: System Tools
- Process monitoring: System Tools + Date/Time Tools

**For Web Integration:**
- API calls: Network Tools
- Data validation: Utility Tools
- Content processing: Text Processing Tools

**For Validation & Security:**
- Input validation: Utility Tools
- Data integrity: Utility Tools + Text Processing Tools
- Authentication: Utility Tools + System Tools

## Performance Considerations

### Tool Efficiency Rankings

**Fast Tools (< 10ms typical):**
- File System: `readFile` (small files), `writeFile`
- System: `getCurrentDirectory`, `getEnvironmentVariable`
- Utility: `validateEmail`, `generateUuid`
- Date/Time: `getCurrentDateTime`, `formatDateTime`

**Medium Speed Tools (10-100ms typical):**
- Network: `checkUrlStatus`, `getPublicIP`
- Text Processing: `parseJson`, `textSearch`
- System: `executeCommand` (simple commands)
- Utility: `calculateMath`, `convertUnits`

**Slower Tools (100ms+ typical):**
- Network: `httpRequest`, `downloadFile`
- System: `executeCommand` (complex commands)
- File System: `listDirectory` (recursive, large directories)
- Text Processing: `parseCsv` (large files)

### Optimization Strategies

1. **Batch Operations:** Group similar operations together
2. **Caching:** Cache results for repeated operations
3. **Async Processing:** Use Promise.all() for parallel operations
4. **Resource Limits:** Set appropriate timeouts and size limits
5. **Error Handling:** Implement retry logic for network operations

## Security Best Practices

### Input Validation
Always validate inputs before processing:
```typescript
// Validate file paths
const isValidPath = (path) => path.startsWith('/') && !path.includes('..')

// Sanitize command inputs
const sanitizeCommand = (cmd) => cmd.replace(/[;&|`$()]/g, '')

// Validate URLs
const result = await validateUrl({ url: userInput })
if (!result.isValid) throw new Error('Invalid URL')
```

### Permission Management
- File operations respect filesystem permissions
- System commands run with current user privileges
- Network tools have built-in timeout protection
- No automatic privilege escalation

### Data Protection
- Hash sensitive data before storage
- Use secure password generation
- Validate all external inputs
- Implement proper error handling

## Troubleshooting

### Common Issues

**File System Tools:**
- Permission denied: Check file/directory permissions
- File not found: Verify absolute paths
- Large files: Consider memory usage

**Network Tools:**
- Timeout errors: Increase timeout values
- SSL errors: Check certificate validity
- Rate limiting: Implement backoff strategies

**System Tools:**
- Command not found: Check PATH environment
- Permission denied: Verify user privileges
- Environment variables: Check variable names and scopes

**Text Processing:**
- JSON parsing errors: Validate JSON syntax
- Regex failures: Test patterns separately
- Encoding issues: Ensure UTF-8 encoding

## Advanced Usage Patterns

### Tool Composition
Combine tools for complex workflows:

```typescript
// Complete data processing pipeline
const processDataPipeline = async (url, outputPath) => {
  // 1. Download data
  const tempFile = '/tmp/data.json'
  await downloadFile({ url, filePath: tempFile })
  
  // 2. Read and parse
  const jsonData = await readFile({ filePath: tempFile })
  const parsed = await parseJson({ jsonString: jsonData })
  
  // 3. Process and transform
  const processed = await textReplace({
    text: JSON.stringify(parsed),
    pattern: 'oldValue',
    replacement: 'newValue'
  })
  
  // 4. Save results
  await writeFile({ 
    filePath: outputPath,
    content: processed
  })
  
  // 5. Cleanup
  await deleteFile({ path: tempFile })
}
```

### Error Recovery
Implement robust error handling:

```typescript
const resilientOperation = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`)
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

## Getting Help

### Documentation Structure
Each tool category documentation includes:
- Tool descriptions and parameters
- Return value specifications
- Usage examples and code samples
- Common use cases and integration patterns
- Security considerations and best practices
- Performance optimization tips
- Error handling strategies

### Community Resources
- [GitHub Issues](https://github.com/hgraph-io/agent/issues) for bug reports
- [Documentation](https://github.com/hgraph-io/agent/docs) for detailed guides
- [Examples](https://github.com/hgraph-io/agent/examples) for implementation patterns

### Support Channels
- Technical documentation for implementation details
- Code examples for common use cases
- Best practices for production deployment
- Performance tuning and optimization guides