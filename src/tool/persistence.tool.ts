import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

// In-memory cache storage
const memoryCache = new Map<string, { value: any; expiry?: number }>()

// JSON Database tools
export const jsonDbRead = createTool({
  description: 'Reads data from a JSON database file, creating it if it does not exist',
  parameters: z.object({
    dbPath: z.string().describe('Path to the JSON database file'),
    key: z.string().optional().describe('Optional key path to read specific data (dot notation supported)'),
  }),
  run: async ({ dbPath, key }) => {
    try {
      // Create file if it doesn't exist
      try {
        await fs.access(dbPath)
      } catch {
        await fs.mkdir(dirname(dbPath), { recursive: true })
        await fs.writeFile(dbPath, '{}', 'utf-8')
      }

      const content = await fs.readFile(dbPath, 'utf-8')
      const data = JSON.parse(content)

      if (key) {
        const keys = key.split('.')
        let result = data
        for (const k of keys) {
          if (result && typeof result === 'object' && k in result) {
            result = result[k]
          } else {
            return JSON.stringify({ found: false, key, value: null }, null, 2)
          }
        }
        return JSON.stringify({ found: true, key, value: result }, null, 2)
      }

      return JSON.stringify(data, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read JSON database: ${error.message}`)
      }
      throw error
    }
  },
})

export const jsonDbWrite = createTool({
  description: 'Writes or updates data in a JSON database file',
  parameters: z.object({
    dbPath: z.string().describe('Path to the JSON database file'),
    key: z.string().optional().describe('Optional key path to write specific data (dot notation supported)'),
    value: z.string().describe('JSON string value to write'),
    merge: z.boolean().default(false).describe('Merge with existing data instead of replacing'),
  }),
  run: async ({ dbPath, key, value, merge }) => {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(dirname(dbPath), { recursive: true })

      let data: any = {}
      
      // Read existing data if file exists
      try {
        const content = await fs.readFile(dbPath, 'utf-8')
        data = JSON.parse(content)
      } catch {
        // File doesn't exist, start with empty object
      }

      const newValue = JSON.parse(value)

      if (key) {
        const keys = key.split('.')
        let current = data
        
        // Navigate to the parent of the target key
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i]
          if (!(k in current) || typeof current[k] !== 'object') {
            current[k] = {}
          }
          current = current[k]
        }

        const lastKey = keys[keys.length - 1]
        
        if (merge && typeof current[lastKey] === 'object' && typeof newValue === 'object') {
          current[lastKey] = { ...current[lastKey], ...newValue }
        } else {
          current[lastKey] = newValue
        }
      } else {
        if (merge && typeof data === 'object' && typeof newValue === 'object') {
          data = { ...data, ...newValue }
        } else {
          data = newValue
        }
      }

      await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8')

      return JSON.stringify({
        success: true,
        dbPath,
        key: key || 'root',
        operation: merge ? 'merge' : 'replace'
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to write to JSON database: ${error.message}`)
      }
      throw error
    }
  },
})

