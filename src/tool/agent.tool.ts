import { z } from 'zod'
import type { Agent } from '../agent/agent.js'
import type { AgentMessage } from '../agent-message/agent-message.type.js'
import { createUserMessage } from '../agent-message/agent-message.util.js'
import type { ToolFunction } from './tools.type.js'

const AgentAsToolSchema = z.object({
  message: z
    .string()
    .describe('The message to send to the subagent. Include any necessary context.'),
})

/**
 * Creates a ToolFunction that wraps an Agent, allowing it to be used as a tool.
 * The tool's parameters will expect an object with a single 'message' object.
 * @param agent The Agent instance to wrap.
 * @param description The description of the tool.
 * @returns A ToolFunction that can be added to another Agent.
 */
export function createAgentTool(agent: Agent): ToolFunction<typeof AgentAsToolSchema> {
  return {
    description: agent.description,
    parameters: AgentAsToolSchema,
    runWithStream: async function* (
      args: z.infer<typeof AgentAsToolSchema>,
    ): AsyncGenerator<AgentMessage, string, unknown> {
      console.log('Calling agent tool with args:', args.message)
      for await (const message of agent.runWithStream([createUserMessage(args.message)])) {
        if (message.type === 'final_response') {
          console.log('Final response: ', message.content)
          return message.content
        }
        yield message
      }
      return 'Error: Agent did not return a final response.'
    },
  }
}
