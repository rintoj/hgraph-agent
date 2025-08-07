import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const validateEmail = createTool({
  description: 'Validates if a string is a valid email address',
  parameters: z.object({
    email: z.string().describe('Email address to validate'),
    strict: z.boolean().default(false).describe('Use strict validation (RFC 5322 compliant)'),
  }),
  run: async ({ email, strict }) => {
    try {
      const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      
      const regex = strict ? strictEmailRegex : basicEmailRegex
      const isValid = regex.test(email)
      
      return JSON.stringify({
        email,
        isValid,
        validationType: strict ? 'strict' : 'basic',
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Email validation failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const validateUrl = createTool({
  description: 'Validates if a string is a valid URL',
  parameters: z.object({
    url: z.string().describe('URL to validate'),
    protocols: z.array(z.string()).default(['http', 'https']).describe('Allowed protocols'),
  }),
  run: async ({ url, protocols }) => {
    try {
      let isValid = false
      let parsedUrl: URL | null = null
      let error: string | null = null
      
      try {
        parsedUrl = new URL(url)
        isValid = protocols.includes(parsedUrl.protocol.slice(0, -1)) // Remove trailing ':'
      } catch (e) {
        error = e instanceof Error ? e.message : 'Invalid URL format'
      }
      
      const result = {
        url,
        isValid,
        error,
        allowedProtocols: protocols,
      }
      
      if (parsedUrl) {
        Object.assign(result, {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          pathname: parsedUrl.pathname,
          search: parsedUrl.search,
          hash: parsedUrl.hash,
        })
      }
      
      return JSON.stringify(result, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`URL validation failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const validateJson = createTool({
  description: 'Validates if a string is valid JSON',
  parameters: z.object({
    jsonString: z.string().describe('JSON string to validate'),
    schema: z.string().optional().describe('Optional JSON schema to validate against'),
  }),
  run: async ({ jsonString, schema }) => {
    try {
      let isValid = false
      let parsed = null
      let error: string | null = null
      let schemaValid: boolean | null = null
      
      try {
        parsed = JSON.parse(jsonString)
        isValid = true
      } catch (e) {
        error = e instanceof Error ? e.message : 'Invalid JSON'
      }
      
      // Basic schema validation (simplified)
      if (isValid && schema) {
        try {
          const schemaObj = JSON.parse(schema)
          schemaValid = validateAgainstSchema(parsed, schemaObj)
        } catch (e) {
          error = `Schema validation error: ${e instanceof Error ? e.message : 'Invalid schema'}`
        }
      }
      
      return JSON.stringify({
        jsonString: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''),
        isValid,
        error,
        schemaValidation: schemaValid,
        type: parsed !== null ? typeof parsed : null,
        isArray: Array.isArray(parsed),
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`JSON validation failed: ${error.message}`)
      }
      throw error
    }
  },
})

function validateAgainstSchema(data: any, schema: any): boolean {
  // Very basic schema validation - would need a proper library for full JSON Schema support
  if (schema.type && typeof data !== schema.type) {
    return false
  }
  if (schema.required && typeof data === 'object') {
    for (const field of schema.required) {
      if (!(field in data)) {
        return false
      }
    }
  }
  return true
}

export const generatePassword = createTool({
  description: 'Generates a secure password with customizable options',
  parameters: z.object({
    length: z.number().min(4).max(128).default(16).describe('Password length'),
    includeUppercase: z.boolean().default(true).describe('Include uppercase letters'),
    includeLowercase: z.boolean().default(true).describe('Include lowercase letters'),
    includeNumbers: z.boolean().default(true).describe('Include numbers'),
    includeSymbols: z.boolean().default(true).describe('Include symbols'),
    excludeSimilar: z.boolean().default(false).describe('Exclude similar characters (0, O, l, 1, etc.)'),
  }),
  run: async ({ length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar }) => {
    try {
      let charset = ''
      
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const lowercase = 'abcdefghijklmnopqrstuvwxyz'
      const numbers = '0123456789'
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      
      const similar = '0O1lI'
      
      if (includeUppercase) charset += excludeSimilar ? uppercase.replace(/[OI]/g, '') : uppercase
      if (includeLowercase) charset += excludeSimilar ? lowercase.replace(/[l]/g, '') : lowercase
      if (includeNumbers) charset += excludeSimilar ? numbers.replace(/[01]/g, '') : numbers
      if (includeSymbols) charset += symbols
      
      if (charset === '') {
        throw new Error('At least one character type must be included')
      }
      
      const { randomBytes } = await import('node:crypto')
      const bytes = randomBytes(length)
      
      let password = ''
      for (let i = 0; i < length; i++) {
        password += charset[bytes[i] % charset.length]
      }
      
      // Calculate approximate entropy
      const entropy = Math.log2(charset.length) * length
      
      return JSON.stringify({
        password,
        length,
        entropy: Math.round(entropy * 100) / 100,
        strength: getPasswordStrength(entropy),
        settings: {
          includeUppercase,
          includeLowercase,
          includeNumbers,
          includeSymbols,
          excludeSimilar,
        }
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Password generation failed: ${error.message}`)
      }
      throw error
    }
  },
})

function getPasswordStrength(entropy: number): string {
  if (entropy < 30) return 'Very Weak'
  if (entropy < 50) return 'Weak'
  if (entropy < 70) return 'Fair'
  if (entropy < 90) return 'Strong'
  return 'Very Strong'
}

export const calculateMath = createTool({
  description: 'Performs mathematical calculations from expressions',
  parameters: z.object({
    expression: z.string().describe('Mathematical expression to calculate (e.g., "2 + 3 * 4")'),
    precision: z.number().min(0).max(15).default(10).describe('Decimal places for result'),
  }),
  run: async ({ expression, precision }) => {
    try {
      // Basic security: only allow numbers, operators, parentheses, and math functions
      const safeExpression = expression.replace(/[^0-9+\-*/().,\s]/g, '')
      
      if (safeExpression !== expression) {
        throw new Error('Expression contains invalid characters')
      }
      
      // Use Function constructor for safer evaluation than eval
      // Still not 100% safe, but better than direct eval
      const result = Function('"use strict"; return (' + safeExpression + ')')()
      
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Invalid mathematical expression')
      }
      
      return JSON.stringify({
        expression,
        result: Number(result.toFixed(precision)),
        resultString: result.toFixed(precision),
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Math calculation failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const generateRandomNumber = createTool({
  description: 'Generates random numbers with various options',
  parameters: z.object({
    min: z.number().default(0).describe('Minimum value (inclusive)'),
    max: z.number().default(100).describe('Maximum value (inclusive)'),
    count: z.number().min(1).max(1000).default(1).describe('Number of random numbers to generate'),
    decimals: z.number().min(0).max(10).default(0).describe('Number of decimal places (0 for integers)'),
    unique: z.boolean().default(false).describe('Ensure all generated numbers are unique'),
  }),
  run: async ({ min, max, count, decimals, unique }) => {
    try {
      if (min > max) {
        throw new Error('Minimum value cannot be greater than maximum value')
      }
      
      const numbers: number[] = []
      const range = max - min
      
      if (unique && decimals === 0 && count > (range + 1)) {
        throw new Error('Cannot generate more unique integers than available in range')
      }
      
      const { randomBytes } = await import('node:crypto')
      
      for (let i = 0; i < count; i++) {
        let num: number
        
        if (decimals === 0) {
          // Generate integer
          do {
            const bytes = randomBytes(4)
            const randomValue = bytes.readUInt32BE(0) / 0xFFFFFFFF
            num = Math.floor(randomValue * (range + 1)) + min
          } while (unique && numbers.includes(num))
        } else {
          // Generate decimal
          const bytes = randomBytes(4)
          const randomValue = bytes.readUInt32BE(0) / 0xFFFFFFFF
          num = Number((randomValue * range + min).toFixed(decimals))
        }
        
        numbers.push(num)
      }
      
      return JSON.stringify({
        numbers: count === 1 ? numbers[0] : numbers,
        count,
        range: { min, max },
        settings: { decimals, unique },
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Random number generation failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const convertUnits = createTool({
  description: 'Converts between different units of measurement',
  parameters: z.object({
    value: z.number().describe('Value to convert'),
    fromUnit: z.string().describe('Source unit'),
    toUnit: z.string().describe('Target unit'),
    category: z.enum(['length', 'weight', 'temperature', 'volume', 'time']).describe('Unit category'),
  }),
  run: async ({ value, fromUnit, toUnit, category }) => {
    try {
      let result: number
      
      switch (category) {
        case 'length':
          result = convertLength(value, fromUnit, toUnit)
          break
        case 'weight':
          result = convertWeight(value, fromUnit, toUnit)
          break
        case 'temperature':
          result = convertTemperature(value, fromUnit, toUnit)
          break
        case 'volume':
          result = convertVolume(value, fromUnit, toUnit)
          break
        case 'time':
          result = convertTime(value, fromUnit, toUnit)
          break
        default:
          throw new Error('Unsupported category')
      }
      
      return JSON.stringify({
        originalValue: value,
        fromUnit,
        toUnit,
        result: Math.round(result * 1000000) / 1000000, // Round to 6 decimal places
        category,
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Unit conversion failed: ${error.message}`)
      }
      throw error
    }
  },
})

// Unit conversion helper functions
function convertLength(value: number, from: string, to: string): number {
  const meters: Record<string, number> = {
    'mm': 0.001, 'cm': 0.01, 'm': 1, 'km': 1000,
    'in': 0.0254, 'ft': 0.3048, 'yd': 0.9144, 'mi': 1609.34
  }
  
  if (!meters[from] || !meters[to]) {
    throw new Error('Unsupported length unit')
  }
  
  return (value * meters[from]) / meters[to]
}

function convertWeight(value: number, from: string, to: string): number {
  const grams: Record<string, number> = {
    'mg': 0.001, 'g': 1, 'kg': 1000,
    'oz': 28.3495, 'lb': 453.592
  }
  
  if (!grams[from] || !grams[to]) {
    throw new Error('Unsupported weight unit')
  }
  
  return (value * grams[from]) / grams[to]
}

function convertTemperature(value: number, from: string, to: string): number {
  if (from === to) return value
  
  // Convert to Celsius first
  let celsius: number
  switch (from.toLowerCase()) {
    case 'c': case 'celsius': celsius = value; break
    case 'f': case 'fahrenheit': celsius = (value - 32) * 5/9; break
    case 'k': case 'kelvin': celsius = value - 273.15; break
    default: throw new Error('Unsupported temperature unit')
  }
  
  // Convert from Celsius to target
  switch (to.toLowerCase()) {
    case 'c': case 'celsius': return celsius
    case 'f': case 'fahrenheit': return celsius * 9/5 + 32
    case 'k': case 'kelvin': return celsius + 273.15
    default: throw new Error('Unsupported temperature unit')
  }
}

function convertVolume(value: number, from: string, to: string): number {
  const liters: Record<string, number> = {
    'ml': 0.001, 'l': 1,
    'cup': 0.236588, 'pt': 0.473176, 'qt': 0.946353, 'gal': 3.78541
  }
  
  if (!liters[from] || !liters[to]) {
    throw new Error('Unsupported volume unit')
  }
  
  return (value * liters[from]) / liters[to]
}

function convertTime(value: number, from: string, to: string): number {
  const seconds: Record<string, number> = {
    'ms': 0.001, 's': 1, 'min': 60, 'hr': 3600, 'day': 86400, 'week': 604800
  }
  
  if (!seconds[from] || !seconds[to]) {
    throw new Error('Unsupported time unit')
  }
  
  return (value * seconds[from]) / seconds[to]
}