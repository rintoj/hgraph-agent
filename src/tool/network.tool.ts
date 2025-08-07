import { promises as fs } from 'node:fs'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const httpRequest = createTool({
  description: 'Makes HTTP requests to URLs with various methods and options',
  parameters: z.object({
    url: z.string().url().describe('URL to make the request to'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET').describe('HTTP method'),
    headers: z.record(z.string(), z.string()).optional().describe('HTTP headers as key-value pairs'),
    body: z.string().optional().describe('Request body (for POST, PUT, PATCH)'),
    timeout: z.number().min(1000).max(60000).default(10000).describe('Request timeout in milliseconds'),
  }),
  run: async ({ url, method, headers = {}, body, timeout }) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const requestOptions: RequestInit = {
        method,
        headers: {
          'User-Agent': '@hgraph/agent',
          ...headers,
        },
        signal: controller.signal,
      }

      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        requestOptions.body = body
        if (!headers['Content-Type']) {
          requestOptions.headers = {
            ...requestOptions.headers,
            'Content-Type': 'application/json',
          }
        }
      }

      const response = await fetch(url, requestOptions)
      clearTimeout(timeoutId)

      const responseText = await response.text()
      
      return JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`HTTP request failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const downloadFile = createTool({
  description: 'Downloads a file from a URL and saves it to the local filesystem',
  parameters: z.object({
    url: z.string().url().describe('URL of the file to download'),
    filePath: z.string().describe('Local file path where the file should be saved'),
    timeout: z.number().min(1000).max(300000).default(30000).describe('Download timeout in milliseconds'),
  }),
  run: async ({ url, filePath, timeout }) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': '@hgraph/agent',
        },
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      await fs.writeFile(filePath, new Uint8Array(buffer))

      return `File downloaded successfully: ${filePath} (${buffer.byteLength} bytes)`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Download failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const checkUrlStatus = createTool({
  description: 'Checks if a URL is accessible and returns status information',
  parameters: z.object({
    url: z.string().url().describe('URL to check'),
    timeout: z.number().min(1000).max(30000).default(10000).describe('Request timeout in milliseconds'),
  }),
  run: async ({ url, timeout }) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const start = Date.now()
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': '@hgraph/agent',
        },
      })
      const responseTime = Date.now() - start

      clearTimeout(timeoutId)

      return JSON.stringify({
        url,
        status: response.status,
        statusText: response.statusText,
        accessible: response.ok,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      }, null, 2)
    } catch (error) {
      return JSON.stringify({
        url,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2)
    }
  },
})

export const getPublicIP = createTool({
  description: 'Gets the public IP address of the current machine',
  parameters: z.object({
    provider: z.enum(['ipify', 'httpbin', 'icanhazip']).default('ipify').describe('IP service provider to use'),
  }),
  run: async ({ provider }) => {
    const providers = {
      ipify: 'https://api.ipify.org?format=json',
      httpbin: 'https://httpbin.org/ip',
      icanhazip: 'https://icanhazip.com',
    }

    try {
      const response = await fetch(providers[provider], {
        headers: {
          'User-Agent': '@hgraph/agent',
        },
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.text()
      
      if (provider === 'icanhazip') {
        return data.trim()
      } else {
        const json = JSON.parse(data)
        return json.ip || json.origin || 'Could not parse IP'
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get public IP: ${error.message}`)
      }
      throw error
    }
  },
})