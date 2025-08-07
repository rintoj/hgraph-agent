import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { homedir, tmpdir, userInfo } from 'node:os'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

async function execCommand(command: string, workingDirectory?: string, timeout: number = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = command.split(' ')
    const child = spawn(args[0], args.slice(1), { 
      cwd: workingDirectory, 
      stdio: 'pipe',
      shell: true 
    })
    
    let stdout = ''
    let stderr = ''
    
    const timeoutId = setTimeout(() => {
      child.kill()
      reject(new Error(`Command timeout after ${timeout}ms`))
    }, timeout)
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })
    
    child.on('close', (exitCode) => {
      clearTimeout(timeoutId)
      if (exitCode !== 0 && stderr) {
        reject(new Error(`Command failed: ${stderr}`))
      } else {
        resolve(stdout || 'Command executed successfully')
      }
    })
    
    child.on('error', (error) => {
      clearTimeout(timeoutId)
      reject(error)
    })
  })
}

export const executeCommand = createTool({
  description: 'Executes a system command and returns the output',
  parameters: z.object({
    command: z.string().describe('Command to execute'),
    workingDirectory: z.string().optional().describe('Working directory for command execution'),
    timeout: z.number().min(1000).max(300000).default(30000).describe('Timeout in milliseconds'),
  }),
  run: async ({ command, workingDirectory, timeout }) => {
    try {
      const result = await execCommand(command, workingDirectory, timeout)
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error executing command: ${error.message}`)
      }
      throw error
    }
  },
})

export const getEnvironmentVariable = createTool({
  description: 'Gets the value of an environment variable',
  parameters: z.object({
    variableName: z.string().describe('Name of the environment variable'),
    defaultValue: z.string().optional().describe('Default value if variable is not set'),
  }),
  run: async ({ variableName, defaultValue }) => {
    const value = process.env[variableName]
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw new Error(`Environment variable ${variableName} is not set`)
    }
    return value
  },
})

export const getCurrentDirectory = createTool({
  description: 'Gets the current working directory',
  parameters: z.object({}),
  run: async () => {
    return process.cwd()
  },
})

export const checkFileExists = createTool({
  description: 'Checks if a file or directory exists',
  parameters: z.object({
    path: z.string().describe('Path to check'),
  }),
  run: async ({ path }) => {
    try {
      await fs.access(path)
      return 'exists'
    } catch (error) {
      return 'does not exist'
    }
  },
})

export const createDirectory = createTool({
  description: 'Creates a directory (and parent directories if needed)',
  parameters: z.object({
    path: z.string().describe('Directory path to create'),
    recursive: z.boolean().default(true).describe('Create parent directories if they do not exist'),
  }),
  run: async ({ path, recursive }) => {
    try {
      await fs.mkdir(path, { recursive })
      return `Directory created: ${path}`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error creating directory: ${error.message}`)
      }
      throw error
    }
  },
})

export const deleteFile = createTool({
  description: 'Deletes a file or directory',
  parameters: z.object({
    path: z.string().describe('Path to delete'),
    recursive: z.boolean().default(false).describe('Delete directories recursively'),
    force: z.boolean().default(false).describe('Force deletion without prompts'),
  }),
  run: async ({ path, recursive, force }) => {
    try {
      const args = ['rm']
      if (recursive) args.push('-r')
      if (force) args.push('-f')
      args.push(path)
      
      const command = args.join(' ')
      await execCommand(command)
      
      return `Deleted: ${path}`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error deleting file: ${error.message}`)
      }
      throw error
    }
  },
})

export const copyFile = createTool({
  description: 'Copies a file or directory to a new location',
  parameters: z.object({
    source: z.string().describe('Source path'),
    destination: z.string().describe('Destination path'),
    recursive: z.boolean().default(false).describe('Copy directories recursively'),
    preserveAttributes: z.boolean().default(false).describe('Preserve file attributes'),
  }),
  run: async ({ source, destination, recursive, preserveAttributes }) => {
    try {
      const args = ['cp']
      if (recursive) args.push('-r')
      if (preserveAttributes) args.push('-p')
      args.push(source, destination)
      
      const command = args.join(' ')
      await execCommand(command)
      
      return `Copied ${source} to ${destination}`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error copying file: ${error.message}`)
      }
      throw error
    }
  },
})

