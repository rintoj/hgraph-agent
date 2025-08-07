import type { AgentMessage } from '../agent-message/agent-message.type.js'
import type { ModelName } from '../model/model.util.js'

export interface AgentState {
  conversationHistory: AgentMessage[]
  timestamp: string
  modelName: string
  metadata?: Record<string, any>
}

export interface AgentConfig {
  name: string
  description: string
  instruction: string
  model: ModelName
  apiKey?: string
}
