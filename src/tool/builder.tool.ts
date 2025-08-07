import type { z } from 'zod'
import type { ToolFunction } from './tools.type.js'

export function createTool<T extends z.ZodSchema>(tool: ToolFunction<T>): ToolFunction<T> {
  return tool
}
