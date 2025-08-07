import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const readFile = createTool({
  description: 'Reads and returns the full text content of a specified file.',
  parameters: z.object({
    filePath: z
      .string()
      .describe('Absolute path to the file whose contents should be read and returned.'),
  }),
  run: async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error reading file at ${filePath}: ${error.message}`)
      }
      throw error
    }
  },
})

export const writeFile = createTool({
  description:
    'Writes the provided text content to a specified file, creating or overwriting it as needed.',
  parameters: z.object({
    filePath: z.string().describe('Absolute path to the file where the content should be written.'),
    content: z
      .string()
      .describe('Text content to write into the file. Existing content will be replaced.'),
  }),
  run: async ({ filePath, content }) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return 'Completed writing file successfully.'
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error writing file at ${filePath}: ${error.message}`)
      }
      throw error
    }
  },
})

export const listDirectory = createTool({
  description: 'Lists the contents of a specified directory.',
  parameters: z.object({
    directoryPath: z.string().describe('Absolute path to the directory to list'),
    recursive: z.boolean().default(false).describe('List files recursively in subdirectories'),
  }),
  run: async ({ directoryPath, recursive = false }) => {
    try {
      const listFiles = async (dir: string, isRecursive: boolean): Promise<string[]> => {
        const items = await fs.readdir(dir, { withFileTypes: true })
        const files: string[] = []
        
        for (const item of items) {
          const fullPath = join(dir, item.name)
          if (item.isFile()) {
            files.push(fullPath)
          } else if (item.isDirectory() && isRecursive) {
            const subFiles = await listFiles(fullPath, true)
            files.push(...subFiles)
          } else if (item.isDirectory()) {
            files.push(`${fullPath}/`)
          }
        }
        return files
      }

      const files = await listFiles(directoryPath, recursive)
      if (files.length === 0) {
        return `No files found in directory: ${directoryPath}`
      }
      return files.join('\n')
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error reading directory at ${directoryPath}: ${error.message}`)
      }
      throw error
    }
  },
})

const fileTools = {
  readFile,
  writeFile,
  listDirectory,
}
export default fileTools