export const jsonDbDelete = createTool({
  description: 'Deletes a key from a JSON database file',
  parameters: z.object({
    dbPath: z.string().describe('Path to the JSON database file'),
    key: z.string().describe('Key path to delete (dot notation supported)'),
  }),
  run: async ({ dbPath, key }) => {
    try {
      const content = await fs.readFile(dbPath, 'utf-8')
      const data = JSON.parse(content)

      const keys = key.split('.')
      let current = data
      
      // Navigate to the parent of the target key
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        if (!(k in current) || typeof current[k] !== 'object') {
          return JSON.stringify({
            success: false,
            message: `Key path not found: ${key}`
          }, null, 2)
        }
        current = current[k]
      }

      const lastKey = keys[keys.length - 1]
      
      if (lastKey in current) {
        delete current[lastKey]
        await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8')
        
        return JSON.stringify({
          success: true,
          dbPath,
          deletedKey: key
        }, null, 2)
      } else {
        return JSON.stringify({
          success: false,
          message: `Key not found: ${key}`
        }, null, 2)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete from JSON database: ${error.message}`)
      }
      throw error
    }
  },
})

export const jsonDbQuery = createTool({
  description: 'Queries a JSON database with filtering and sorting',
  parameters: z.object({
    dbPath: z.string().describe('Path to the JSON database file'),
    collection: z.string().optional().describe('Collection/array to query within the database'),
    filter: z.string().optional().describe('JSON filter object to match items'),
    sort: z.string().optional().describe('Field to sort by (prefix with - for descending)'),
    limit: z.number().optional().describe('Maximum number of results to return'),
  }),
  run: async ({ dbPath, collection, filter, sort, limit }) => {
    try {
      const content = await fs.readFile(dbPath, 'utf-8')
      let data = JSON.parse(content)

      // Navigate to collection if specified
      if (collection) {
        const keys = collection.split('.')
        for (const key of keys) {
          if (data && typeof data === 'object' && key in data) {
            data = data[key]
          } else {
            return JSON.stringify({ results: [], count: 0, error: 'Collection not found' }, null, 2)
          }
        }
      }

      // Ensure we're working with an array
      let items = Array.isArray(data) ? data : [data]

      // Apply filter if provided
      if (filter) {
        const filterObj = JSON.parse(filter)
        items = items.filter(item => {
          for (const [key, value] of Object.entries(filterObj)) {
            if (item[key] !== value) return false
          }
          return true
        })
      }

      // Apply sorting if provided
      if (sort) {
        const descending = sort.startsWith('-')
        const sortField = descending ? sort.slice(1) : sort
        
        items.sort((a, b) => {
          const aVal = a[sortField]
          const bVal = b[sortField]
          
          if (aVal < bVal) return descending ? 1 : -1
          if (aVal > bVal) return descending ? -1 : 1
          return 0
        })
      }

      // Apply limit if provided
      if (limit && limit > 0) {
        items = items.slice(0, limit)
      }

      return JSON.stringify({
        results: items,
        count: items.length,
        collection: collection || 'root'
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to query JSON database: ${error.message}`)
      }
      throw error
    }
  },
})

// Cache tools
export const cacheSet = createTool({
  description: 'Sets a value in the in-memory cache with optional expiration',
  parameters: z.object({
    key: z.string().describe('Cache key'),
    value: z.string().describe('Value to cache (as JSON string)'),
    ttl: z.number().optional().describe('Time to live in seconds'),
  }),
  run: async ({ key, value, ttl }) => {
    try {
      const parsedValue = JSON.parse(value)
      const expiry = ttl ? Date.now() + (ttl * 1000) : undefined
      
      memoryCache.set(key, { value: parsedValue, expiry })
      
      return JSON.stringify({
        success: true,
        key,
        cached: true,
        expiry: expiry ? new Date(expiry).toISOString() : 'never',
        ttl: ttl || 'infinite'
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set cache: ${error.message}`)
      }
      throw error
    }
  },
})

export const cacheGet = createTool({
  description: 'Gets a value from the in-memory cache',
  parameters: z.object({
    key: z.string().describe('Cache key'),
  }),
  run: async ({ key }) => {
    try {
      const cached = memoryCache.get(key)
      
      if (!cached) {
        return JSON.stringify({
          found: false,
          key,
          value: null
        }, null, 2)
      }

      // Check if expired
      if (cached.expiry && Date.now() > cached.expiry) {
        memoryCache.delete(key)
        return JSON.stringify({
          found: false,
          key,
          value: null,
          expired: true
        }, null, 2)
      }

      return JSON.stringify({
        found: true,
        key,
        value: cached.value,
        expiry: cached.expiry ? new Date(cached.expiry).toISOString() : 'never'
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get from cache: ${error.message}`)
      }
      throw error
    }
  },
})

export const cacheDelete = createTool({
  description: 'Deletes a value from the in-memory cache',
  parameters: z.object({
    key: z.string().describe('Cache key to delete'),
  }),
  run: async ({ key }) => {
    try {
      const existed = memoryCache.has(key)
      memoryCache.delete(key)
      
      return JSON.stringify({
        success: true,
        key,
        existed
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete from cache: ${error.message}`)
      }
      throw error
    }
  },
})

export const cacheClear = createTool({
  description: 'Clears all values from the in-memory cache',
  parameters: z.object({}),
  run: async () => {
    try {
      const size = memoryCache.size
      memoryCache.clear()
      
      return JSON.stringify({
        success: true,
        cleared: size,
        message: `Cleared ${size} items from cache`
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to clear cache: ${error.message}`)
      }
      throw error
    }
  },
})

