import {
  type ChatSession,
  type Content,
  type FunctionDeclaration,
  type GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from '@google/generative-ai'
import { z } from 'zod'
import type { AgentMessage } from '../agent-message/agent-message.type.js'
import type { ToolFunction } from '../tool/tools.type.js'
import type { ContentResult, Model } from './model.type.js'

function getApiKey(providedApiKey?: string): string {
  const apiKey = providedApiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_KEY
  if (!apiKey) {
    throw new Error('Google AI API key not found. Please provide an apiKey in AgentConfig or set GOOGLE_AI_API_KEY, GEMINI_API_KEY, or GEMINI_KEY environment variable.')
  }
  return apiKey
}

export const GEMINI_MODELS = {
  GEMINI: 'gemini',
  GEMINI_PRO: 'gemini-pro',
  GEMINI_1_5_PRO: 'gemini-1.5-pro-latest',
  GEMINI_FLASH: 'gemini-1.5-flash-latest',
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
  GEMINI_LIVE_2_5_FLASH_PREVIEW: 'gemini-live-2.5-flash-preview',
  GEMINI_2_5_FLASH_PREVIEW_NATIVE_AUDIO_DIALOG: 'gemini-2.5-flash-preview-native-audio-dialog',
  GEMINI_2_5_FLASH_EXP_NATIVE_AUDIO_THINKING_DIALOG:
    'gemini-2.5-flash-exp-native-audio-thinking-dialog',
  GEMINI_2_5_FLASH_PREVIEW_TTS: 'gemini-2.5-flash-preview-tts',
  GEMINI_2_5_PRO_PREVIEW_TTS: 'gemini-2.5-pro-preview-tts',
  GEMINI_2_0_FLASH: 'gemini-2.0-flash',
  GEMINI_2_0_FLASH_001: 'gemini-2.0-flash-001',
  GEMINI_2_0_FLASH_PREVIEW_IMAGE_GENERATION: 'gemini-2.0-flash-preview-image-generation',
  GEMINI_2_0_FLASH_LITE: 'gemini-2.0-flash-lite',
  GEMINI_2_0_FLASH_LITE_001: 'gemini-2.0-flash-lite-001',
  GEMINI_2_0_FLASH_LIVE_001: 'gemini-2.0-flash-live-001',
  GEMINI_EMBEDDING_001: 'gemini-embedding-001',
  GEMINI_1_5_FLASH_ALIAS: 'gemini-1.5-flash',
  GEMINI_1_5_FLASH_002: 'gemini-1.5-flash-002',
  GEMINI_1_5_PRO_ALIAS: 'gemini-1.5-pro',
  GEMINI_1_5_PRO_002: 'gemini-1.5-pro-002',
} as const

export type GeminiModelName = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS]

export function zodToGoogleSchema(schema: z.ZodSchema): {
  type: SchemaType
  properties: Record<string, any>
  required?: string[]
} {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape
    const properties: Record<string, any> = {}
    const required: string[] = []
    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as z.ZodSchema
      properties[key] = convertZodFieldToGoogleSchema(fieldSchema as z.ZodSchema<any>)
      if (!fieldSchema.isOptional()) {
        required.push(key)
      }
    }
    return {
      type: SchemaType.OBJECT,
      properties,
      required: required.length > 0 ? required : undefined,
    }
  }
  throw new Error(`Unsupported Zod schema type: ${schema.constructor.name}`)
}

function convertZodFieldToGoogleSchema(schema: z.ZodSchema): any {
  if (schema instanceof z.ZodString) {
    return { type: SchemaType.STRING }
  }
  if (schema instanceof z.ZodNumber) {
    return { type: SchemaType.NUMBER }
  }
  if (schema instanceof z.ZodBoolean) {
    return { type: SchemaType.BOOLEAN }
  }
  if (schema instanceof z.ZodArray) {
    return {
      type: SchemaType.ARRAY,
      items: convertZodFieldToGoogleSchema(schema.element as z.ZodSchema<any>),
    }
  }
  if (schema instanceof z.ZodOptional) {
    return convertZodFieldToGoogleSchema(schema.unwrap() as z.ZodSchema<any>)
  }
  if (schema instanceof z.ZodEnum) {
    return {
      type: SchemaType.STRING,
      enum: schema.options,
    }
  }
  if (schema instanceof z.ZodDefault) {
    return convertZodFieldToGoogleSchema(schema.removeDefault() as z.ZodSchema<any>)
  }
  return { type: SchemaType.STRING }
}

export class GeminiModel implements Model {
  static async embedContent(text: string, apiKey?: string): Promise<number[]> {
    try {
      const genAI = new GoogleGenerativeAI(getApiKey(apiKey))
      const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.GEMINI_EMBEDDING_001 })
      const result = await model.embedContent(text)
      return result.embedding.values
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error('Failed to generate embedding.')
    }
  }

  private generativeModel: GenerativeModel | undefined
  private modelName: string
  private genAI: GoogleGenerativeAI

  constructor(modelName: string, apiKey?: string) {
    this.modelName = modelName ?? GEMINI_MODELS.GEMINI_2_5_FLASH
    this.genAI = new GoogleGenerativeAI(getApiKey(apiKey))
  }

  private createToolSchema(tools: Map<string, ToolFunction<any>>): FunctionDeclaration[] | null {
    if (tools.size === 0) {
      return null
    }
    const functions: FunctionDeclaration[] = []
    for (const [name, tool] of tools) {
      functions.push({
        name,
        description: tool.description,
        parameters: zodToGoogleSchema(tool.parameters),
      })
    }
    return functions
  }

  private convertToModelAppropriateMessage(message: AgentMessage): Content {
    if (message.role === 'user') {
      return {
        role: 'user',
        parts: [{ text: message.content }],
      }
    }
    if (message.role === 'assistant') {
      return {
        role: 'model',
        parts: [{ text: message.content }],
      }
    }
    return {
      role: 'model',
      parts: [{ text: message.content }],
    }
  }

  get model(): GenerativeModel {
    if (!this.generativeModel) {
      this.generativeModel = this.genAI.getGenerativeModel({ model: this.modelName })
    }
    return this.generativeModel
  }

  startChat(
    history: AgentMessage[],
    tools: Map<string, ToolFunction<any>> | undefined,
  ): ChatSession {
    const modelHistory = history.map(message => this.convertToModelAppropriateMessage(message))
    const toolSchemas = tools ? this.createToolSchema(tools) : undefined
    return this.model.startChat({
      history: modelHistory,
      tools: toolSchemas ? [{ functionDeclarations: toolSchemas }] : undefined,
    })
  }

  sendMessage(chat: ChatSession, message: AgentMessage): Promise<ContentResult> {
    const modelMessage = this.convertToModelAppropriateMessage(message)
    return chat.sendMessage(modelMessage.parts).then(result => ({
      response: {
        candidates: result.response.candidates,
        promptFeedback: result.response.promptFeedback,
        text: () => result.response.text(),
        functionCalls: () => result.response.functionCalls() ?? [],
      },
    }))
  }
}
