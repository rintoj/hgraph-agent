# Text Processing Tools

Text processing tools provide comprehensive capabilities for parsing, transforming, encoding, and analyzing text data. These tools are essential for data processing, content manipulation, and format conversions.

## Available Tools

### `parseJson`

Parses JSON strings with optional property extraction using dot notation.

**Description:** Safely parses JSON strings and optionally extracts specific properties using JavaScript dot notation syntax.

**Parameters:**
- `jsonString` (string, required): Valid JSON string to parse
- `path` (string, optional): Dot notation path to extract specific property (e.g., "user.profile.name")
- `pretty` (boolean, optional, default: false): Format output as pretty-printed JSON

**Returns:** Parsed JSON data or extracted property value

**Example:**
```typescript
import { createAgent, parseJson } from '@hgraph/agent'

const agent = createAgent({
  name: 'DataParser',
  description: 'Parses and processes data',
  instruction: 'Help parse and extract data from JSON',
  model: 'gemini'
})

agent.addTool('parseJson', parseJson)

// Usage examples:
// "Parse this JSON and show me the user's email"
// "Extract the items array from this JSON response"
// "Parse and pretty-print this configuration file"
```

**Advanced Usage:**
```javascript
// Extract nested property
parseJson({
  jsonString: '{"user":{"profile":{"name":"John","age":30}}}',
  path: "user.profile.name"  // Returns: "John"
})

// Pretty print entire object
parseJson({
  jsonString: '{"compact":true,"data":[1,2,3]}',
  pretty: true
})
```

---

### `parseCsv`

Converts CSV strings to JSON format with customizable parsing options.

**Description:** Parses CSV data into structured JSON format, handling headers, custom delimiters, and quoted fields.

**Parameters:**
- `csvString` (string, required): CSV data to parse
- `delimiter` (string, optional, default: ','): Field separator character
- `hasHeader` (boolean, optional, default: true): Whether first row contains column headers
- `maxRows` (number, optional, default: 100): Maximum number of rows to process (1-1000)

**Returns:** JSON array of parsed data

**Example:**
```typescript
import { createAgent, parseCsv } from '@hgraph/agent'

const agent = createAgent({
  name: 'CSVProcessor',
  description: 'Processes CSV data',
  instruction: 'Convert CSV data to JSON format',
  model: 'gemini'
})

agent.addTool('parseCsv', parseCsv)

// Usage examples:
// "Convert this CSV data to JSON format"
// "Parse this tab-separated file"
// "Process this CSV with custom settings"
```

**Sample Input:**
```csv
name,email,age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25
```

**Sample Output:**
```json
[
  {
    "name": "John Doe",
    "email": "john@example.com", 
    "age": "30"
  },
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "age": "25"
  }
]
```

**Advanced Parsing:**
```javascript
// Tab-separated values
parseCsv({
  csvString: "name\temail\tage\nJohn\tjohn@example.com\t30",
  delimiter: "\t"
})

// No headers (returns arrays)
parseCsv({
  csvString: "John,30\nJane,25",
  hasHeader: false
})
```

---

### `hashText`

Generates cryptographic hashes of text using various algorithms.

**Description:** Creates secure hash digests using industry-standard algorithms for data integrity and verification.

**Parameters:**
- `text` (string, required): Text to hash
- `algorithm` (string, optional, default: 'sha256'): Hash algorithm - 'md5', 'sha1', 'sha256', or 'sha512'
- `encoding` (string, optional, default: 'hex'): Output encoding - 'hex' or 'base64'

**Returns:** Hash digest as string

**Example:**
```typescript
import { createAgent, hashText } from '@hgraph/agent'

const agent = createAgent({
  name: 'CryptoHelper',
  description: 'Provides cryptographic functions',
  instruction: 'Help with hashing and encoding operations',
  model: 'gemini'
})

agent.addTool('hashText', hashText)

// Usage examples:
// "Generate SHA256 hash of this password"
// "Create MD5 checksum for file verification" 
// "Hash this data using SHA512 with base64 encoding"
```

**Hash Comparison:**
```javascript
// SHA256 (recommended for security)
hashText({ text: "hello world", algorithm: "sha256" })
// Returns: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"

// MD5 (faster but less secure)
hashText({ text: "hello world", algorithm: "md5" })
// Returns: "5d41402abc4b2a76b9719d911017c592"
```

---

### `base64Encode`

Encodes text to Base64 format.

**Description:** Converts text strings to Base64 encoding for safe transmission and storage.

**Parameters:**
- `text` (string, required): Text to encode

**Returns:** Base64 encoded string

**Example:**
```typescript
agent.addTool('base64Encode', base64Encode)

// Usage: "Encode 'Hello World' to Base64"
// Returns: "SGVsbG8gV29ybGQ="
```

---

### `base64Decode`

Decodes Base64 text back to original string.

**Description:** Converts Base64 encoded strings back to their original text format.

