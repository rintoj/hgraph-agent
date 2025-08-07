import type { z } from 'zod'
import type { AgentMessage } from '../agent-message/agent-message.type.js'

export type ToolFunction<T extends z.ZodSchema = z.ZodSchema> = {
  description: string
  parameters: T
} & (
  | { run: (args: z.infer<T>) => Promise<string>; runWithStream?: never }
  | {
      runWithStream: (args: z.infer<T>) => AsyncGenerator<AgentMessage, string, unknown>
      run?: never
    }
)
