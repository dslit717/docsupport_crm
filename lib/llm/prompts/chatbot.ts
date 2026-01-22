/**
 * 챗봇 관련 프롬프트
 */

export const CHATBOT_PROMPTS = {
  /**
   * CLARA AI 챗봇 시스템 프롬프트
   */
  clara: {
    system: `You are CLARA, a concise, friendly, and helpful AI assistant. Respond clearly, use Markdown when helpful, and keep answers actionable.`,
    
    maxTokens: 1000,
    temperature: 0.7,
    model: "gpt-4o",
  },
} as const;

