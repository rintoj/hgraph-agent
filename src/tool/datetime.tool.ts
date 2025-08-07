import { z } from 'zod'
import { createTool } from './builder.tool.js'

export const getCurrentDateTime = createTool({
  description: 'Gets the current date and time in various formats',
  parameters: z.object({
    format: z.enum(['iso', 'locale', 'timestamp', 'custom']).default('iso').describe('Output format'),
    timezone: z.string().optional().describe('Timezone (e.g., "UTC", "America/New_York")'),
    customFormat: z.string().optional().describe('Custom format string (required if format is "custom")'),
  }),
  run: async ({ format, timezone, customFormat }) => {
    try {
      const now = new Date()
      
      const options: Intl.DateTimeFormatOptions = timezone ? { timeZone: timezone } : {}
      
      switch (format) {
        case 'iso':
          return now.toISOString()
        case 'locale':
          return now.toLocaleString('en-US', options)
        case 'timestamp':
          return now.getTime().toString()
        case 'custom':
          if (!customFormat) {
            throw new Error('customFormat is required when format is "custom"')
          }
          return formatDateTimeCustom(now, customFormat, timezone)
        default:
          return now.toISOString()
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get current date/time: ${error.message}`)
      }
      throw error
    }
  },
})

export const formatDateTime = createTool({
  description: 'Formats a date/time string into a different format',
  parameters: z.object({
    dateTime: z.string().describe('Date/time string to format (ISO string, timestamp, or parseable date)'),
    outputFormat: z.enum(['iso', 'locale', 'timestamp', 'custom']).default('iso').describe('Output format'),
    timezone: z.string().optional().describe('Target timezone'),
    customFormat: z.string().optional().describe('Custom format string (required if outputFormat is "custom")'),
  }),
  run: async ({ dateTime, outputFormat, timezone, customFormat }) => {
    try {
      let date: Date
      
      // Try to parse the input date
      if (/^\d+$/.test(dateTime)) {
        // It's a timestamp
        date = new Date(parseInt(dateTime))
      } else {
        date = new Date(dateTime)
      }
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date/time string')
      }
      
      const options: Intl.DateTimeFormatOptions = timezone ? { timeZone: timezone } : {}
      
      switch (outputFormat) {
        case 'iso':
          return date.toISOString()
        case 'locale':
          return date.toLocaleString('en-US', options)
        case 'timestamp':
          return date.getTime().toString()
        case 'custom':
          if (!customFormat) {
            throw new Error('customFormat is required when outputFormat is "custom"')
          }
          return formatDateTimeCustom(date, customFormat, timezone)
        default:
          return date.toISOString()
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Date formatting failed: ${error.message}`)
      }
      throw error
    }
  },
})

function formatDateTimeCustom(date: Date, format: string, timezone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  }
  
  // Simple format replacements
  const replacements: Record<string, string> = {
    'YYYY': date.getFullYear().toString(),
    'YY': date.getFullYear().toString().slice(-2),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'DD': String(date.getDate()).padStart(2, '0'),
    'HH': String(date.getHours()).padStart(2, '0'),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'ss': String(date.getSeconds()).padStart(2, '0'),
  }
  
  let result = format
  for (const [pattern, replacement] of Object.entries(replacements)) {
    result = result.replace(new RegExp(pattern, 'g'), replacement)
  }
  
  return result
}

