import { execSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { cpus, freemem, totalmem, uptime as osUptime } from 'node:os'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const getDiskSpace = createTool({
  description: 'Gets disk space information for the filesystem',
  parameters: z.object({
    path: z.string().default('/').describe('Path to check disk space for'),
  }),
  run: async ({ path }) => {
    try {
      const result = execSync(`df -h "${path}" | tail -1`, { encoding: 'utf-8' })
      const parts = result.trim().split(/\s+/)
      
      // Parse df output
      const [filesystem, size, used, available, usePercent, mounted] = parts
      
      return JSON.stringify({
        filesystem,
        totalSize: size,
        used,
        available,
        usePercent,
        mountPoint: mounted,
        path
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get disk space: ${error.message}`)
      }
      throw error
    }
  },
})

export const getMemoryUsage = createTool({
  description: 'Gets current memory usage statistics',
  parameters: z.object({}),
  run: async () => {
    try {
      const total = totalmem()
      const free = freemem()
      const used = total - free
      const usagePercent = ((used / total) * 100).toFixed(2)
      
      // Get process memory usage
      const processMemory = process.memoryUsage()
      
      return JSON.stringify({
        system: {
          total: `${(total / 1024 / 1024 / 1024).toFixed(2)} GB`,
          totalBytes: total,
          free: `${(free / 1024 / 1024 / 1024).toFixed(2)} GB`,
          freeBytes: free,
          used: `${(used / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usedBytes: used,
          usagePercent: `${usagePercent}%`
        },
        process: {
          rss: `${(processMemory.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(processMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(processMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: `${(processMemory.external / 1024 / 1024).toFixed(2)} MB`,
          arrayBuffers: `${(processMemory.arrayBuffers / 1024 / 1024).toFixed(2)} MB`
        }
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get memory usage: ${error.message}`)
      }
      throw error
    }
  },
})

export const getCpuUsage = createTool({
  description: 'Gets CPU usage statistics and information',
  parameters: z.object({
    sampleTime: z.number().default(1000).describe('Sample time in milliseconds for CPU usage calculation'),
  }),
  run: async ({ sampleTime }) => {
    try {
      const cpuList = cpus()
      
      // Get initial CPU times
      const startTimes = cpuList.map(cpu => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
        return { idle: cpu.times.idle, total }
      })
      
      // Wait for sample time
      await new Promise(resolve => setTimeout(resolve, sampleTime))
      
      // Get final CPU times and calculate usage
      const endCpus = cpus()
      const cpuUsages = endCpus.map((cpu, i) => {
        const endTotal = Object.values(cpu.times).reduce((a, b) => a + b, 0)
        const totalDiff = endTotal - startTimes[i].total
        const idleDiff = cpu.times.idle - startTimes[i].idle
        const usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff * 100).toFixed(2) : '0.00'
        
        return {
          model: cpu.model,
          speed: `${cpu.speed} MHz`,
          usage: `${usage}%`
        }
      })
      
      // Calculate average usage
      const avgUsage = (cpuUsages.reduce((sum, cpu) => 
        sum + parseFloat(cpu.usage), 0) / cpuUsages.length).toFixed(2)
      
      return JSON.stringify({
        cpuCount: cpuList.length,
        averageUsage: `${avgUsage}%`,
        cpus: cpuUsages,
        uptime: `${(osUptime() / 3600).toFixed(2)} hours`
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get CPU usage: ${error.message}`)
      }
      throw error
    }
  },
})

export const listProcesses = createTool({
  description: 'Lists running processes with optional filtering',
  parameters: z.object({
    filter: z.string().optional().describe('Filter processes by name'),
    sortBy: z.enum(['cpu', 'memory', 'pid', 'name']).default('cpu').describe('Sort processes by metric'),
    limit: z.number().default(20).describe('Maximum number of processes to return'),
  }),
  run: async ({ filter, sortBy, limit }) => {
    try {
      // Get process list using ps command
      let psCommand = 'ps aux'
      
      // Add sorting based on sortBy parameter
      switch (sortBy) {
        case 'cpu':
          psCommand += ' | sort -k3 -rn'
          break
        case 'memory':
          psCommand += ' | sort -k4 -rn'
          break
        case 'pid':
          psCommand += ' | sort -k2 -n'
          break
        case 'name':
          psCommand += ' | sort -k11'
          break
      }
      
      // Add filter if provided
      if (filter) {
        psCommand += ` | grep -i "${filter}"`
      }
      
      // Add header and limit
      psCommand = `${psCommand} | head -${limit + 1}`
      
      const result = execSync(psCommand, { encoding: 'utf-8' })
      const lines = result.trim().split('\n')
      const header = lines[0]
      const processLines = lines.slice(1)
      
      const processes = processLines.map(line => {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 11) {
          return {
            user: parts[0],
            pid: parts[1],
            cpu: `${parts[2]}%`,
            memory: `${parts[3]}%`,
            vsz: parts[4],
            rss: parts[5],
            tty: parts[6],
            stat: parts[7],
            start: parts[8],
            time: parts[9],
            command: parts.slice(10).join(' ')
          }
        }
        return null
      }).filter(Boolean)
      
      return JSON.stringify({
        count: processes.length,
        sortedBy: sortBy,
        filtered: filter || 'none',
        processes
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list processes: ${error.message}`)
      }
      throw error
    }
  },
})

export const getProcessDetails = createTool({
  description: 'Gets detailed information about a specific process',
  parameters: z.object({
    pid: z.number().describe('Process ID'),
  }),
  run: async ({ pid }) => {
    try {
      // Check if process exists
      try {
        process.kill(pid, 0)
      } catch {
        return JSON.stringify({
          error: `Process ${pid} not found or not accessible`
        }, null, 2)
      }
      
      // Get process info from /proc (Linux) or ps command
      const psResult = execSync(`ps -p ${pid} -o pid,ppid,user,uid,gid,vsz,rss,pcpu,pmem,etime,args`, 
        { encoding: 'utf-8' })
      
      const lines = psResult.trim().split('\n')
      if (lines.length < 2) {
        throw new Error('Process not found')
      }
      
      const parts = lines[1].trim().split(/\s+/)
      
      const details: any = {
        pid: parseInt(parts[0]),
        ppid: parseInt(parts[1]),
        user: parts[2],
        uid: parseInt(parts[3]),
        gid: parseInt(parts[4]),
        virtualMemory: `${(parseInt(parts[5]) / 1024).toFixed(2)} MB`,
        residentMemory: `${(parseInt(parts[6]) / 1024).toFixed(2)} MB`,
        cpuUsage: `${parts[7]}%`,
        memoryUsage: `${parts[8]}%`,
        elapsedTime: parts[9],
        command: parts.slice(10).join(' ')
      }
      
      // Try to get additional info from /proc if available (Linux)
      try {
        const status = await fs.readFile(`/proc/${pid}/status`, 'utf-8')
        const statusLines = status.split('\n')
        
        for (const line of statusLines) {
          if (line.startsWith('Name:')) {
            details.processName = line.split(/\s+/)[1]
          } else if (line.startsWith('State:')) {
            details.state = line.substring(6).trim()
          } else if (line.startsWith('Threads:')) {
            details.threads = parseInt(line.split(/\s+/)[1])
          }
        }
      } catch {
        // /proc not available (macOS or other systems)
      }
      
      return JSON.stringify(details, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get process details: ${error.message}`)
      }
      throw error
    }
  },
})

export const getNetworkStats = createTool({
  description: 'Gets network interface statistics',
  parameters: z.object({
    interface: z.string().optional().describe('Specific network interface to check'),
  }),
  run: async ({ interface: iface }) => {
    try {
      // Get network interfaces using ifconfig or ip command
      let command = 'ifconfig'
      if (iface) {
        command += ` ${iface}`
      }
      
      let result: string
      try {
        result = execSync(command, { encoding: 'utf-8' })
      } catch {
        // Try ip command if ifconfig not available
        command = 'ip -s link show'
        if (iface) {
          command += ` ${iface}`
        }
        result = execSync(command, { encoding: 'utf-8' })
      }
      
      // Parse network statistics
      const interfaces: any[] = []
      const blocks = result.split(/\n(?=\S)/)
      
      for (const block of blocks) {
        const lines = block.split('\n')
        const firstLine = lines[0]
        
        // Extract interface name
        const nameMatch = firstLine.match(/^(\S+):?/)
        if (!nameMatch) continue
        
        const name = nameMatch[1].replace(':', '')
        const interfaceInfo: any = { name }
        
        // Extract IP addresses
        const ipv4Match = block.match(/inet\s+(\S+)/)
        const ipv6Match = block.match(/inet6\s+(\S+)/)
        
        if (ipv4Match) interfaceInfo.ipv4 = ipv4Match[1]
        if (ipv6Match) interfaceInfo.ipv6 = ipv6Match[1]
        
        // Extract MAC address
        const macMatch = block.match(/ether\s+(\S+)|HWaddr\s+(\S+)/)
        if (macMatch) interfaceInfo.mac = macMatch[1] || macMatch[2]
        
        // Extract RX/TX statistics
        const rxBytesMatch = block.match(/RX\s+bytes[:\s]+(\d+)/)
        const txBytesMatch = block.match(/TX\s+bytes[:\s]+(\d+)/)
        const rxPacketsMatch = block.match(/RX\s+packets[:\s]+(\d+)/)
        const txPacketsMatch = block.match(/TX\s+packets[:\s]+(\d+)/)
        
        if (rxBytesMatch || txBytesMatch) {
          interfaceInfo.statistics = {
            rxBytes: rxBytesMatch ? parseInt(rxBytesMatch[1]) : 0,
            txBytes: txBytesMatch ? parseInt(txBytesMatch[1]) : 0,
            rxPackets: rxPacketsMatch ? parseInt(rxPacketsMatch[1]) : 0,
            txPackets: txPacketsMatch ? parseInt(txPacketsMatch[1]) : 0
          }
        }
        
        // Check if interface is up
        interfaceInfo.status = block.includes('UP') ? 'up' : 'down'
        
        interfaces.push(interfaceInfo)
      }
      
      return JSON.stringify({
        interfaceCount: interfaces.length,
        interfaces
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get network stats: ${error.message}`)
      }
      throw error
    }
  },
})