**Parameters:**
- `base64Text` (string, required): Base64 text to decode

**Returns:** Decoded original text

**Example:**
```typescript
agent.addTool('base64Decode', base64Decode)

// Usage: "Decode 'SGVsbG8gV29ybGQ=' from Base64"
// Returns: "Hello World"
```

---

### `urlEncode`

URL encodes text for safe use in URLs.

**Description:** Encodes text using percent-encoding for safe inclusion in URLs and query parameters.

**Parameters:**
- `text` (string, required): Text to URL encode

**Returns:** URL encoded string

**Example:**
```typescript
agent.addTool('urlEncode', urlEncode)

// Usage: "URL encode 'hello world!'"
// Returns: "hello%20world%21"
```

---

### `urlDecode`

URL decodes percent-encoded text.

**Description:** Decodes percent-encoded URLs back to readable text.

**Parameters:**
- `encodedText` (string, required): URL encoded text to decode

**Returns:** Decoded original text

**Example:**
```typescript
agent.addTool('urlDecode', urlDecode)

// Usage: "URL decode 'hello%20world%21'"
// Returns: "hello world!"
```

---

### `generateUuid`

Generates UUID (Universally Unique Identifier) version 4.

**Description:** Creates cryptographically secure UUIDs for unique identification.

**Parameters:**
- `count` (number, optional, default: 1): Number of UUIDs to generate (1-100)

**Returns:** Single UUID string or newline-separated UUIDs if count > 1

**Example:**
```typescript
agent.addTool('generateUuid', generateUuid)

// Usage: "Generate a new UUID"
// Returns: "550e8400-e29b-41d4-a716-446655440000"

// Usage: "Generate 5 UUIDs"
// Returns multiple UUIDs separated by newlines
```

---

### `textSearch`

Searches text using regular expressions with detailed match information.

**Description:** Performs pattern matching using regex with capture groups and position information.

**Parameters:**
- `text` (string, required): Text to search in
- `pattern` (string, required): Regular expression pattern
- `flags` (string, optional, default: 'gi'): Regex flags (g=global, i=ignoreCase, m=multiline)
- `maxMatches` (number, optional, default: 100): Maximum matches to return (1-1000)

**Returns:** JSON array of match objects with position and group information

**Example:**
```typescript
import { createAgent, textSearch } from '@hgraph/agent'

const agent = createAgent({
  name: 'TextAnalyzer',
  description: 'Analyzes and searches text',
  instruction: 'Help find patterns and analyze text content',
  model: 'gemini'
})

agent.addTool('textSearch', textSearch)

// Usage examples:
// "Find all email addresses in this text"
// "Search for phone numbers using regex pattern"
// "Find all URLs in the document"
```

**Sample Output:**
```json
[
  {
    "match": "john@example.com",
    "index": 45,
    "groups": ["john", "example.com"]
  },
  {
    "match": "jane@test.org",
    "index": 123,
    "groups": ["jane", "test.org"]
  }
]
```

---

### `textReplace`

Replaces text using regular expressions with capture group support.

**Description:** Performs find-and-replace operations using regex patterns with backreference support.

**Parameters:**
- `text` (string, required): Text to perform replacements on
- `pattern` (string, required): Regular expression pattern to find
- `replacement` (string, required): Replacement text (supports $1, $2 for capture groups)
- `flags` (string, optional, default: 'g'): Regex flags

**Returns:** Text with replacements applied

**Example:**
```typescript
agent.addTool('textReplace', textReplace)

// Usage: "Replace all dates from MM/DD/YYYY to YYYY-MM-DD format"
```

**Advanced Replacement:**
```javascript
// Swap first and last names
textReplace({
  text: "John Doe, Jane Smith",
  pattern: "([A-Z][a-z]+) ([A-Z][a-z]+)",
  replacement: "$2, $1"
})
// Returns: "Doe, John, Smith, Jane"
```

---

### `slugify`

Converts text to URL-friendly slugs.

**Description:** Creates clean, URL-safe strings by removing special characters and normalizing text.

**Parameters:**
- `text` (string, required): Text to convert to slug
- `separator` (string, optional, default: '-'): Separator character
- `lowercase` (boolean, optional, default: true): Convert to lowercase

**Returns:** URL-friendly slug string

**Example:**
```typescript
agent.addTool('slugify', slugify)

// Usage: "Convert 'Hello World! This is a Test.' to a URL slug"
// Returns: "hello-world-this-is-a-test"
```

**Advanced Slugification:**
```javascript
// Custom separator
slugify({
  text: "Product Name v2.0",
  separator: "_"
})
// Returns: "product_name_v2_0"

// Keep case
slugify({
  text: "API Documentation",
  lowercase: false
})
// Returns: "API-Documentation"
```

## Common Use Cases