export const moveFile = createTool({
  description: 'Moves or renames a file or directory',
  parameters: z.object({
    source: z.string().describe('Source path'),
    destination: z.string().describe('Destination path'),
  }),
  run: async ({ source, destination }) => {
    try {
      await execCommand(`mv "${source}" "${destination}"`)
      
      return `Moved ${source} to ${destination}`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error moving file: ${error.message}`)
      }
      throw error
    }
  },
})

export const getFileInfo = createTool({
  description: 'Gets detailed information about a file or directory',
  parameters: z.object({
    path: z.string().describe('Path to get information for'),
  }),
  run: async ({ path }) => {
    try {
      const result = await execCommand(`ls -la "${path}"`)
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting file info: ${error.message}`)
      }
      throw error
    }
  },
})

export const findFiles = createTool({
  description: 'Finds files matching a pattern in a directory',
  parameters: z.object({
    directory: z.string().describe('Directory to search in'),
    pattern: z.string().describe('File pattern to search for (e.g., "*.ts", "README*")'),
    recursive: z.boolean().default(true).describe('Search recursively in subdirectories'),
    maxDepth: z.number().min(1).max(10).default(5).describe('Maximum depth for recursive search'),
  }),
  run: async ({ directory, pattern, recursive, maxDepth }) => {
    try {
      const args = ['find', directory]
      if (!recursive) args.push('-maxdepth', '1')
      else args.push('-maxdepth', maxDepth.toString())
      args.push('-name', pattern, '-type', 'f')
      
      const command = args.join(' ')
      const result = await execCommand(command)
      
      const files = result.trim().split('\n').filter(Boolean)
      return files.length > 0 ? files.join('\n') : 'No files found'
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error finding files: ${error.message}`)
      }
      throw error
    }
  },
})

export const getCurrentUser = createTool({
  description: 'Gets information about the current system user',
  parameters: z.object({}),
  run: async () => {
    try {
      const user = userInfo()
      return JSON.stringify({
        username: user.username,
        uid: user.uid,
        gid: user.gid,
        homedir: user.homedir,
        shell: user.shell || 'unknown'
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting user info: ${error.message}`)
      }
      throw error
    }
  },
})

export const getHomeDirectory = createTool({
  description: 'Gets the current user\'s home directory path',
  parameters: z.object({}),
  run: async () => {
    return homedir()
  },
})

export const getTempDirectory = createTool({
  description: 'Gets the system temporary directory path',
  parameters: z.object({}),
  run: async () => {
    return tmpdir()
  },
})

export const listEnvironmentVariables = createTool({
  description: 'Lists all environment variables or filters by pattern',
  parameters: z.object({
    pattern: z.string().optional().describe('Optional pattern to filter environment variable names'),
    showValues: z.boolean().default(false).describe('Whether to show values (false shows only names)'),
  }),
  run: async ({ pattern, showValues }) => {
    try {
      const env = process.env
      const entries = Object.entries(env)
      
      let filteredEntries = entries
      if (pattern) {
        const regex = new RegExp(pattern, 'i')
        filteredEntries = entries.filter(([key]) => regex.test(key))
      }
      
      if (filteredEntries.length === 0) {
        return pattern ? `No environment variables found matching pattern: ${pattern}` : 'No environment variables found'
      }
      
      if (showValues) {
        return filteredEntries
          .map(([key, value]) => `${key}=${value}`)
          .join('\n')
      } else {
        return filteredEntries
          .map(([key]) => key)
          .join('\n')
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error listing environment variables: ${error.message}`)
      }
      throw error
    }
  },
})

export const setEnvironmentVariable = createTool({
  description: 'Sets an environment variable for the current process (temporary)',
  parameters: z.object({
    name: z.string().describe('Name of the environment variable'),
    value: z.string().describe('Value to set'),
  }),
  run: async ({ name, value }) => {
    try {
      process.env[name] = value
      return `Environment variable ${name} set successfully`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error setting environment variable: ${error.message}`)
      }
      throw error
    }
  },
})

export const getSystemInfo = createTool({
  description: 'Gets general system information',
  parameters: z.object({}),
  run: async () => {
    try {
      const os = await import('node:os')
      const info = {
        platform: os.platform(),
        architecture: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpuCount: os.cpus().length,
        homeDirectory: homedir(),
        tempDirectory: tmpdir(),
        currentUser: userInfo().username
      }
      return JSON.stringify(info, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting system info: ${error.message}`)
      }
      throw error
    }
  },
})

export const getProcessInfo = createTool({
  description: 'Gets information about the current Node.js process',
  parameters: z.object({}),
  run: async () => {
    try {
      const info = {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        cwd: process.cwd(),
        execPath: process.execPath
      }
      return JSON.stringify(info, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting process info: ${error.message}`)
      }
      throw error
    }
  },
})