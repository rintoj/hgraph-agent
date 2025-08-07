import { createHash } from 'node:crypto'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const parseJson = createTool({
  description: 'Parses JSON string and optionally extracts specific properties',
  parameters: z.object({
    jsonString: z.string().describe('JSON string to parse'),
    path: z.string().optional().describe('Optional dot notation path to extract specific property (e.g., "user.name")'),
    pretty: z.boolean().default(false).describe('Format output as pretty JSON'),
  }),
  run: async ({ jsonString, path, pretty }) => {
    try {
      const parsed = JSON.parse(jsonString)
      
      let result = parsed
      if (path) {
        const keys = path.split('.')
        for (const key of keys) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key]
          } else {
            throw new Error(`Property '${path}' not found in JSON`)
          }
        }
      }
      
      return pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`JSON parsing failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const parseCsv = createTool({
  description: 'Parses CSV string into JSON format',
  parameters: z.object({
    csvString: z.string().describe('CSV string to parse'),
    delimiter: z.string().default(',').describe('CSV delimiter character'),
    hasHeader: z.boolean().default(true).describe('Whether the first row contains headers'),
    maxRows: z.number().min(1).max(1000).default(100).describe('Maximum number of rows to process'),
  }),
  run: async ({ csvString, delimiter, hasHeader, maxRows }) => {
    try {
      const lines = csvString.trim().split('\n').slice(0, maxRows)
      if (lines.length === 0) {
        return '[]'
      }

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        
        result.push(current.trim())
        return result
      }

      const rows = lines.map(parseCSVLine)
      
      if (hasHeader && rows.length > 1) {
        const headers = rows[0]
        const data = rows.slice(1).map(row => {
          const obj: Record<string, string> = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
        return JSON.stringify(data, null, 2)
      } else {
        return JSON.stringify(rows, null, 2)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`CSV parsing failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const hashText = createTool({
  description: 'Generates hash of text using various algorithms',
  parameters: z.object({
    text: z.string().describe('Text to hash'),
    algorithm: z.enum(['md5', 'sha1', 'sha256', 'sha512']).default('sha256').describe('Hash algorithm to use'),
    encoding: z.enum(['hex', 'base64']).default('hex').describe('Output encoding'),
  }),
  run: async ({ text, algorithm, encoding }) => {
    try {
      const hash = createHash(algorithm)
      hash.update(text, 'utf8')
      return hash.digest(encoding)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Hashing failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const base64Encode = createTool({
  description: 'Encodes text to Base64',
  parameters: z.object({
    text: z.string().describe('Text to encode'),
  }),
  run: async ({ text }) => {
    try {
      return Buffer.from(text, 'utf8').toString('base64')
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Base64 encoding failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const base64Decode = createTool({
  description: 'Decodes Base64 text',
  parameters: z.object({
    base64Text: z.string().describe('Base64 text to decode'),
  }),
  run: async ({ base64Text }) => {
    try {
      return Buffer.from(base64Text, 'base64').toString('utf8')
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Base64 decoding failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const urlEncode = createTool({
  description: 'URL encodes text',
  parameters: z.object({
    text: z.string().describe('Text to URL encode'),
  }),
  run: async ({ text }) => {
    return encodeURIComponent(text)
  },
})

export const urlDecode = createTool({
  description: 'URL decodes text',
  parameters: z.object({
    encodedText: z.string().describe('URL encoded text to decode'),
  }),
  run: async ({ encodedText }) => {
    try {
      return decodeURIComponent(encodedText)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`URL decoding failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const generateUuid = createTool({
  description: 'Generates a UUID (v4)',
  parameters: z.object({
    count: z.number().min(1).max(100).default(1).describe('Number of UUIDs to generate'),
  }),
  run: async ({ count }) => {
    try {
      const { randomUUID } = await import('node:crypto')
      const uuids = Array.from({ length: count }, () => randomUUID())
      return count === 1 ? uuids[0] : uuids.join('\n')
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`UUID generation failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const textSearch = createTool({
  description: 'Searches for patterns in text using regular expressions',
  parameters: z.object({
    text: z.string().describe('Text to search in'),
    pattern: z.string().describe('Regular expression pattern to search for'),
    flags: z.string().default('gi').describe('Regex flags (g=global, i=ignoreCase, m=multiline)'),
    maxMatches: z.number().min(1).max(1000).default(100).describe('Maximum number of matches to return'),
  }),
  run: async ({ text, pattern, flags, maxMatches }) => {
    try {
      const regex = new RegExp(pattern, flags)
      const matches = []
      let match
      let count = 0
      
      while ((match = regex.exec(text)) !== null && count < maxMatches) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
        })
        count++
        
        if (!flags.includes('g')) {
          break
        }
      }
      
      return JSON.stringify(matches, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Text search failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const textReplace = createTool({
  description: 'Replaces patterns in text using regular expressions',
  parameters: z.object({
    text: z.string().describe('Text to perform replacements on'),
    pattern: z.string().describe('Regular expression pattern to replace'),
    replacement: z.string().describe('Replacement text (can use $1, $2 for capture groups)'),
    flags: z.string().default('g').describe('Regex flags (g=global, i=ignoreCase, m=multiline)'),
  }),
  run: async ({ text, pattern, replacement, flags }) => {
    try {
      const regex = new RegExp(pattern, flags)
      return text.replace(regex, replacement)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Text replacement failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const slugify = createTool({
  description: 'Converts text to a URL-friendly slug',
  parameters: z.object({
    text: z.string().describe('Text to convert to slug'),
    separator: z.string().default('-').describe('Separator character to use'),
    lowercase: z.boolean().default(true).describe('Convert to lowercase'),
  }),
  run: async ({ text, separator, lowercase }) => {
    try {
      let result = text
        .normalize('NFD') // Normalize unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, separator) // Replace spaces with separator
        .replace(new RegExp(`\\${separator}+`, 'g'), separator) // Remove duplicate separators
        .replace(new RegExp(`^\\${separator}|\\${separator}$`, 'g'), '') // Remove leading/trailing separators
      
      return lowercase ? result.toLowerCase() : result
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Slugify failed: ${error.message}`)
      }
      throw error
    }
  },
})