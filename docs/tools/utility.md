# Utility Tools

Utility tools provide essential validation, security, mathematical, and general-purpose functions that are commonly needed across various applications and use cases.

## Available Tools

### `validateEmail`

Validates email addresses with basic or strict RFC 5322 compliance.

**Description:** Provides flexible email validation with both basic pattern matching and strict RFC compliance options.

**Parameters:**
- `email` (string, required): Email address to validate
- `strict` (boolean, optional, default: false): Use strict RFC 5322 validation

**Returns:** JSON object with validation results

**Example:**
```typescript
import { createAgent, validateEmail } from '@hgraph/agent'

const agent = createAgent({
  name: 'DataValidator',
  description: 'Validates various data formats',
  instruction: 'Help validate and verify data integrity',
  model: 'gemini'
})

agent.addTool('validateEmail', validateEmail)

// Usage examples:
// "Validate the email address 'user@example.com'"
// "Check if 'invalid-email' is a valid email with strict validation"
// "Verify all email addresses in this list"
```

**Sample Output:**
```json
{
  "email": "user@example.com",
  "isValid": true,
  "validationType": "basic"
}

{
  "email": "invalid.email",
  "isValid": false,
  "validationType": "strict"
}
```

**Validation Examples:**
```javascript
// Basic validation (permissive)
validateEmail({ 
  email: "user@domain.com",
  strict: false 
})

// Strict RFC 5322 validation
validateEmail({ 
  email: "user.name+tag@domain.co.uk",
  strict: true 
})
```

---

### `validateUrl`

Validates URLs with protocol and structure checking.

**Description:** Comprehensive URL validation with customizable protocol restrictions and detailed structure analysis.

**Parameters:**
- `url` (string, required): URL to validate
- `protocols` (array, optional, default: ['http', 'https']): Allowed protocols

**Returns:** JSON object with validation results and URL components

**Example:**
```typescript
agent.addTool('validateUrl', validateUrl)

// Usage examples:
// "Validate 'https://example.com/path?query=value'"
// "Check if this URL allows FTP protocol"
// "Verify the structure of this API endpoint"
```

**Sample Output:**
```json
{
  "url": "https://api.example.com:8080/v1/users?limit=10",
  "isValid": true,
  "error": null,
  "allowedProtocols": ["http", "https"],
  "protocol": "https:",
  "hostname": "api.example.com",
  "port": "8080",
  "pathname": "/v1/users",
  "search": "?limit=10",
  "hash": ""
}
```

**Advanced Validation:**
```javascript
// Allow multiple protocols
validateUrl({
  url: "ftp://files.example.com/data.zip",
  protocols: ["http", "https", "ftp"]
})

// Strict HTTPS only
validateUrl({
  url: "http://insecure.com",
  protocols: ["https"]  // Will fail validation
})
```

---

### `validateJson`

Validates JSON strings with optional schema validation.

**Description:** Comprehensive JSON validation with structure checking and basic schema validation support.

**Parameters:**
- `jsonString` (string, required): JSON string to validate
- `schema` (string, optional): JSON schema string for validation

**Returns:** JSON object with validation results and metadata

**Example:**
```typescript
agent.addTool('validateJson', validateJson)

// Usage examples:
// "Validate this JSON configuration file"
// "Check if this API response is valid JSON"
// "Validate JSON against this schema"
```

**Sample Output:**
```json
{
  "jsonString": "{\"name\":\"John\",\"age\":30}",
  "isValid": true,
  "error": null,
  "schemaValidation": null,
  "type": "object",
  "isArray": false
}
```

**Schema Validation:**
```javascript
validateJson({
  jsonString: '{"name":"John","age":30}',
  schema: '{"type":"object","required":["name","age"]}'
})
```

---

### `generatePassword`

Generates cryptographically secure passwords with customizable complexity.

**Description:** Creates secure passwords with configurable length, character sets, and security options.

**Parameters:**
- `length` (number, optional, default: 16): Password length (4-128 characters)
- `includeUppercase` (boolean, optional, default: true): Include uppercase letters
- `includeLowercase` (boolean, optional, default: true): Include lowercase letters
- `includeNumbers` (boolean, optional, default: true): Include numbers
- `includeSymbols` (boolean, optional, default: true): Include symbols
- `excludeSimilar` (boolean, optional, default: false): Exclude similar characters (0, O, l, 1, etc.)

**Returns:** JSON object with password and strength analysis

**Example:**
```typescript
agent.addTool('generatePassword', generatePassword)

// Usage examples:
// "Generate a 20-character secure password"
// "Create a password without symbols for legacy systems"
// "Generate a password excluding similar-looking characters"
```

