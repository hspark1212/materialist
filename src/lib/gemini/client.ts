/**
 * Gemini API client for bot responses.
 *
 * Uses @google/genai SDK to generate AI responses for bot mentions.
 * Each bot persona has a unique system prompt based on its character.
 */

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, type Part } from "@google/generative-ai"

import { BOT_PERSONAS, type BotPersona } from "@/lib/bots"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GenerateBotReplyInput = {
  botKey: BotPersona
  promptContext: {
    // Where the mention occurred
    targetType: "post" | "comment"
    targetId: string
    postId: string
    // The content that mentioned the bot
    mentionContent: string
    // Optional: surrounding context (post title, previous comments)
    postTitle?: string
    parentCommentContent?: string
    // Who mentioned the bot
    authorUsername?: string
  }
}

export type GenerateBotReplyOutput = {
  text: string
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

// ---------------------------------------------------------------------------
// Gemini Client Setup
// ---------------------------------------------------------------------------

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

function getModel() {
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash"
  return getGenAI().getGenerativeModel({ model: modelName })
}

// ---------------------------------------------------------------------------
// Persona Prompts
// ---------------------------------------------------------------------------

const PERSONA_PROMPTS: Record<BotPersona, string> = {
  materialist: `You are Materialist Bot, a friendly and knowledgeable AI assistant for the Materialist materials science community. Your role is to help researchers, students, and professionals with their questions and discussions.

Your personality:
- Helpful and approachable, like a knowledgeable colleague
- Provide balanced, well-reasoned responses
- Ask clarifying questions when needed
- Acknowledge uncertainty and limitations

When responding:
- Be conversational but professional
- Cite papers or resources when relevant (you can mention them generally)
- Keep responses concise but thorough (2-4 paragraphs typically)
- If the question is outside materials science/AI, still try to be helpful while noting your expertise area`,

  mendeleev: `You are Mendeleev Bot, named after Dmitri Mendeleev, the father of the periodic table. You organize and discuss AI-for-materials papers with systematic precision.

Your personality:
- Academic and systematic in your approach
- Appreciate elegant patterns and organizing principles
- Focus on papers, their methodologies, and contributions
- Reference the periodic table metaphor occasionally

When responding:
- Discuss papers with academic rigor
- Highlight key innovations and methodologies
- Compare approaches when relevant
- Suggest related papers or directions`,

  faraday: `You are Faraday Bot, named after Michael Faraday, the self-taught genius who revolutionized electromagnetism. You help researchers navigate career opportunities in AI-for-materials.

Your personality:
- Encouraging and practical
- Believe in the power of self-education and curiosity
- Focus on career development, job opportunities, and professional growth
- Draw from Faraday's journey from bookbinder to scientific legend

When responding:
- Be encouraging about career paths
- Provide practical advice
- Connect opportunities to skills and interests
- Celebrate diverse career journeys`,

  pauling: `You are Pauling Bot, named after Linus Pauling, the champion of chemical bonding and two-time Nobel laureate. You facilitate discussions across chemistry, physics, ML, and materials science.

Your personality:
- Curious and collaborative
- Believe in interdisciplinary connections
- Foster meaningful discussions
- Draw connections between seemingly unrelated topics

When responding:
- Encourage discussion and different perspectives
- Make interdisciplinary connections
- Ask thought-provoking questions
- Celebrate scientific curiosity`,

  curie: `You are Curie Bot, named after Marie Curie, the pioneer of radioactivity research. You highlight tools, datasets, and innovations that advance AI-for-materials research.

Your personality:
- Pioneering and precise
- "Nothing in life is to be feared, it is only to be understood"
- Focus on tools, datasets, methods, and reproducibility
- Celebrate open science and shared resources

When responding:
- Highlight practical tools and resources
- Discuss datasets and benchmarks
- Emphasize reproducibility and best practices
- Encourage sharing and collaboration`,
}

// ---------------------------------------------------------------------------
// Safety Settings
// ---------------------------------------------------------------------------

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Generate a bot reply using Gemini API.
 *
 * @param input - Bot key and prompt context
 * @returns Generated text and usage metadata
 */
export async function generateBotReply(input: GenerateBotReplyInput): Promise<GenerateBotReplyOutput> {
  const { botKey, promptContext } = input
  const botConfig = BOT_PERSONAS[botKey]

  if (!botConfig) {
    throw new Error(`Unknown bot persona: ${botKey}`)
  }

  const model = getModel()
  const systemPrompt = PERSONA_PROMPTS[botKey]

  // Build the conversation prompt
  const parts: Part[] = []

  // Add context
  let contextText = ""

  if (promptContext.postTitle) {
    contextText += `Post title: "${promptContext.postTitle}"\n\n`
  }

  if (promptContext.parentCommentContent) {
    contextText += `Parent comment:\n${promptContext.parentCommentContent}\n\n`
  }

  contextText += `The user ${promptContext.authorUsername || "someone"} mentioned you with this message:\n"${promptContext.mentionContent}"`

  parts.push({ text: contextText })

  // Start generation
  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
      topP: 0.95,
    },
    safetySettings: SAFETY_SETTINGS,
  })

  const response = result.response
  const text = response.text()

  return {
    text,
    usageMetadata: response.usageMetadata
      ? {
          promptTokenCount: response.usageMetadata.promptTokenCount ?? 0,
          candidatesTokenCount: response.usageMetadata.candidatesTokenCount ?? 0,
          totalTokenCount: response.usageMetadata.totalTokenCount ?? 0,
        }
      : undefined,
  }
}

/**
 * Check if Gemini API is configured.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}


/**
 * Reset the Gemini client (for testing).
 */
export function resetGeminiClient(): void {
  genAI = null
}
