import "server-only";
import OpenAI from "openai";

/**
 * LLM 클라이언트 생성 및 관리
 * Server-only 환경에서만 사용 가능
 */

export interface LLMClientConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenAI API 클라이언트 생성
 */
export function createLLMClient(config?: LLMClientConfig): OpenAI {
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API 키가 설정되지 않았습니다. OPENAI_API_KEY 환경 변수를 확인해주세요."
    );
  }

  return new OpenAI({
    apiKey,
  });
}

/**
 * 기본 OpenAI 클라이언트 인스턴스
 */
export const openai = createLLMClient();

/**
 * OpenAI API 설정 확인
 */
export function isLLMConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * 텍스트 임베딩 생성
 */
export async function createEmbedding(
  input: string,
  model: string = "text-embedding-3-small"
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model,
    input,
  });

  if (!response.data || response.data.length === 0) {
    throw new Error("임베딩 생성에 실패했습니다.");
  }

  return response.data[0].embedding;
}

