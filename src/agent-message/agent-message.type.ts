export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  threadId?: string
}

export type MessageType = 'info' | 'warn' | 'error' | 'completed' | 'log' | 'final_response'

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface AgentMessage {
  id: string
  role: MessageRole
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  type?: MessageType
  threadId?: string
}
