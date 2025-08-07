import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const gitStatus = createTool({
  description: 'Shows the working tree status of a git repository',
  parameters: z.object({
    repositoryPath: z.string().describe('Path to the git repository directory'),
  }),
  run: async ({ repositoryPath }) => {
    try {
      const proc = Bun.spawn(['git', 'status', '--porcelain'], {
        cwd: repositoryPath,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      
      if (stderr) {
        throw new Error(stderr)
      }
      
      if (!stdout.trim()) {
        return 'Working tree is clean'
      }
      
      return `Git status:\n${stdout}`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting git status: ${error.message}`)
      }
      throw error
    }
  },
})

export const gitAdd = createTool({
  description: 'Adds files to the git staging area',
  parameters: z.object({
    repositoryPath: z.string().describe('Path to the git repository directory'),
    files: z.array(z.string()).describe('Array of file paths to add to staging'),
  }),
  run: async ({ repositoryPath, files }) => {
    try {
      const proc = Bun.spawn(['git', 'add', ...files], {
        cwd: repositoryPath,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      
      const stderr = await new Response(proc.stderr).text()
      
      if (stderr) {
        throw new Error(stderr)
      }
      
      return `Added ${files.length} file(s) to staging: ${files.join(', ')}`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error adding files to git: ${error.message}`)
      }
      throw error
    }
  },
})

export const gitCommit = createTool({
  description: 'Creates a git commit with the specified message',
  parameters: z.object({
    repositoryPath: z.string().describe('Path to the git repository directory'),
    message: z.string().describe('Commit message'),
    addAll: z.boolean().default(false).describe('Add all changes before committing'),
  }),
  run: async ({ repositoryPath, message, addAll }) => {
    try {
      // Add all changes if requested
      if (addAll) {
        const addProc = Bun.spawn(['git', 'add', '-A'], {
          cwd: repositoryPath,
          stdout: 'pipe',
          stderr: 'pipe',
        })
        
        const addStderr = await new Response(addProc.stderr).text()
        if (addStderr) {
          throw new Error(`Error adding files: ${addStderr}`)
        }
      }
      
      // Create commit
      const proc = Bun.spawn(['git', 'commit', '-m', message], {
        cwd: repositoryPath,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      
      if (stderr && !stderr.includes('files changed')) {
        throw new Error(stderr)
      }
      
      return `Commit created: ${message}\n${stdout}`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error creating commit: ${error.message}`)
      }
      throw error
    }
  },
})

export const gitDiff = createTool({
  description: 'Shows differences between commits, commit and working tree, etc.',
  parameters: z.object({
    repositoryPath: z.string().describe('Path to the git repository directory'),
    file: z.string().optional().describe('Specific file to show diff for'),
    cached: z.boolean().default(false).describe('Show staged changes'),
  }),
  run: async ({ repositoryPath, file, cached }) => {
    try {
      const args = ['git', 'diff']
      if (cached) args.push('--cached')
      if (file) args.push(file)
      
      const proc = Bun.spawn(args, {
        cwd: repositoryPath,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      
      if (stderr) {
        throw new Error(stderr)
      }
      
      if (!stdout.trim()) {
        return 'No differences found'
      }
      
      return stdout
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting git diff: ${error.message}`)
      }
      throw error
    }
  },
})

export const gitLog = createTool({
  description: 'Shows commit history',
  parameters: z.object({
    repositoryPath: z.string().describe('Path to the git repository directory'),
    maxCount: z.number().min(1).max(100).default(10).describe('Maximum number of commits to show'),
    oneline: z.boolean().default(false).describe('Show commits in one line format'),
  }),
  run: async ({ repositoryPath, maxCount, oneline }) => {
    try {
      const args = ['git', 'log', `--max-count=${maxCount}`]
      if (oneline) args.push('--oneline')
      
      const proc = Bun.spawn(args, {
        cwd: repositoryPath,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      
      if (stderr) {
        throw new Error(stderr)
      }
      
      return stdout || 'No commits found'
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting git log: ${error.message}`)
      }
      throw error
    }
  },
})

export const gitBranch = createTool({
  description: 'Lists, creates, or deletes branches',
  parameters: z.object({
    repositoryPath: z.string().describe('Path to the git repository directory'),
    action: z.enum(['list', 'create', 'delete']).describe('Action to perform'),
    branchName: z.string().optional().describe('Branch name (required for create/delete)'),
  }),
  run: async ({ repositoryPath, action, branchName }) => {
    try {
      let args: string[]
      
      switch (action) {
        case 'list':
          args = ['git', 'branch', '-v']
          break
        case 'create':
          if (!branchName) throw new Error('Branch name required for create action')
          args = ['git', 'branch', branchName]
          break
        case 'delete':
          if (!branchName) throw new Error('Branch name required for delete action')
          args = ['git', 'branch', '-d', branchName]
          break
      }
      
      const proc = Bun.spawn(args, {
        cwd: repositoryPath,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      
      if (stderr && !stderr.includes('Deleted branch')) {
        throw new Error(stderr)
      }
      
      return stdout || `Branch ${action} completed`
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error with git branch: ${error.message}`)
      }
      throw error
    }
  },
})

export const gitPull = createTool({
  description: 'Fetches and merges changes from remote repository',
  parameters: z.object({
    repositoryPath: z.string().describe('Path to the git repository directory'),
    remote: z.string().default('origin').describe('Remote repository name'),
    branch: z.string().optional().describe('Branch to pull (defaults to current branch)'),
  }),
  run: async ({ repositoryPath, remote, branch }) => {
    try {
      const args = ['git', 'pull', remote]
      if (branch) args.push(branch)
      
      const proc = Bun.spawn(args, {
        cwd: repositoryPath,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      
      if (stderr && !stderr.includes('From ')) {
        throw new Error(stderr)
      }
      
      return stdout || 'Pull completed successfully'
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error pulling from remote: ${error.message}`)
      }
      throw error
    }
  },
})

export const gitPush = createTool({
  description: 'Updates remote repository with local commits',
  parameters: z.object({
    repositoryPath: z.string().describe('Path to the git repository directory'),
    remote: z.string().default('origin').describe('Remote repository name'),
    branch: z.string().optional().describe('Branch to push (defaults to current branch)'),
    force: z.boolean().default(false).describe('Force push (use with caution)'),
  }),
  run: async ({ repositoryPath, remote, branch, force }) => {
    try {
      const args = ['git', 'push', remote]
      if (branch) args.push(branch)
      if (force) args.push('--force')
      
      const proc = Bun.spawn(args, {
        cwd: repositoryPath,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      
      if (stderr && !stderr.includes('To ')) {
        throw new Error(stderr)
      }
      
      return stdout || 'Push completed successfully'
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error pushing to remote: ${error.message}`)
      }
      throw error
    }
  },
})