export const getOpenPorts = createTool({
  description: 'Lists open network ports and listening services',
  parameters: z.object({
    protocol: z.enum(['tcp', 'udp', 'all']).default('all').describe('Protocol to check'),
    state: z.enum(['listening', 'established', 'all']).default('listening').describe('Connection state'),
  }),
  run: async ({ protocol, state }) => {
    try {
      // Build netstat/ss command based on parameters
      let command = 'netstat -tuln'
      
      if (protocol === 'tcp') {
        command = 'netstat -tln'
      } else if (protocol === 'udp') {
        command = 'netstat -uln'
      }
      
      if (state === 'established') {
        command = command.replace('l', '')
      } else if (state === 'all') {
        command = command.replace('l', 'a')
      }
      
      let result: string
      try {
        result = execSync(command, { encoding: 'utf-8' })
      } catch {
        // Try ss command if netstat not available
        command = 'ss -tuln'
        if (protocol === 'tcp') command = 'ss -tln'
        if (protocol === 'udp') command = 'ss -uln'
        if (state === 'established') command = command.replace('l', '')
        if (state === 'all') command = command.replace('l', 'a')
        
        result = execSync(command, { encoding: 'utf-8' })
      }
      
      const lines = result.trim().split('\n')
      const ports: any[] = []
      
      for (const line of lines.slice(1)) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 4) {
          const proto = parts[0].toLowerCase()
          const localAddress = parts[3]
          const foreignAddress = parts.length > 4 ? parts[4] : '*'
          const connectionState = parts.length > 5 ? parts[5] : 'LISTEN'
          
          // Parse address and port
          const localParts = localAddress.split(':')
          const port = localParts[localParts.length - 1]
          const address = localParts.slice(0, -1).join(':') || '*'
          
          ports.push({
            protocol: proto,
            port,
            address,
            foreignAddress,
            state: connectionState
          })
        }
      }
      
      return JSON.stringify({
        count: ports.length,
        protocol,
        state,
        ports
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get open ports: ${error.message}`)
      }
      throw error
    }
  },
})

export const getSystemLoad = createTool({
  description: 'Gets system load averages and statistics',
  parameters: z.object({}),
  run: async () => {
    try {
      // Get load averages
      const uptimeResult = execSync('uptime', { encoding: 'utf-8' })
      const loadMatch = uptimeResult.match(/load average[s]?:\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
      
      let loadAverages = { '1min': '0', '5min': '0', '15min': '0' }
      if (loadMatch) {
        loadAverages = {
          '1min': loadMatch[1],
          '5min': loadMatch[2],
          '15min': loadMatch[3]
        }
      }
      
      // Get CPU count for context
      const cpuCount = cpus().length
      
      // Calculate load percentage (load / cpu count * 100)
      const loadPercentages = {
        '1min': `${(parseFloat(loadAverages['1min']) / cpuCount * 100).toFixed(2)}%`,
        '5min': `${(parseFloat(loadAverages['5min']) / cpuCount * 100).toFixed(2)}%`,
        '15min': `${(parseFloat(loadAverages['15min']) / cpuCount * 100).toFixed(2)}%`
      }
      
      // Get uptime
      const uptimeSeconds = osUptime()
      const days = Math.floor(uptimeSeconds / 86400)
      const hours = Math.floor((uptimeSeconds % 86400) / 3600)
      const minutes = Math.floor((uptimeSeconds % 3600) / 60)
      
      // Get process counts
      const psCount = execSync('ps aux | wc -l', { encoding: 'utf-8' })
      const processCount = parseInt(psCount.trim()) - 1 // Subtract header
      
      return JSON.stringify({
        loadAverages,
        loadPercentages,
        cpuCount,
        uptime: {
          days,
          hours,
          minutes,
          totalSeconds: uptimeSeconds,
          formatted: `${days}d ${hours}h ${minutes}m`
        },
        processCount,
        timestamp: new Date().toISOString()
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get system load: ${error.message}`)
      }
      throw error
    }
  },
})

