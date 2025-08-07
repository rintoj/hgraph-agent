import type { AgentMessage } from '../agent-message/agent-message.type.js'
import type { ToolFunction } from '../tool/tools.type.js'

export interface ContentResult {
  response: GenerateContentResponse
}

export interface GenerateContentResponse {
  candidates?: Candidate[]
  promptFeedback?: PromptFeedback
  text(): string
  functionCalls(): FunctionCall[]
}

export interface Candidate {
  content?: Content
  finishReason?: string
  safetyRatings?: SafetyRating[]
  index?: number
}

export interface PromptFeedback {
  blockReason?: string
  safetyRatings?: SafetyRating[]
}

export interface SafetyRating {
  category: string
  probability: string
}

export interface Content {
  parts: Part[]
  role?: string
}

export interface Part {
  text?: string
  inlineData?: InlineData
  functionCall?: FunctionCall
  functionResponse?: FunctionResponse
}

export interface InlineData {
  mimeType: string
  data: string
}

export interface FunctionCall {
  name: string
  args: Record<string, any>
}

export interface FunctionDeclaration {
  name: string
  description?: string
  parameters?: Record<string, any>
}

export interface FunctionResponse {
  name: string
  response: Record<string, any>
}

export interface Model<ChatSessionType = any> {
  startChat(
    history: AgentMessage[],
    tools: Map<string, ToolFunction<any>> | undefined,
  ): ChatSessionType
  sendMessage(chat: ChatSessionType, message: AgentMessage): Promise<ContentResult>
}