export const cacheList = createTool({
  description: 'Lists all keys in the in-memory cache',
  parameters: z.object({
    includeExpired: z.boolean().default(false).describe('Include expired entries'),
  }),
  run: async ({ includeExpired }) => {
    try {
      const keys: Array<{ key: string; expiry?: string; expired: boolean }> = []
      const now = Date.now()
      
      for (const [key, data] of memoryCache.entries()) {
        const expired = data.expiry ? now > data.expiry : false
        
        if (!expired || includeExpired) {
          keys.push({
            key,
            expiry: data.expiry ? new Date(data.expiry).toISOString() : undefined,
            expired
          })
        }
      }
      
      return JSON.stringify({
        keys,
        count: keys.length,
        totalSize: memoryCache.size
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list cache keys: ${error.message}`)
      }
      throw error
    }
  },
})

// File-based cache for persistence
export const fileCacheSet = createTool({
  description: 'Sets a value in file-based cache with optional expiration',
  parameters: z.object({
    cachePath: z.string().describe('Path to cache directory'),
    key: z.string().describe('Cache key'),
    value: z.string().describe('Value to cache (as JSON string)'),
    ttl: z.number().optional().describe('Time to live in seconds'),
  }),
  run: async ({ cachePath, key, value, ttl }) => {
    try {
      await fs.mkdir(cachePath, { recursive: true })
      
      const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_')
      const filePath = join(cachePath, `${safeKey}.cache`)
      
      const parsedValue = JSON.parse(value)
      const expiry = ttl ? Date.now() + (ttl * 1000) : undefined
      
      const cacheData = {
        key,
        value: parsedValue,
        expiry,
        created: Date.now()
      }
      
      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2), 'utf-8')
      
      return JSON.stringify({
        success: true,
        key,
        filePath,
        expiry: expiry ? new Date(expiry).toISOString() : 'never',
        ttl: ttl || 'infinite'
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set file cache: ${error.message}`)
      }
      throw error
    }
  },
})

export const fileCacheGet = createTool({
  description: 'Gets a value from file-based cache',
  parameters: z.object({
    cachePath: z.string().describe('Path to cache directory'),
    key: z.string().describe('Cache key'),
  }),
  run: async ({ cachePath, key }) => {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_')
      const filePath = join(cachePath, `${safeKey}.cache`)
      
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const cacheData = JSON.parse(content)
        
        // Check if expired
        if (cacheData.expiry && Date.now() > cacheData.expiry) {
          await fs.unlink(filePath)
          return JSON.stringify({
            found: false,
            key,
            value: null,
            expired: true
          }, null, 2)
        }
        
        return JSON.stringify({
          found: true,
          key,
          value: cacheData.value,
          expiry: cacheData.expiry ? new Date(cacheData.expiry).toISOString() : 'never',
          created: new Date(cacheData.created).toISOString()
        }, null, 2)
      } catch {
        return JSON.stringify({
          found: false,
          key,
          value: null
        }, null, 2)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get from file cache: ${error.message}`)
      }
      throw error
    }
  },
})

export const fileCacheDelete = createTool({
  description: 'Deletes a value from file-based cache',
  parameters: z.object({
    cachePath: z.string().describe('Path to cache directory'),
    key: z.string().describe('Cache key to delete'),
  }),
  run: async ({ cachePath, key }) => {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_')
      const filePath = join(cachePath, `${safeKey}.cache`)
      
      let existed = false
      try {
        await fs.unlink(filePath)
        existed = true
      } catch {
        // File didn't exist
      }
      
      return JSON.stringify({
        success: true,
        key,
        existed
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete from file cache: ${error.message}`)
      }
      throw error
    }
  },
})

export const fileCacheClear = createTool({
  description: 'Clears all values from file-based cache',
  parameters: z.object({
    cachePath: z.string().describe('Path to cache directory'),
  }),
  run: async ({ cachePath }) => {
    try {
      const files = await fs.readdir(cachePath)
      const cacheFiles = files.filter(f => f.endsWith('.cache'))
      
      for (const file of cacheFiles) {
        await fs.unlink(join(cachePath, file))
      }
      
      return JSON.stringify({
        success: true,
        cleared: cacheFiles.length,
        message: `Cleared ${cacheFiles.length} cache files`
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to clear file cache: ${error.message}`)
      }
      throw error
    }
  },
})