import z from 'zod'
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
      const content = await Bun.file(filePath).text()
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
      await Bun.file(filePath).write(content)
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
  description:
    'Lists the contents of a specified folder or matches files using a glob pattern. Returns file and/or directory paths.',
  parameters: z.object({
    folderPath: z
      .string()
      .describe(
        'Absolute path to the folder to list, or a glob pattern to match files/directories.',
      ),
    pattern: z
      .string()
      .default('**/*.*')
      .describe('Glob pattern to match files/directories. Defaults to "**/*.*".'),
    onlyFiles: z
      .boolean()
      .default(true)
      .describe(
        'If true, only file paths are returned (directories are excluded). Defaults to true.',
      ),
  }),
  run: async ({ folderPath, pattern, onlyFiles = true }) => {
    try {
      const glob = new Bun.Glob(`${folderPath}/${pattern}`)
      const outputIterator = glob.scan({ onlyFiles, followSymlinks: true })
      const output = []
      for await (const item of outputIterator) {
        output.push(item)
      }
      if (output.length === 0) {
        return `No files found in directory: ${folderPath}`
      }
      return output.join('\n')
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error reading folder at ${folderPath}: ${error.message}`)
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