**Sample Output:**
```json
{
  "password": "K8#mQ2$vL9@nX7!p",
  "length": 16,
  "entropy": 95.2,
  "strength": "Very Strong",
  "settings": {
    "includeUppercase": true,
    "includeLowercase": true,
    "includeNumbers": true,
    "includeSymbols": true,
    "excludeSimilar": false
  }
}
```

**Password Customization:**
```javascript
// High-security password
generatePassword({
  length: 32,
  includeSymbols: true,
  excludeSimilar: true
})

// Simple alphanumeric password
generatePassword({
  length: 12,
  includeSymbols: false,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true
})

// Numeric PIN
generatePassword({
  length: 6,
  includeUppercase: false,
  includeLowercase: false,
  includeNumbers: true,
  includeSymbols: false
})
```

---

### `calculateMath`

Performs mathematical calculations from string expressions.

**Description:** Evaluates mathematical expressions safely with support for basic arithmetic operations.

**Parameters:**
- `expression` (string, required): Mathematical expression (e.g., "2 + 3 * 4")
- `precision` (number, optional, default: 10): Decimal places for result (0-15)

**Returns:** JSON object with calculation results

**Example:**
```typescript
agent.addTool('calculateMath', calculateMath)

// Usage examples:
// "Calculate 15% of 240"
// "What's the result of (100 + 50) / 3?"
// "Compute the square root of 144"
```

**Sample Output:**
```json
{
  "expression": "15 * 240 / 100",
  "result": 36,
  "resultString": "36.0000000000"
}
```

**Calculation Examples:**
```javascript
// Percentage calculation
calculateMath({ 
  expression: "15 * 240 / 100",
  precision: 2 
})

// Complex expression
calculateMath({ 
  expression: "(100 + 50) * 2 - 25",
  precision: 0 
})

// Decimal operations
calculateMath({ 
  expression: "10.5 + 3.25 - 1.75",
  precision: 2 
})
```

---

### `generateRandomNumber`

Generates cryptographically secure random numbers with various options.

**Description:** Creates random numbers using cryptographically secure methods with support for integers, decimals, and unique sets.

**Parameters:**
- `min` (number, optional, default: 0): Minimum value (inclusive)
- `max` (number, optional, default: 100): Maximum value (inclusive)
- `count` (number, optional, default: 1): Number of random numbers (1-1000)
- `decimals` (number, optional, default: 0): Decimal places (0 for integers)
- `unique` (boolean, optional, default: false): Ensure all numbers are unique

**Returns:** JSON object with generated numbers and metadata

**Example:**
```typescript
agent.addTool('generateRandomNumber', generateRandomNumber)

// Usage examples:
// "Generate a random number between 1 and 100"
// "Create 10 unique lottery numbers from 1 to 50"
// "Generate random decimal between 0 and 1 with 3 decimal places"
```

**Sample Output:**
```json
{
  "numbers": [42, 17, 89, 3, 56],
  "count": 5,
  "range": { "min": 1, "max": 100 },
  "settings": { "decimals": 0, "unique": true }
}
```

**Random Number Examples:**
```javascript
// Single random integer
generateRandomNumber({
  min: 1,
  max: 6  // Dice roll
})

// Multiple unique numbers (lottery)
generateRandomNumber({
  min: 1,
  max: 49,
  count: 6,
  unique: true
})

// Random decimal
generateRandomNumber({
  min: 0,
  max: 1,
  decimals: 4,
  count: 1
})

// Temperature simulation
generateRandomNumber({
  min: -10,
  max: 35,
  decimals: 1,
  count: 10
})
```

---

### `convertUnits`

Converts between different units of measurement.

**Description:** Comprehensive unit conversion supporting length, weight, temperature, volume, and time units.

**Parameters:**
- `value` (number, required): Value to convert
- `fromUnit` (string, required): Source unit
- `toUnit` (string, required): Target unit
- `category` (string, required): Unit category - 'length', 'weight', 'temperature', 'volume', or 'time'

**Returns:** JSON object with conversion results

**Example:**
```typescript
agent.addTool('convertUnits', convertUnits)

// Usage examples:
// "Convert 5 kilometers to miles"
// "How many pounds is 2.5 kilograms?"
// "Convert 32°F to Celsius"
```

**Sample Output:**
```json
{
  "originalValue": 5,
  "fromUnit": "km",
  "toUnit": "mi",
  "result": 3.106856,
  "category": "length"
}
```

**Supported Units by Category:**

