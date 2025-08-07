import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const parseYaml = createTool({
  description: 'Parses YAML content to JSON',
  parameters: z.object({
    yamlContent: z.string().describe('YAML content to parse'),
  }),
  run: async ({ yamlContent }) => {
    try {
      // Simple YAML parser (basic implementation)
      // For production, consider using a library like js-yaml
      const lines = yamlContent.split('\n')
      const result: any = {}
      const stack: any[] = [result]
      const indentStack: number[] = [0]
      
      for (const line of lines) {
        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith('#')) continue
        
        const indent = line.length - line.trimStart().length
        const trimmed = line.trim()
        
        // Handle list items
        if (trimmed.startsWith('- ')) {
          const parent = stack[stack.length - 1]
          const value = trimmed.substring(2).trim()
          
          if (!Array.isArray(parent)) {
            throw new Error('List item without array context')
          }
          
          parent.push(value.includes(':') ? {} : value)
          if (value.includes(':')) {
            stack.push(parent[parent.length - 1])
            indentStack.push(indent)
          }
          continue
        }
        
        // Handle key-value pairs
        const colonIndex = trimmed.indexOf(':')
        if (colonIndex === -1) continue
        
        const key = trimmed.substring(0, colonIndex).trim()
        const value = trimmed.substring(colonIndex + 1).trim()
        
        // Adjust stack based on indentation
        while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
          stack.pop()
          indentStack.pop()
        }
        
        const parent = stack[stack.length - 1]
        
        if (!value) {
          // Empty value means nested object or array
          parent[key] = {}
          stack.push(parent[key])
          indentStack.push(indent)
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // Inline array
          parent[key] = value.slice(1, -1).split(',').map(v => v.trim())
        } else {
          // Simple value
          parent[key] = value.replace(/^["']|["']$/g, '') // Remove quotes
        }
      }
      
      return JSON.stringify(result, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse YAML: ${error.message}`)
      }
      throw error
    }
  },
})

export const generateYaml = createTool({
  description: 'Generates YAML content from JSON',
  parameters: z.object({
    jsonString: z.string().describe('JSON string to convert to YAML'),
    indent: z.number().default(2).describe('Number of spaces for indentation'),
  }),
  run: async ({ jsonString, indent }) => {
    try {
      const data = JSON.parse(jsonString)
      
      const toYaml = (obj: any, level: number = 0): string => {
        const spaces = ' '.repeat(level * indent)
        let yaml = ''
        
        if (Array.isArray(obj)) {
          for (const item of obj) {
            if (typeof item === 'object' && item !== null) {
              yaml += `${spaces}- \n`
              const subYaml = toYaml(item, level + 1)
              yaml += subYaml.split('\n').map(line => 
                line ? ' '.repeat(indent) + line : ''
              ).join('\n')
            } else {
              yaml += `${spaces}- ${item}\n`
            }
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
              yaml += `${spaces}${key}:\n`
              yaml += toYaml(value, level + 1)
            } else {
              yaml += `${spaces}${key}: ${value}\n`
            }
          }
        } else {
          yaml += `${spaces}${obj}\n`
        }
        
        return yaml
      }
      
      return toYaml(data)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate YAML: ${error.message}`)
      }
      throw error
    }
  },
})

