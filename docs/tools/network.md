# Network Tools

Network tools provide comprehensive HTTP client capabilities, file downloading, URL validation, and network utilities for agents to interact with web services and APIs.

## Available Tools

### `httpRequest`

Makes HTTP requests with full control over methods, headers, and body content.

**Description:** Comprehensive HTTP client supporting all major HTTP methods with customizable headers, request body, and timeout controls.

**Parameters:**
- `url` (string, required): Valid URL to make the request to
- `method` (string, optional, default: 'GET'): HTTP method - GET, POST, PUT, DELETE, or PATCH
- `headers` (object, optional): HTTP headers as key-value pairs
- `body` (string, optional): Request body for POST, PUT, PATCH methods
- `timeout` (number, optional, default: 10000): Request timeout in milliseconds (max 60000)

**Returns:** JSON object containing response status, headers, and body

**Example:**
```typescript
import { createAgent, httpRequest } from '@hgraph/agent'

const agent = createAgent({
  name: 'APIClient',
  description: 'Makes HTTP requests to APIs',
  instruction: 'Help with API interactions and web requests',
  model: 'gemini'
})

agent.addTool('httpRequest', httpRequest)

// Usage examples:
// "Make a GET request to https://api.github.com/users/octocat"
// "POST user data to the API endpoint with JSON content"
// "Send a PUT request with authentication headers"
```

**Sample Output:**
```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "content-length": "1234"
  },
  "body": "{\"name\":\"octocat\",\"id\":1}"
}
```

**Advanced Usage:**
```javascript
// POST with custom headers and JSON body
{
  url: "https://api.example.com/users",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
  },
  body: JSON.stringify({ name: "John", email: "john@example.com" }),
  timeout: 30000
}
```

---

### `downloadFile`

Downloads files from URLs and saves them to the local filesystem.

**Description:** Downloads files from web URLs with progress tracking and automatic error handling.

**Parameters:**
- `url` (string, required): Valid URL of the file to download
- `filePath` (string, required): Local file path where the file should be saved
- `timeout` (number, optional, default: 30000): Download timeout in milliseconds (max 300000)

**Returns:** Success message with file size information

**Example:**
```typescript
import { createAgent, downloadFile } from '@hgraph/agent'

const agent = createAgent({
  name: 'FileDownloader',
  description: 'Downloads files from the internet',
  instruction: 'Download files when requested',
  model: 'gemini'
})

agent.addTool('downloadFile', downloadFile)

// Usage examples:
// "Download the latest release from https://example.com/file.zip to /tmp/file.zip"
// "Save the image from the URL to my downloads folder"
```

**Sample Output:**
```
File downloaded successfully: /tmp/image.png (2048576 bytes)
```

**Features:**
- Automatic file size detection
- Resume capability for interrupted downloads
- MIME type detection and validation
- Proper error handling for network issues

---

### `checkUrlStatus`

Checks if a URL is accessible and returns detailed status information.

**Description:** Performs a HEAD request to check URL accessibility, response time, and server information without downloading content.

**Parameters:**
- `url` (string, required): URL to check
- `timeout` (number, optional, default: 10000): Request timeout in milliseconds (max 30000)

**Returns:** JSON object with accessibility status and response details

**Example:**
```typescript
import { createAgent, checkUrlStatus } from '@hgraph/agent'

const agent = createAgent({
  name: 'URLChecker',
  description: 'Checks URL accessibility',
  instruction: 'Check if URLs are working',
  model: 'gemini'
})

agent.addTool('checkUrlStatus', checkUrlStatus)

// Usage examples:
// "Check if https://example.com is accessible"
// "Test the status of our API endpoint"
// "Verify all URLs in the list are working"
```

**Sample Output (Accessible):**
```json
{
  "url": "https://example.com",
  "status": 200,
  "statusText": "OK",
  "accessible": true,
  "responseTime": "142ms",
  "headers": {
    "server": "nginx/1.18.0",
    "content-type": "text/html",
    "content-length": "1256"
  }
}
```

**Sample Output (Not Accessible):**
```json
{
  "url": "https://nonexistent.example.com",
  "accessible": false,
  "error": "getaddrinfo ENOTFOUND nonexistent.example.com"
}
```

---

### `getPublicIP`

Gets the public IP address of the current machine.

**Description:** Retrieves the public-facing IP address using reliable IP detection services.

**Parameters:**
- `provider` (string, optional, default: 'ipify'): IP service provider - 'ipify', 'httpbin', or 'icanhazip'

**Returns:** Public IP address as string

**Example:**
```typescript
import { createAgent, getPublicIP } from '@hgraph/agent'

const agent = createAgent({
  name: 'NetworkInfo',
  description: 'Provides network information',
  instruction: 'Help with network diagnostics',
  model: 'gemini'
})

agent.addTool('getPublicIP', getPublicIP)

// Usage examples:
// "What's my public IP address?"
// "Get the external IP using a different provider"
```

**Sample Output:**
```
203.0.113.42
```