### Data Processing Agent
```typescript
const dataAgent = createAgent({
  name: 'DataProcessor',
  description: 'Processes and transforms data',
  instruction: 'Help with data parsing, conversion, and transformation',
  model: 'gemini-pro'
})

dataAgent.addTools({
  parseJson,
  parseCsv,
  textSearch,
  textReplace
})

// Usage examples:
// "Convert this CSV to JSON and find all email addresses"
// "Parse the API response and extract user information"
// "Clean up this data by removing unwanted characters"
```

### Content Management Agent
```typescript
const contentAgent = createAgent({
  name: 'ContentManager',
  description: 'Manages and processes content',
  instruction: 'Help with content processing and SEO optimization',
  model: 'gemini'
})

contentAgent.addTools({
  slugify,
  textSearch,
  textReplace,
  hashText
})

// Usage examples:
// "Create SEO-friendly slugs from these article titles"
// "Find and replace all old URLs with new ones"
// "Generate content hashes for cache busting"
```

### Security and Validation Agent
```typescript
const securityAgent = createAgent({
  name: 'SecurityValidator',
  description: 'Provides security and validation functions',
  instruction: 'Help with data security and validation',
  model: 'gemini'
})

securityAgent.addTools({
  hashText,
  base64Encode,
  base64Decode,
  generateUuid
})

// Usage examples:
// "Hash these passwords using SHA256"
// "Generate secure session IDs"
// "Encode sensitive data for transmission"
```

### API Data Transformer
```typescript
const apiAgent = createAgent({
  name: 'APITransformer',
  description: 'Transforms API data between formats',
  instruction: 'Convert data between different formats and encodings',
  model: 'gemini'
})

apiAgent.addTools({
  parseJson,
  parseCsv,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode
})

// Usage examples:
// "Convert this CSV data to JSON for the API"
// "Decode the base64 payload from the webhook"
// "URL encode these parameters for the GET request"
```

## Best Practices

### JSON Processing
```typescript
// Always validate JSON before processing
try {
  const result = await parseJson({ jsonString: userInput })
  return result
} catch (error) {
  return `Invalid JSON: ${error.message}`
}

// Use path extraction for large objects
const email = await parseJson({
  jsonString: largeUserObject,
  path: "user.contact.email"
})
```

### CSV Handling
```typescript
// Handle different CSV formats
const parseConfig = {
  delimiter: csvType === 'tsv' ? '\t' : ',',
  hasHeader: true,
  maxRows: 1000
}

// Validate CSV structure
const sample = await parseCsv({
  csvString: csvData.substring(0, 500),
  maxRows: 5
})
```

### Security Considerations
```typescript
// Use SHA256 or higher for security-critical hashing
const secureHash = await hashText({
  text: sensitiveData,
  algorithm: 'sha256'
})

// Sanitize text before processing
const cleanText = userInput.replace(/[<>]/g, '')
const slug = await slugify({ text: cleanText })
```

### Performance Optimization
```typescript
// Limit processing size for large texts
const maxTextLength = 100000
if (inputText.length > maxTextLength) {
  inputText = inputText.substring(0, maxTextLength)
}

// Use appropriate regex flags
const efficientSearch = await textSearch({
  text: largeDocument,
  pattern: "\\b\\w+@\\w+\\.\\w+\\b",
  flags: "g", // Global only, no case insensitive for performance
  maxMatches: 50
})
```

## Error Handling Patterns

### Graceful Degradation
```typescript
// Handle invalid JSON gracefully
const safeParseJson = async (jsonString) => {
  try {
    return await parseJson({ jsonString, pretty: true })
  } catch (error) {
    return `Could not parse JSON: ${error.message}`
  }
}

// Validate regex patterns
const safeTextSearch = async (text, pattern) => {
  try {
    return await textSearch({ text, pattern })
  } catch (error) {
    return `Invalid regex pattern: ${error.message}`
  }
}
```

### Input Validation
```typescript
// Validate Base64 input
const isValidBase64 = (str) => {
  try {
    return btoa(atob(str)) === str
  } catch {
    return false
  }
}

// Check URL encoding
const isUrlEncoded = (str) => {
  return str !== decodeURIComponent(str)
}
```

## Integration Examples

### Log Processing System
```typescript
const logProcessor = createAgent({
  name: 'LogProcessor',
  description: 'Processes and analyzes log files',
  instruction: 'Extract information from log files and generate reports',
  model: 'gemini-pro'
})

logProcessor.addTools({
  textSearch,
  textReplace,
  parseCsv,
  hashText
})

// Process access logs, error logs, and generate summaries
```

### Content Migration Tool
```typescript
const migrationAgent = createAgent({
  name: 'ContentMigrator',
  description: 'Migrates content between systems',
  instruction: 'Transform content formats and fix encoding issues',
  model: 'gemini'
})

migrationAgent.addTools({
  parseJson,
  base64Decode,
  textReplace,
  slugify
})

// Migrate blog posts, fix character encoding, create new slugs
```