export const createPackageJson = createTool({
  description: 'Creates a package.json file with standard fields',
  parameters: z.object({
    name: z.string().describe('Package name'),
    version: z.string().default('1.0.0').describe('Package version'),
    description: z.string().optional().describe('Package description'),
    main: z.string().default('index.js').describe('Entry point'),
    type: z.enum(['module', 'commonjs']).optional().describe('Module type'),
    scripts: z.string().optional().describe('JSON string of scripts'),
    dependencies: z.string().optional().describe('JSON string of dependencies'),
    devDependencies: z.string().optional().describe('JSON string of dev dependencies'),
    author: z.string().optional().describe('Author name'),
    license: z.string().default('MIT').describe('License type'),
    keywords: z.array(z.string()).optional().describe('Package keywords'),
    repository: z.string().optional().describe('Repository URL'),
  }),
  run: async ({ 
    name, version, description, main, type, scripts, 
    dependencies, devDependencies, author, license, keywords, repository 
  }) => {
    try {
      const packageJson: any = {
        name,
        version,
        description: description || '',
        main,
        type,
        scripts: scripts ? JSON.parse(scripts) : {
          test: 'echo "Error: no test specified" && exit 1'
        },
        keywords: keywords || [],
        author: author || '',
        license,
      }
      
      if (repository) {
        packageJson.repository = {
          type: 'git',
          url: repository
        }
      }
      
      if (dependencies) {
        packageJson.dependencies = JSON.parse(dependencies)
      }
      
      if (devDependencies) {
        packageJson.devDependencies = JSON.parse(devDependencies)
      }
      
      // Remove undefined fields
      Object.keys(packageJson).forEach(key => {
        if (packageJson[key] === undefined) {
          delete packageJson[key]
        }
      })
      
      return JSON.stringify(packageJson, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create package.json: ${error.message}`)
      }
      throw error
    }
  },
})

export const renderTemplate = createTool({
  description: 'Renders a template string with variable substitution',
  parameters: z.object({
    template: z.string().describe('Template string with {{variable}} placeholders'),
    variables: z.string().describe('JSON string of variables to substitute'),
    strict: z.boolean().default(false).describe('Throw error if variable not found'),
  }),
  run: async ({ template, variables, strict }) => {
    try {
      const vars = JSON.parse(variables)
      
      let rendered = template
      const placeholderRegex = /\{\{(\s*[\w.]+\s*)\}\}/g
      const matches = template.match(placeholderRegex) || []
      
      for (const match of matches) {
        const varName = match.replace(/\{\{|\}\}/g, '').trim()
        const keys = varName.split('.')
        
        let value = vars
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key]
          } else {
            if (strict) {
              throw new Error(`Variable not found: ${varName}`)
            }
            value = match // Keep original placeholder if not found
            break
          }
        }
        
        rendered = rendered.replace(match, String(value))
      }
      
      return rendered
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to render template: ${error.message}`)
      }
      throw error
    }
  },
})

