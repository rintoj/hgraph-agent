import { createReadStream, createWriteStream } from 'node:fs'
import { promises as fs } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGzip, createGunzip } from 'node:zlib'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const compressFile = createTool({
  description: 'Compresses a file using GZIP compression',
  parameters: z.object({
    inputPath: z.string().describe('Path to the file to compress'),
    outputPath: z.string().optional().describe('Output path for compressed file (defaults to input.gz)'),
  }),
  run: async ({ inputPath, outputPath }) => {
    try {
      const output = outputPath || `${inputPath}.gz`
      const input = createReadStream(inputPath)
      const gzip = createGzip({ level: 9 })
      const outputStream = createWriteStream(output)
      
      await pipeline(input, gzip, outputStream)
      
      const stats = await fs.stat(inputPath)
      const compressedStats = await fs.stat(output)
      const ratio = ((1 - compressedStats.size / stats.size) * 100).toFixed(2)
      
      return JSON.stringify({
        originalSize: stats.size,
        compressedSize: compressedStats.size,
        compressionRatio: `${ratio}%`,
        outputPath: output
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Compression failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const decompressFile = createTool({
  description: 'Decompresses a GZIP compressed file',
  parameters: z.object({
    inputPath: z.string().describe('Path to the compressed file'),
    outputPath: z.string().optional().describe('Output path for decompressed file'),
  }),
  run: async ({ inputPath, outputPath }) => {
    try {
      const output = outputPath || inputPath.replace(/\.gz$/, '')
      
      if (output === inputPath) {
        throw new Error('Cannot determine output filename, please specify outputPath')
      }
      
      const input = createReadStream(inputPath)
      const gunzip = createGunzip()
      const outputStream = createWriteStream(output)
      
      await pipeline(input, gunzip, outputStream)
      
      const stats = await fs.stat(output)
      
      return JSON.stringify({
        decompressedSize: stats.size,
        outputPath: output
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Decompression failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const createArchive = createTool({
  description: 'Creates a TAR archive from files and directories',
  parameters: z.object({
    sourcePaths: z.array(z.string()).describe('Array of file/directory paths to archive'),
    outputPath: z.string().describe('Output path for the archive'),
    compress: z.boolean().default(false).describe('Whether to compress with GZIP (.tar.gz)'),
  }),
  run: async ({ sourcePaths, outputPath, compress }) => {
    try {
      const { spawn } = await import('node:child_process')
      
      return new Promise((resolve, reject) => {
        const args = ['tar']
        
        if (compress) {
          args.push('-czf')
        } else {
          args.push('-cf')
        }
        
        args.push(outputPath, ...sourcePaths)
        
        const child = spawn(args[0], args.slice(1), { stdio: 'pipe' })
        
        let stderr = ''
        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })
        
        child.on('close', async (exitCode) => {
          if (exitCode !== 0) {
            reject(new Error(`Archive creation failed: ${stderr}`))
          } else {
            const stats = await fs.stat(outputPath)
            resolve(JSON.stringify({
              archivePath: outputPath,
              size: stats.size,
              compressed: compress,
              filesIncluded: sourcePaths.length
            }, null, 2))
          }
        })
        
        child.on('error', (error) => {
          reject(new Error(`Archive creation failed: ${error.message}`))
        })
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Archive creation failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const extractArchive = createTool({
  description: 'Extracts a TAR or TAR.GZ archive',
  parameters: z.object({
    archivePath: z.string().describe('Path to the archive file'),
    outputPath: z.string().optional().describe('Directory to extract to (defaults to current directory)'),
  }),
  run: async ({ archivePath, outputPath = '.' }) => {
    try {
      const { spawn } = await import('node:child_process')
      
      // Create output directory if it doesn't exist
      await fs.mkdir(outputPath, { recursive: true })
      
      return new Promise((resolve, reject) => {
        const args = ['tar']
        
        // Auto-detect compression
        if (archivePath.endsWith('.gz') || archivePath.endsWith('.tgz')) {
          args.push('-xzf')
        } else {
          args.push('-xf')
        }
        
        args.push(archivePath, '-C', outputPath)
        
        const child = spawn(args[0], args.slice(1), { stdio: 'pipe' })
        
        let stderr = ''
        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })
        
        child.on('close', (exitCode) => {
          if (exitCode !== 0) {
            reject(new Error(`Archive extraction failed: ${stderr}`))
          } else {
            resolve(JSON.stringify({
              archivePath,
              extractedTo: outputPath,
              success: true
            }, null, 2))
          }
        })
        
        child.on('error', (error) => {
          reject(new Error(`Archive extraction failed: ${error.message}`))
        })
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Archive extraction failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const listArchiveContents = createTool({
  description: 'Lists the contents of a TAR or TAR.GZ archive without extracting',
  parameters: z.object({
    archivePath: z.string().describe('Path to the archive file'),
  }),
  run: async ({ archivePath }) => {
    try {
      const { spawn } = await import('node:child_process')
      
      return new Promise((resolve, reject) => {
        const args = ['tar']
        
        // Auto-detect compression
        if (archivePath.endsWith('.gz') || archivePath.endsWith('.tgz')) {
          args.push('-tzf')
        } else {
          args.push('-tf')
        }
        
        args.push(archivePath)
        
        const child = spawn(args[0], args.slice(1), { stdio: 'pipe' })
        
        let stdout = ''
        let stderr = ''
        
        child.stdout?.on('data', (data) => {
          stdout += data.toString()
        })
        
        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })
        
        child.on('close', (exitCode) => {
          if (exitCode !== 0) {
            reject(new Error(`Failed to list archive contents: ${stderr}`))
          } else {
            const files = stdout.trim().split('\n').filter(Boolean)
            resolve(JSON.stringify({
              archivePath,
              fileCount: files.length,
              files: files.slice(0, 100), // Limit to first 100 for large archives
              truncated: files.length > 100
            }, null, 2))
          }
        })
        
        child.on('error', (error) => {
          reject(new Error(`Failed to list archive contents: ${error.message}`))
        })
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list archive contents: ${error.message}`)
      }
      throw error
    }
  },
})