**Available Providers:**
- `ipify`: https://api.ipify.org (JSON response)
- `httpbin`: https://httpbin.org/ip (JSON response)  
- `icanhazip`: https://icanhazip.com (plain text)

## Common Use Cases

### API Testing Agent
```typescript
const apiAgent = createAgent({
  name: 'APITester',
  description: 'Tests API endpoints',
  instruction: 'Help test and validate API endpoints',
  model: 'gemini-pro'
})

apiAgent.addTools({
  httpRequest,
  checkUrlStatus
})

// Usage examples:
// "Test the /users endpoint with different HTTP methods"
// "Check if all API endpoints are responding correctly"
// "Validate the authentication flow by making POST requests"
```

### Website Monitor Agent
```typescript
const monitorAgent = createAgent({
  name: 'WebsiteMonitor',
  description: 'Monitors website availability',
  instruction: 'Monitor website status and performance',
  model: 'gemini'
})

monitorAgent.addTools({
  checkUrlStatus,
  httpRequest
})

// Usage examples:
// "Check if all websites in the monitoring list are up"
// "Test response times for critical endpoints"
// "Monitor API health endpoints"
```

### Content Downloader Agent
```typescript
const downloaderAgent = createAgent({
  name: 'ContentDownloader',
  description: 'Downloads web content',
  instruction: 'Download files and content from the internet',
  model: 'gemini'
})

downloaderAgent.addTools({
  downloadFile,
  httpRequest,
  checkUrlStatus
})

// Usage examples:
// "Download all images from this webpage"
// "Fetch the latest version of the software"
// "Download and save API responses to files"
```

### Network Diagnostics Agent
```typescript
const diagnosticsAgent = createAgent({
  name: 'NetworkDiagnostics',
  description: 'Performs network diagnostics',
  instruction: 'Help diagnose network connectivity issues',
  model: 'gemini'
})

diagnosticsAgent.addTools({
  getPublicIP,
  checkUrlStatus,
  httpRequest
})

// Usage examples:
// "What's my current public IP?"
// "Test connectivity to various services"
// "Diagnose why I can't reach a specific website"
```

## Security Considerations

### URL Validation
- All URLs are validated before requests
- Protocol restrictions (HTTP/HTTPS only by default)
- Protection against local network access (127.0.0.1, etc.)
- User-Agent header automatically added

### Request Safety
- Timeout protection prevents hung requests
- Response size limits prevent memory exhaustion
- No automatic redirect following without explicit configuration
- Headers are sanitized and validated

### File Download Safety
- Path traversal protection for file paths
- File size limits configurable
- MIME type validation
- Automatic virus scanning integration points

### Network Access Control
- No access to internal network ranges by default
- Configurable allowed/blocked domains
- Rate limiting capabilities
- Request logging for audit trails

## Advanced Usage Patterns

### Custom Headers and Authentication
```typescript
// API key authentication
{
  url: "https://api.example.com/data",
  method: "GET",
  headers: {
    "Authorization": "Bearer your-api-key",
    "Accept": "application/json"
  }
}

// Basic authentication
{
  url: "https://secure.example.com/api",
  headers: {
    "Authorization": "Basic " + btoa("username:password")
  }
}
```

### Error Handling Patterns
```typescript
// Retry logic for failed requests
const makeRequestWithRetry = async (url, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await httpRequest({ url })
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### Batch Operations
```typescript
// Check multiple URLs
const urls = [
  "https://example.com",
  "https://api.example.com",
  "https://cdn.example.com"
]

const results = await Promise.all(
  urls.map(url => checkUrlStatus({ url }))
)
```

## Performance Considerations

### Request Optimization
- Use appropriate timeouts for different request types
- Implement connection pooling for multiple requests
- Consider compression for large responses
- Use HEAD requests for status checks when possible

### Bandwidth Management
- Monitor download sizes for file operations
- Implement progress tracking for large downloads
- Use streaming for very large files
- Consider concurrent download limits

### Error Recovery
- Implement exponential backoff for retries
- Handle different error types appropriately
- Log errors for debugging and monitoring
- Provide meaningful error messages to users

## Integration Examples

### REST API Client
```typescript
const restClient = createAgent({
  name: 'RESTClient',
  description: 'Interacts with REST APIs',
  instruction: 'Make REST API calls and handle responses',
  model: 'gemini'
})

restClient.addTools({
  httpRequest,
  checkUrlStatus
})

// CRUD operations:
// "Create a new user via POST request"
// "Get user data with GET request"  
// "Update user info with PUT request"
// "Delete user with DELETE request"
```

### Web Scraping Agent
```typescript
const scraperAgent = createAgent({
  name: 'WebScraper',
  description: 'Scrapes web content',
  instruction: 'Extract data from websites',
  model: 'gemini-pro'
})

scraperAgent.addTools({
  httpRequest,
  downloadFile,
  checkUrlStatus
})

// Usage:
// "Fetch the HTML content from this website"
// "Download all images from the gallery page"
// "Check if the website has been updated since yesterday"
```