export const generateGitignore = createTool({
  description: 'Generates a .gitignore file for common project types',
  parameters: z.object({
    projectType: z.enum(['node', 'python', 'java', 'go', 'rust', 'general']).describe('Type of project'),
    additional: z.array(z.string()).optional().describe('Additional patterns to ignore'),
  }),
  run: async ({ projectType, additional = [] }) => {
    try {
      const patterns: Record<string, string[]> = {
        general: [
          '# OS Files',
          '.DS_Store',
          'Thumbs.db',
          '*.swp',
          '*.swo',
          '*~',
          '',
          '# IDE Files',
          '.idea/',
          '.vscode/',
          '*.sublime-*',
          '',
          '# Logs',
          '*.log',
          'logs/',
          '',
          '# Environment',
          '.env',
          '.env.local',
          '.env.*.local',
        ],
        node: [
          '# Dependencies',
          'node_modules/',
          '',
          '# Build outputs',
          'dist/',
          'build/',
          '*.js.map',
          '',
          '# Package manager files',
          'package-lock.json',
          'yarn.lock',
          'pnpm-lock.yaml',
          '',
          '# Testing',
          'coverage/',
          '.nyc_output/',
          '',
          '# TypeScript',
          '*.tsbuildinfo',
        ],
        python: [
          '# Python',
          '__pycache__/',
          '*.py[cod]',
          '*$py.class',
          '*.so',
          '',
          '# Virtual Environment',
          'venv/',
          'env/',
          'ENV/',
          '.venv/',
          '',
          '# Distribution',
          'dist/',
          'build/',
          '*.egg-info/',
          '',
          '# Testing',
          '.pytest_cache/',
          '.coverage',
          'htmlcov/',
          '',
          '# Jupyter',
          '.ipynb_checkpoints/',
        ],
        java: [
          '# Compiled files',
          '*.class',
          '*.jar',
          '*.war',
          '*.ear',
          '',
          '# Build directories',
          'target/',
          'build/',
          'out/',
          '',
          '# Maven',
          'pom.xml.tag',
          'pom.xml.releaseBackup',
          '',
          '# Gradle',
          '.gradle/',
          'gradle-app.setting',
        ],
        go: [
          '# Binaries',
          '*.exe',
          '*.exe~',
          '*.dll',
          '*.so',
          '*.dylib',
          '',
          '# Test binary',
          '*.test',
          '',
          '# Output',
          '*.out',
          '',
          '# Vendor',
          'vendor/',
          '',
          '# Go workspace',
          'go.work',
        ],
        rust: [
          '# Rust',
          'target/',
          'Cargo.lock',
          '**/*.rs.bk',
          '*.pdb',
        ],
      }
      
      let content = patterns.general.join('\n') + '\n\n'
      
      if (projectType !== 'general' && patterns[projectType]) {
        content += `# ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} specific\n`
        content += patterns[projectType].join('\n') + '\n'
      }
      
      if (additional.length > 0) {
        content += '\n# Custom patterns\n'
        content += additional.join('\n') + '\n'
      }
      
      return content
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate .gitignore: ${error.message}`)
      }
      throw error
    }
  },
})

export const generateReadme = createTool({
  description: 'Generates a README.md file with standard sections',
  parameters: z.object({
    title: z.string().describe('Project title'),
    description: z.string().describe('Project description'),
    installation: z.string().optional().describe('Installation instructions'),
    usage: z.string().optional().describe('Usage examples'),
    features: z.array(z.string()).optional().describe('List of features'),
    requirements: z.array(z.string()).optional().describe('List of requirements'),
    contributing: z.boolean().default(false).describe('Include contributing section'),
    license: z.string().default('MIT').describe('License type'),
    author: z.string().optional().describe('Author name'),
  }),
  run: async ({ 
    title, description, installation, usage, features, 
    requirements, contributing, license, author 
  }) => {
    try {
      let readme = `# ${title}\n\n${description}\n\n`
      
      if (features && features.length > 0) {
        readme += '## Features\n\n'
        features.forEach(feature => {
          readme += `- ${feature}\n`
        })
        readme += '\n'
      }
      
      if (requirements && requirements.length > 0) {
        readme += '## Requirements\n\n'
        requirements.forEach(req => {
          readme += `- ${req}\n`
        })
        readme += '\n'
      }
      
      if (installation) {
        readme += '## Installation\n\n'
        readme += installation + '\n\n'
      }
      
      if (usage) {
        readme += '## Usage\n\n'
        readme += usage + '\n\n'
      }
      
      if (contributing) {
        readme += '## Contributing\n\n'
        readme += 'Contributions are welcome! Please feel free to submit a Pull Request.\n\n'
        readme += '1. Fork the repository\n'
        readme += '2. Create your feature branch (`git checkout -b feature/AmazingFeature`)\n'
        readme += '3. Commit your changes (`git commit -m "Add some AmazingFeature"`)\n'
        readme += '4. Push to the branch (`git push origin feature/AmazingFeature`)\n'
        readme += '5. Open a Pull Request\n\n'
      }
      
      readme += '## License\n\n'
      readme += `This project is licensed under the ${license} License`
      if (author) {
        readme += ` - see the LICENSE file for details.\n\n## Author\n\n${author}`
      } else {
        readme += '.'
      }
      
      return readme
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate README: ${error.message}`)
      }
      throw error
    }
  },
})

export const formatCode = createTool({
  description: 'Formats code with proper indentation',
  parameters: z.object({
    code: z.string().describe('Code to format'),
    language: z.enum(['javascript', 'typescript', 'python', 'json', 'html', 'css']).describe('Programming language'),
    indentSize: z.number().default(2).describe('Number of spaces for indentation'),
  }),
  run: async ({ code, language, indentSize }) => {
    try {
      const indent = ' '.repeat(indentSize)
      
      switch (language) {
        case 'json': {
          const parsed = JSON.parse(code)
          return JSON.stringify(parsed, null, indentSize)
        }
        
        case 'javascript':
        case 'typescript': {
          // Basic JS/TS formatting
          let formatted = code
          let level = 0
          const lines = formatted.split('\n')
          const formattedLines: string[] = []
          
          for (const line of lines) {
            const trimmed = line.trim()
            
            // Decrease indent for closing braces
            if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
              level = Math.max(0, level - 1)
            }
            
            // Add indentation
            if (trimmed) {
              formattedLines.push(indent.repeat(level) + trimmed)
            } else {
              formattedLines.push('')
            }
            
            // Increase indent for opening braces
            if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
              level++
            }
          }
          
          return formattedLines.join('\n')
        }
        
        case 'python': {
          // Basic Python formatting
          const lines = code.split('\n')
          const formattedLines: string[] = []
          let level = 0
          
          for (const line of lines) {
            const trimmed = line.trim()
            
            // Decrease indent for dedent keywords
            if (trimmed.startsWith('elif') || trimmed.startsWith('else') || 
                trimmed.startsWith('except') || trimmed.startsWith('finally')) {
              level = Math.max(0, level - 1)
              formattedLines.push(indent.repeat(level) + trimmed)
              if (trimmed.endsWith(':')) level++
            } else if (trimmed.startsWith('return') || trimmed.startsWith('break') || 
                       trimmed.startsWith('continue') || trimmed.startsWith('pass')) {
              formattedLines.push(indent.repeat(level) + trimmed)
              if (!trimmed.endsWith(':')) {
                level = Math.max(0, level - 1)
              }
            } else {
              if (trimmed) {
                formattedLines.push(indent.repeat(level) + trimmed)
              } else {
                formattedLines.push('')
              }
              
              // Increase indent for colon-ending lines
              if (trimmed.endsWith(':')) {
                level++
              }
            }
          }
          
          return formattedLines.join('\n')
        }
        
        case 'html': {
          // Basic HTML formatting
          const lines = code.split(/(<[^>]+>)/).filter(Boolean)
          const formattedLines: string[] = []
          let level = 0
          
          for (const part of lines) {
            if (part.startsWith('</')) {
              level = Math.max(0, level - 1)
              formattedLines.push(indent.repeat(level) + part)
            } else if (part.startsWith('<') && !part.startsWith('<!')) {
              formattedLines.push(indent.repeat(level) + part)
              if (!part.endsWith('/>') && !part.includes('</')) {
                level++
              }
            } else if (part.trim()) {
              formattedLines.push(indent.repeat(level) + part.trim())
            }
          }
          
          return formattedLines.join('\n')
        }
        
        case 'css': {
          // Basic CSS formatting
          const formatted = code
            .replace(/\s*{\s*/g, ' {\n')
            .replace(/;\s*/g, ';\n')
            .replace(/\s*}\s*/g, '\n}\n')
            .split('\n')
            .map(line => {
              const trimmed = line.trim()
              if (trimmed.endsWith('{')) return trimmed
              if (trimmed.startsWith('}')) return trimmed
              if (trimmed && !trimmed.endsWith('{') && !trimmed.startsWith('}')) {
                return `  ${trimmed}`
              }
              return trimmed
            })
            .join('\n')
          
          return formatted
        }
        
        default:
          return code
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to format code: ${error.message}`)
      }
      throw error
    }
  },
})

