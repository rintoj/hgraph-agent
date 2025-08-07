import { GEMINI_MODELS, GeminiModel, type GeminiModelName } from './gemini.model.js'

import type { Model } from './model.type.js'

export type ModelName = GeminiModelName

export function model(name: ModelName, apiKey?: string): Model {
  switch (name) {
    case GEMINI_MODELS.GEMINI:
      return new GeminiModel(GEMINI_MODELS.GEMINI_2_5_FLASH, apiKey)
    case GEMINI_MODELS.GEMINI_PRO:
    case GEMINI_MODELS.GEMINI_1_5_PRO:
    case GEMINI_MODELS.GEMINI_FLASH:
    case GEMINI_MODELS.GEMINI_2_5_PRO:
    case GEMINI_MODELS.GEMINI_2_5_FLASH:
    case GEMINI_MODELS.GEMINI_2_5_FLASH_LITE:
    case GEMINI_MODELS.GEMINI_LIVE_2_5_FLASH_PREVIEW:
    case GEMINI_MODELS.GEMINI_2_5_FLASH_PREVIEW_NATIVE_AUDIO_DIALOG:
    case GEMINI_MODELS.GEMINI_2_5_FLASH_EXP_NATIVE_AUDIO_THINKING_DIALOG:
    case GEMINI_MODELS.GEMINI_2_5_FLASH_PREVIEW_TTS:
    case GEMINI_MODELS.GEMINI_2_5_PRO_PREVIEW_TTS:
    case GEMINI_MODELS.GEMINI_2_0_FLASH:
    case GEMINI_MODELS.GEMINI_2_0_FLASH_001:
    case GEMINI_MODELS.GEMINI_2_0_FLASH_PREVIEW_IMAGE_GENERATION:
    case GEMINI_MODELS.GEMINI_2_0_FLASH_LITE:
    case GEMINI_MODELS.GEMINI_2_0_FLASH_LITE_001:
    case GEMINI_MODELS.GEMINI_2_0_FLASH_LIVE_001:
    case GEMINI_MODELS.GEMINI_EMBEDDING_001:
    case GEMINI_MODELS.GEMINI_1_5_FLASH_ALIAS:
    case GEMINI_MODELS.GEMINI_1_5_FLASH_002:
    case GEMINI_MODELS.GEMINI_1_5_PRO_ALIAS:
    case GEMINI_MODELS.GEMINI_1_5_PRO_002:
      return new GeminiModel(name, apiKey)

    default:
      throw new Error(`Unsupported model: ${name}`)
  }
}
