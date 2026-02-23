import { GoogleGenerativeAI } from "@google/generative-ai"

import type { AiClient } from "../application/ports"

const MODEL = "gemini-2.5-flash"

export function createGeminiClient(): AiClient {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set")
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  return {
    async generateReply(systemPrompt: string, userPrompt: string): Promise<string> {
      const model = genAI.getGenerativeModel({
        model: MODEL,
        systemInstruction: systemPrompt,
      })

      const result = await model.generateContent(userPrompt)
      const text = result.response.text().trim()
      if (!text) {
        throw new Error("AI returned an empty response")
      }
      // Cap at 3000 chars to prevent excessively long bot comments
      return text.length > 3000 ? text.slice(0, 3000) + "..." : text
    },
  }
}
