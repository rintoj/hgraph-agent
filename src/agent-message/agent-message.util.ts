import { createHash } from 'node:crypto'
import { customAlphabet } from 'nanoid'
import type { AgentMessage, MessageType, ToolCall } from './agent-message.type.js'

export const ALPHABETS = {
  ALPHANUMERIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  NUMERIC: '0123456789',
}

export function createRandomIdGenerator(
  length: number,
  alphabets: string = ALPHABETS.ALPHANUMERIC,
) {
  return customAlphabet(alphabets, length)
}

export const generateId = createRandomIdGenerator(8, ALPHABETS.ALPHANUMERIC)

export const generateNumericId = () =>
  `${Date.now().toString().substring(6)}${createRandomIdGenerator(10, ALPHABETS.NUMERIC)()}`

export const generateIdOf = (input: string) =>
  createHash('shake256', { outputLength: 8 }).update(input).digest('hex')

export function createSystemMessage(content: string, threadId?: string): AgentMessage {
  return {
    id: generateId(),
    role: 'system',
    content,
    threadId,
  }
}

export function createUserMessage(content: string, threadId?: string): AgentMessage {
  return {
    id: generateId(),
    role: 'user',
    content,
    threadId,
  }
}

export function createToolMessage(
  content: string,
  tool_call_id?: string,
  tool_calls?: ToolCall[],
  threadId?: string,
): AgentMessage {
  return {
    id: generateId(),
    role: 'tool',
    content,
    tool_call_id,
    tool_calls,
    threadId,
  }
}

export function createAssistantMessage(
  type: MessageType,
  content: string,
  threadId?: string,
): AgentMessage {
  return {
    id: generateId(),
    role: 'assistant',
    type,
    content,
    threadId,
  }
}