export const monitorResource = createTool({
  description: 'Monitors a specific resource over time',
  parameters: z.object({
    resource: z.enum(['cpu', 'memory', 'disk', 'network']).describe('Resource to monitor'),
    duration: z.number().default(5000).describe('Monitoring duration in milliseconds'),
    interval: z.number().default(1000).describe('Sampling interval in milliseconds'),
  }),
  run: async ({ resource, duration, interval }) => {
    try {
      const samples: any[] = []
      const iterations = Math.floor(duration / interval)
      
      for (let i = 0; i < iterations; i++) {
        const timestamp = new Date().toISOString()
        let sample: any = { timestamp }
        
        switch (resource) {
          case 'cpu': {
            const cpuList = cpus()
            const totalUsage = cpuList.reduce((sum, cpu) => {
              const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
              const idle = cpu.times.idle
              return sum + ((total - idle) / total * 100)
            }, 0) / cpuList.length
            
            sample.cpuUsage = `${totalUsage.toFixed(2)}%`
            break
          }
          
          case 'memory': {
            const total = totalmem()
            const free = freemem()
            const used = total - free
            
            sample.memoryUsed = `${(used / 1024 / 1024 / 1024).toFixed(2)} GB`
            sample.memoryFree = `${(free / 1024 / 1024 / 1024).toFixed(2)} GB`
            sample.memoryUsage = `${((used / total) * 100).toFixed(2)}%`
            break
          }
          
          case 'disk': {
            const result = execSync('df -h / | tail -1', { encoding: 'utf-8' })
            const parts = result.trim().split(/\s+/)
            sample.diskUsed = parts[2]
            sample.diskAvailable = parts[3]
            sample.diskUsage = parts[4]
            break
          }
          
          case 'network': {
            // Get network stats for primary interface
            const result = execSync('netstat -i | head -3 | tail -1', { encoding: 'utf-8' })
            const parts = result.trim().split(/\s+/)
            if (parts.length >= 7) {
              sample.interface = parts[0]
              sample.rxPackets = parts[4]
              sample.txPackets = parts[6]
            }
            break
          }
        }
        
        samples.push(sample)
        
        if (i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, interval))
        }
      }
      
      // Calculate statistics
      const stats: any = {
        resource,
        duration: `${duration}ms`,
        interval: `${interval}ms`,
        sampleCount: samples.length,
        samples
      }
      
      // Add resource-specific statistics
      if (resource === 'cpu' || resource === 'memory') {
        const values = samples.map(s => 
          parseFloat(s.cpuUsage || s.memoryUsage || '0'))
        
        stats.average = `${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}%`
        stats.min = `${Math.min(...values).toFixed(2)}%`
        stats.max = `${Math.max(...values).toFixed(2)}%`
      }
      
      return JSON.stringify(stats, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to monitor resource: ${error.message}`)
      }
      throw error
    }
  },
})