**Length:**
- `mm` (millimeters), `cm` (centimeters), `m` (meters), `km` (kilometers)
- `in` (inches), `ft` (feet), `yd` (yards), `mi` (miles)

**Weight:**
- `mg` (milligrams), `g` (grams), `kg` (kilograms)
- `oz` (ounces), `lb` (pounds)

**Temperature:**
- `c`/`celsius`, `f`/`fahrenheit`, `k`/`kelvin`

**Volume:**
- `ml` (milliliters), `l` (liters)
- `cup`, `pt` (pints), `qt` (quarts), `gal` (gallons)

**Time:**
- `ms` (milliseconds), `s` (seconds), `min` (minutes), `hr` (hours), `day` (days), `week` (weeks)

**Conversion Examples:**
```javascript
// Cooking measurements
convertUnits({
  value: 2,
  fromUnit: "cup",
  toUnit: "ml",
  category: "volume"
})

// International shipping
convertUnits({
  value: 5.5,
  fromUnit: "lb",
  toUnit: "kg", 
  category: "weight"
})

// Weather data
convertUnits({
  value: 25,
  fromUnit: "c",
  toUnit: "f",
  category: "temperature"
})

// Project timelines
convertUnits({
  value: 3,
  fromUnit: "week",
  toUnit: "day",
  category: "time"
})
```

## Common Use Cases

### Data Validation Service
```typescript
const validatorAgent = createAgent({
  name: 'DataValidator',
  description: 'Validates various data formats and inputs',
  instruction: 'Help validate user inputs and data integrity',
  model: 'gemini-pro'
})

validatorAgent.addTools({
  validateEmail,
  validateUrl,
  validateJson
})

// Usage examples:
// "Validate all email addresses in this user registration form"
// "Check if these API endpoints are properly formatted"
// "Verify this configuration file is valid JSON"
```

### Security Tools Agent
```typescript
const securityAgent = createAgent({
  name: 'SecurityHelper',
  description: 'Provides security and cryptographic functions',
  instruction: 'Help with password generation and security validation',
  model: 'gemini'
})

securityAgent.addTools({
  generatePassword,
  generateRandomNumber
})

// Usage examples:
// "Generate secure passwords for new user accounts"
// "Create random tokens for API authentication"
// "Generate secure session IDs"
```

### Calculator Agent
```typescript
const calculatorAgent = createAgent({
  name: 'Calculator',
  description: 'Performs mathematical calculations and conversions',
  instruction: 'Help with math problems and unit conversions',
  model: 'gemini'
})

calculatorAgent.addTools({
  calculateMath,
  convertUnits,
  generateRandomNumber
})

// Usage examples:
// "Calculate compound interest for my savings"
// "Convert recipe measurements from metric to imperial"
// "Generate random numbers for statistical sampling"
```

### Quality Assurance Agent
```typescript
const qaAgent = createAgent({
  name: 'QualityAssurance',
  description: 'Validates and tests data quality',
  instruction: 'Ensure data meets quality standards and validation rules',
  model: 'gemini-pro'
})

qaAgent.addTools({
  validateEmail,
  validateUrl,
  validateJson,
  generateRandomNumber
})

// Usage examples:
// "Validate all user inputs in this dataset"
// "Generate test data for quality assurance testing"
// "Check data integrity across all fields"
```

## Advanced Usage Patterns

### Custom Validation Workflows
```typescript
// Email domain validation
const validateEmailDomain = async (email, allowedDomains) => {
  const validation = await validateEmail({ email })
  
  if (!validation.isValid) {
    return validation
  }
  
  const domain = email.split('@')[1]
  const domainAllowed = allowedDomains.includes(domain)
  
  return {
    ...validation,
    domainAllowed,
    domain
  }
}

// Batch validation
const validateBatch = async (items, validationType) => {
  const results = []
  
  for (const item of items) {
    let result
    switch (validationType) {
      case 'email':
        result = await validateEmail({ email: item })
        break
      case 'url':
        result = await validateUrl({ url: item })
        break
      case 'json':
        result = await validateJson({ jsonString: item })
        break
    }
    
    results.push({ item, ...result })
  }
  
  return results
}
```

### Password Policy Enforcement
```typescript
const generateCompliantPassword = async (policy) => {
  const {
    minLength = 8,
    maxLength = 32,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSymbols = true,
    excludeSimilar = false
  } = policy
  
  return await generatePassword({
    length: Math.min(maxLength, Math.max(minLength, 16)),
    includeUppercase: requireUppercase,
    includeLowercase: requireLowercase,
    includeNumbers: requireNumbers,
    includeSymbols: requireSymbols,
    excludeSimilar
  })
}

// Corporate password policy
const corporatePassword = await generateCompliantPassword({
  minLength: 12,
  maxLength: 24,
  requireSymbols: true,
  excludeSimilar: true
})
```

