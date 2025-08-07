import type { FunctionCall } from '@google/generative-ai'
import { z } from 'zod'
import type { AgentMessage, ToolCall } from '../agent-message/agent-message.type.js'
import { createAssistantMessage, generateId } from '../agent-message/agent-message.util.js'
import { type Model, model } from '../model/index.js'
import type { ToolFunction } from '../tool/tools.type.js'
import type { AgentConfig } from './agent.type.js'

export class Agent {
  protected tools: Map<string, ToolFunction<any>> = new Map()
  protected conversationHistory: AgentMessage[] = []
  protected config: AgentConfig
  private modelInstance: Model

  constructor(config: AgentConfig) {
    this.config = config
    this.modelInstance = model(config.model, config.apiKey)
  }

  get description(): string {
    return this.config.description
  }

  get name(): string {
    return this.config.name
  }

  addTool(name: string, toolFunction: ToolFunction<any>): void {
    this.tools.set(name, toolFunction)
  }

  addTools(tools: Record<string, ToolFunction<any>>): void {
    for (const [name, tool] of Object.entries(tools)) {
      this.addTool(name, tool)
    }
  }

  protected ensureInstruction(messages: AgentMessage[], threadId: string): AgentMessage[] {
    // Check if the first message is already a system prompt with the agent's instruction
    if (messages[0].role === 'user' && messages[0].content === this.config.instruction) {
      return messages
    }
    // Prepend the system prompt if it's not already the first message
    return [
      { id: 'system-prompt', role: 'user', content: this.config.instruction, threadId },
      ...messages,
    ]
  }

  private async *executeToolCall(toolCall: ToolCall): AsyncGenerator<AgentMessage, void, unknown> {
    const toolSignature = `${toolCall.name} (${JSON.stringify(toolCall.arguments)})`

    const tool = this.tools.get(toolCall.name)
    if (!tool) {
      yield createAssistantMessage(
        'error',
        `Error: Tool '${toolCall.name}' not found`,
        toolCall.threadId,
      )
      return
    }
    if (!tool.run && !tool.runWithStream) {
      yield createAssistantMessage(
        'error',
        `Error: Tool '${toolCall.name}' does not have a 'run' or 'runWithStream' method.`,
        toolCall.threadId,
      )
      return
    }
    try {
      const validatedArgs = tool.parameters.parse(toolCall.arguments)
      if (tool.runWithStream) {
        for await (const chunk of tool.runWithStream(validatedArgs)) {
          yield chunk
        }
      } else {
        const result = await tool.run(validatedArgs)
        yield createAssistantMessage('final_response', String(result), toolCall.threadId)
      }
    } catch (error) {
      let errorMessage: string
      if (error instanceof z.ZodError) {
        errorMessage = `Error: Invalid arguments for ${toolSignature}: ${error.message}`
      } else {
        errorMessage = `Error executing ${toolSignature}: ${error}`
      }
      yield createAssistantMessage('error', errorMessage, toolCall.threadId)
    }
  }

  async run(messages: AgentMessage[], options?: { maxTurns?: number }): Promise<AgentMessage[]> {
    const allResponses: AgentMessage[] = []
    for await (const message of this.runWithStream(messages, options)) {
      if (message.type === 'final_response') {
        allResponses.push({
          id: generateId(),
          role: 'assistant',
          content: message.content,
          threadId: message.threadId,
        })
      }
    }
    return allResponses
  }

  async *runWithStream(
    messages: AgentMessage[],
    { maxTurns = 150 }: { maxTurns?: number } = {},
  ): AsyncGenerator<AgentMessage, AgentMessage[], unknown> {
    const threadId = generateId()
    const messagesWithInstruction = this.ensureInstruction(messages, threadId)
    this.conversationHistory = [...this.conversationHistory, ...messagesWithInstruction]
    const chat = this.modelInstance.startChat(this.conversationHistory.slice(0, -1), this.tools)
    let functionCalls: FunctionCall[] = []
    for (let turn = 0; turn < maxTurns; turn++) {
      try {
        yield createAssistantMessage('log', 'Thinking...', threadId)
        const lastMessage = this.conversationHistory[this.conversationHistory.length - 1]
        const result = await this.modelInstance.sendMessage(chat, lastMessage)
        functionCalls = result.response.functionCalls() ?? []
        if (functionCalls && functionCalls.length > 0) {
          yield createAssistantMessage(
            'log',
            `Detected ${functionCalls.length} function calls.`,
            threadId,
          )
          const responses: AgentMessage[] = []
          for (const call of functionCalls) {
            const toolCall: ToolCall = {
              id: `call_${Date.now()}_${Math.random()}`,
              name: call.name,
              arguments: call.args,
              threadId,
            }
            yield createAssistantMessage('log', `Calling tool: ${toolCall.name}`, threadId)
            for await (const toolResponseMessage of this.executeToolCall(toolCall)) {
              if (
                toolResponseMessage.type === 'final_response' ||
                toolResponseMessage.type === 'error'
              ) {
                const finalResponse = {
                  id: toolCall.id,
                  role: 'tool' as const,
                  content: toolResponseMessage.content,
                  tool_call_id: toolCall.id,
                  threadId,
                }
                responses.push(finalResponse)
                this.conversationHistory.push(finalResponse)
              }
            }
            yield createAssistantMessage(
              'log',
              `Calling tool ${toolCall.name} completed.`,
              threadId,
            )
          }
        } else {
          yield createAssistantMessage('log', 'Completed', threadId)
          const assistantMessage: AgentMessage = {
            id: `assistant-${Date.now()}-${Math.random()}`,
            role: 'assistant',
            content: result.response.text(),
            threadId,
          }
          this.conversationHistory.push(assistantMessage)
          yield createAssistantMessage('completed', 'Agent run completed.', threadId)
          yield createAssistantMessage('final_response', assistantMessage.content, threadId)
          return this.conversationHistory
        }
      } catch (error) {
        yield createAssistantMessage('error', `Agent error: ${error}`, threadId)
        throw new Error(`Agent error: ${error}`)
      }
    }
    yield createAssistantMessage('warn', 'Maximum turns reached.', threadId)

    yield createAssistantMessage('log', 'Finalizing response...', threadId)

    const lastMessage = this.conversationHistory[this.conversationHistory.length - 1]
    const result = await this.modelInstance.sendMessage(chat, {
      ...lastMessage,
      content: `${lastMessage.content} Conclude your response without making any function calls.`,
    })
    const finalAssistantMessage: AgentMessage = {
      id: `assistant-${Date.now()}-${Math.random()}`,
      role: 'assistant',
      content: result.response.text(),
      threadId,
    }
    this.conversationHistory.push(finalAssistantMessage)
    yield createAssistantMessage('completed', 'Agent run completed.', threadId)
    yield createAssistantMessage('final_response', finalAssistantMessage.content, threadId)
    return this.conversationHistory
  }
}

export function createAgent(config: AgentConfig): Agent {
  return new Agent(config)
}