export const parseDateTime = createTool({
  description: 'Parses a date/time string and returns detailed information',
  parameters: z.object({
    dateTime: z.string().describe('Date/time string to parse'),
    inputFormat: z.string().optional().describe('Expected input format (if not standard)'),
  }),
  run: async ({ dateTime, inputFormat }) => {
    try {
      let date: Date
      
      if (/^\d+$/.test(dateTime)) {
        date = new Date(parseInt(dateTime))
      } else {
        date = new Date(dateTime)
      }
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date/time string')
      }
      
      const info = {
        originalInput: dateTime,
        parsedDate: {
          iso: date.toISOString(),
          timestamp: date.getTime(),
          locale: date.toLocaleString(),
          utc: date.toUTCString(),
        },
        components: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds(),
          millisecond: date.getMilliseconds(),
          dayOfWeek: date.getDay(),
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          monthName: date.toLocaleDateString('en-US', { month: 'long' }),
        },
        timezone: {
          offset: date.getTimezoneOffset(),
          offsetString: formatTimezoneOffset(date.getTimezoneOffset()),
        }
      }
      
      return JSON.stringify(info, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Date parsing failed: ${error.message}`)
      }
      throw error
    }
  },
})

function formatTimezoneOffset(offsetMinutes: number): string {
  const sign = offsetMinutes > 0 ? '-' : '+'
  const absOffset = Math.abs(offsetMinutes)
  const hours = Math.floor(absOffset / 60)
  const minutes = absOffset % 60
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export const calculateDateDifference = createTool({
  description: 'Calculates the difference between two dates',
  parameters: z.object({
    startDate: z.string().describe('Start date/time string'),
    endDate: z.string().describe('End date/time string'),
    unit: z.enum(['milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years']).default('days').describe('Unit for the difference calculation'),
  }),
  run: async ({ startDate, endDate, unit }) => {
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date/time strings')
      }
      
      const diffMs = end.getTime() - start.getTime()
      
      let result: number
      switch (unit) {
        case 'milliseconds':
          result = diffMs
          break
        case 'seconds':
          result = diffMs / 1000
          break
        case 'minutes':
          result = diffMs / (1000 * 60)
          break
        case 'hours':
          result = diffMs / (1000 * 60 * 60)
          break
        case 'days':
          result = diffMs / (1000 * 60 * 60 * 24)
          break
        case 'weeks':
          result = diffMs / (1000 * 60 * 60 * 24 * 7)
          break
        case 'months':
          // Approximate calculation
          result = diffMs / (1000 * 60 * 60 * 24 * 30.44)
          break
        case 'years':
          // Approximate calculation
          result = diffMs / (1000 * 60 * 60 * 24 * 365.25)
          break
        default:
          result = diffMs / (1000 * 60 * 60 * 24)
      }
      
      return JSON.stringify({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        difference: {
          value: Math.round(result * 100) / 100, // Round to 2 decimal places
          unit,
          absolute: Math.abs(Math.round(result * 100) / 100),
        },
        raw: {
          milliseconds: diffMs,
        }
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Date difference calculation failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const getTimezone = createTool({
  description: 'Gets timezone information for the current system or a specific timezone',
  parameters: z.object({
    timezone: z.string().optional().describe('Specific timezone to get info for (e.g., "America/New_York")'),
  }),
  run: async ({ timezone }) => {
    try {
      const now = new Date()
      
      if (timezone) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          timeZoneName: 'long',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        
        const parts = formatter.formatToParts(now)
        const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone
        
        return JSON.stringify({
          timezone,
          timeZoneName,
          currentTime: now.toLocaleString('en-US', { timeZone: timezone }),
          currentTimeISO: now.toISOString(),
        }, null, 2)
      } else {
        const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const offset = now.getTimezoneOffset()
        
        return JSON.stringify({
          systemTimezone,
          offset: formatTimezoneOffset(offset),
          offsetMinutes: offset,
          currentTime: now.toLocaleString(),
          currentTimeISO: now.toISOString(),
        }, null, 2)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Timezone info failed: ${error.message}`)
      }
      throw error
    }
  },
})

export const addToDate = createTool({
  description: 'Adds time to a date and returns the result',
  parameters: z.object({
    dateTime: z.string().describe('Base date/time string'),
    amount: z.number().describe('Amount to add (can be negative to subtract)'),
    unit: z.enum(['milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years']).describe('Unit to add'),
    outputFormat: z.enum(['iso', 'locale', 'timestamp']).default('iso').describe('Output format'),
  }),
  run: async ({ dateTime, amount, unit, outputFormat }) => {
    try {
      const date = new Date(dateTime)
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date/time string')
      }
      
      const result = new Date(date.getTime())
      
      switch (unit) {
        case 'milliseconds':
          result.setTime(result.getTime() + amount)
          break
        case 'seconds':
          result.setTime(result.getTime() + (amount * 1000))
          break
        case 'minutes':
          result.setTime(result.getTime() + (amount * 1000 * 60))
          break
        case 'hours':
          result.setTime(result.getTime() + (amount * 1000 * 60 * 60))
          break
        case 'days':
          result.setDate(result.getDate() + amount)
          break
        case 'weeks':
          result.setDate(result.getDate() + (amount * 7))
          break
        case 'months':
          result.setMonth(result.getMonth() + amount)
          break
        case 'years':
          result.setFullYear(result.getFullYear() + amount)
          break
      }
      
      switch (outputFormat) {
        case 'iso':
          return result.toISOString()
        case 'locale':
          return result.toLocaleString()
        case 'timestamp':
          return result.getTime().toString()
        default:
          return result.toISOString()
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Date addition failed: ${error.message}`)
      }
      throw error
    }
  },
})