export const generateDockerfile = createTool({
  description: 'Generates a Dockerfile for common application types',
  parameters: z.object({
    baseImage: z.string().describe('Base Docker image (e.g., node:18, python:3.11)'),
    workdir: z.string().default('/app').describe('Working directory in container'),
    copyFiles: z.array(z.string()).default(['.']).describe('Files to copy into container'),
    installCommands: z.array(z.string()).optional().describe('Commands to run during build'),
    exposePort: z.number().optional().describe('Port to expose'),
    entrypoint: z.string().optional().describe('Container entrypoint command'),
    cmd: z.string().optional().describe('Default command to run'),
    env: z.record(z.string(), z.string()).optional().describe('Environment variables'),
  }),
  run: async ({ 
    baseImage, workdir, copyFiles, installCommands, 
    exposePort, entrypoint, cmd, env 
  }) => {
    try {
      let dockerfile = `FROM ${baseImage}\n\n`
      
      // Set working directory
      dockerfile += `WORKDIR ${workdir}\n\n`
      
      // Set environment variables
      if (env) {
        for (const [key, value] of Object.entries(env)) {
          dockerfile += `ENV ${key}="${value}"\n`
        }
        dockerfile += '\n'
      }
      
      // Copy files
      for (const file of copyFiles) {
        if (file === '.') {
          dockerfile += `COPY . ${workdir}\n`
        } else {
          dockerfile += `COPY ${file} ${workdir}/${file}\n`
        }
      }
      dockerfile += '\n'
      
      // Run install commands
      if (installCommands && installCommands.length > 0) {
        for (const command of installCommands) {
          dockerfile += `RUN ${command}\n`
        }
        dockerfile += '\n'
      }
      
      // Expose port
      if (exposePort) {
        dockerfile += `EXPOSE ${exposePort}\n\n`
      }
      
      // Set entrypoint
      if (entrypoint) {
        dockerfile += `ENTRYPOINT ${entrypoint}\n`
      }
      
      // Set default command
      if (cmd) {
        dockerfile += `CMD ${cmd}\n`
      }
      
      return dockerfile
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate Dockerfile: ${error.message}`)
      }
      throw error
    }
  },
})

export const generateEnvFile = createTool({
  description: 'Generates a .env file from key-value pairs',
  parameters: z.object({
    variables: z.string().describe('JSON object of environment variables'),
    includeComments: z.boolean().default(true).describe('Include descriptive comments'),
  }),
  run: async ({ variables, includeComments }) => {
    try {
      const vars = JSON.parse(variables)
      let envContent = ''
      
      if (includeComments) {
        envContent += '# Environment Variables\n'
        envContent += `# Generated on ${new Date().toISOString()}\n\n`
      }
      
      const categories: Record<string, string[]> = {
        database: ['DB_', 'DATABASE_', 'MONGO_', 'POSTGRES_', 'MYSQL_'],
        api: ['API_', 'KEY_', 'SECRET_', 'TOKEN_'],
        server: ['PORT', 'HOST', 'NODE_ENV', 'SERVER_'],
        aws: ['AWS_', 'S3_'],
        other: []
      }
      
      const categorizedVars: Record<string, Record<string, string>> = {
        database: {},
        api: {},
        server: {},
        aws: {},
        other: {}
      }
      
      // Categorize variables
      for (const [key, value] of Object.entries(vars)) {
        let categorized = false
        for (const [category, prefixes] of Object.entries(categories)) {
          if (category !== 'other' && prefixes.some(prefix => key.startsWith(prefix))) {
            categorizedVars[category][key] = String(value)
            categorized = true
            break
          }
        }
        if (!categorized) {
          categorizedVars.other[key] = String(value)
        }
      }
      
      // Write categorized variables
      for (const [category, categoryVars] of Object.entries(categorizedVars)) {
        if (Object.keys(categoryVars).length > 0) {
          if (includeComments) {
            envContent += `# ${category.charAt(0).toUpperCase() + category.slice(1)} Configuration\n`
          }
          
          for (const [key, value] of Object.entries(categoryVars)) {
            // Handle special cases
            if (value.includes(' ') || value.includes('#')) {
              envContent += `${key}="${value}"\n`
            } else {
              envContent += `${key}=${value}\n`
            }
          }
          
          envContent += '\n'
        }
      }
      
      return envContent.trim()
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate .env file: ${error.message}`)
      }
      throw error
    }
  },
})