### Mathematical Calculations
```typescript
// Statistical calculations
const calculateStatistics = async (numbers) => {
  const sum = await calculateMath({ 
    expression: numbers.join(' + ') 
  })
  
  const mean = await calculateMath({
    expression: `${sum.result} / ${numbers.length}`,
    precision: 4
  })
  
  return {
    sum: sum.result,
    mean: mean.result,
    count: numbers.length
  }
}

// Financial calculations
const calculateCompoundInterest = async (principal, rate, time, compound) => {
  const expression = `${principal} * (1 + ${rate}/100/${compound})**(${compound}*${time})`
  
  return await calculateMath({
    expression,
    precision: 2
  })
}
```

### Unit Conversion Chains
```typescript
// Multi-step conversions
const convertChain = async (value, conversions) => {
  let currentValue = value
  const steps = []
  
  for (const conversion of conversions) {
    const result = await convertUnits({
      value: currentValue,
      fromUnit: conversion.from,
      toUnit: conversion.to,
      category: conversion.category
    })
    
    steps.push(result)
    currentValue = result.result
  }
  
  return {
    originalValue: value,
    finalValue: currentValue,
    steps
  }
}

// Example: Convert 5 feet to centimeters
const result = await convertChain(5, [
  { from: 'ft', to: 'in', category: 'length' },  // feet to inches
  { from: 'in', to: 'cm', category: 'length' }   // inches to centimeters
])
```

## Security Considerations

### Password Generation Security
- Uses cryptographically secure random number generation
- Configurable complexity requirements
- Entropy calculation for strength assessment
- Character exclusion for readability/compatibility

### Validation Security
- Input sanitization for mathematical expressions
- URL validation prevents malicious URLs
- JSON validation prevents code injection
- Email validation handles edge cases safely

### Random Number Security
- Cryptographically secure randomness
- No predictable patterns
- Suitable for security tokens and IDs
- Proper entropy for cryptographic applications

## Performance Considerations

### Efficient Validation
```typescript
// Cache validation results for repeated checks
const validationCache = new Map()

const cachedValidateEmail = async (email) => {
  if (validationCache.has(email)) {
    return validationCache.get(email)
  }
  
  const result = await validateEmail({ email })
  validationCache.set(email, result)
  return result
}

// Batch processing for large datasets
const validateLargeDataset = async (emails) => {
  const batchSize = 100
  const results = []
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(email => validateEmail({ email }))
    )
    results.push(...batchResults)
  }
  
  return results
}
```

### Mathematical Performance
```typescript
// Optimize complex calculations
const optimizedCalculation = async (expression) => {
  // Pre-validate expression
  if (!/^[0-9+\-*/().,\s]+$/.test(expression)) {
    throw new Error('Invalid characters in expression')
  }
  
  // Use appropriate precision
  const precision = expression.includes('.') ? 6 : 0
  
  return await calculateMath({
    expression,
    precision
  })
}
```

## Error Handling Best Practices

### Graceful Degradation
```typescript
const safeValidation = async (value, type) => {
  try {
    switch (type) {
      case 'email':
        return await validateEmail({ email: value })
      case 'url':
        return await validateUrl({ url: value })
      default:
        throw new Error('Unknown validation type')
    }
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      value
    }
  }
}

// Fallback for critical calculations
const safeCalculation = async (expression) => {
  try {
    return await calculateMath({ expression })
  } catch (error) {
    // Fallback to basic evaluation
    return {
      expression,
      result: 'Error: Cannot calculate',
      error: error.message
    }
  }
}
```

## Integration Examples

### Form Validation System
```typescript
const formValidator = createAgent({
  name: 'FormValidator',
  description: 'Validates form inputs and user data',
  instruction: 'Validate user form submissions and provide feedback',
  model: 'gemini'
})

formValidator.addTools({
  validateEmail,
  validateUrl,
  generatePassword
})

// Validate registration form
// Generate temporary passwords
// Check URL validity for profile links
```

### Scientific Calculator
```typescript
const scientificCalculator = createAgent({
  name: 'ScientificCalculator',
  description: 'Performs advanced mathematical calculations',
  instruction: 'Solve complex mathematical problems and unit conversions',
  model: 'gemini-pro'
})

scientificCalculator.addTools({
  calculateMath,
  convertUnits,
  generateRandomNumber
})

// Complex mathematical expressions
// Unit conversions for scientific data
// Random sampling for experiments
```