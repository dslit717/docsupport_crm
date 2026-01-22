import "server-only";
import { createLLMClient } from "../client";
import {
  KEYWORD_PROMPTS,
  createKeywordExtractionUserPrompt,
} from "../prompts";

export interface KeywordExtractionResult {
  postTitle: string;
  keywords: string[];
  extractedAt: string;
}

/**
 * 키워드 추출 LLM 서비스
 */
export class KeywordService {
  /**
   * 블로그 포스트 제목에서 SEO 키워드 추출
   */
  static async extractKeywordsFromTitle(
    postTitle: string
  ): Promise<KeywordExtractionResult> {
    if (!postTitle?.trim()) {
      throw new Error("포스트 제목이 필요합니다.");
    }

    console.log(`키워드 추출 시작: ${postTitle}`);

    const client = createLLMClient();

    const completion = await client.chat.completions.create({
      model: KEYWORD_PROMPTS.extraction.model,
      temperature: KEYWORD_PROMPTS.extraction.temperature,
      max_tokens: KEYWORD_PROMPTS.extraction.maxTokens,
      messages: [
        {
          role: "system",
          content: KEYWORD_PROMPTS.extraction.system,
        },
        {
          role: "user",
          content: createKeywordExtractionUserPrompt(postTitle),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("키워드 추출 응답이 비어있습니다.");
    }

    // JSON 파싱
    let keywords: string[];
    try {
      keywords = JSON.parse(content);
      if (!Array.isArray(keywords)) {
        throw new Error("키워드가 배열 형태가 아닙니다.");
      }
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);
      // 백업: 텍스트에서 키워드 추출 시도
      keywords = this.extractKeywordsFromText(content);
    }

    // 키워드 정제 및 검증
    keywords = keywords
      .filter((keyword) => keyword && typeof keyword === "string")
      .map((keyword) => keyword.trim().replace(/["""]/g, ""))
      .filter((keyword) => keyword.length > 1 && keyword.length < 50)
      .slice(0, 15); // 최대 15개로 제한

    console.log(`추출된 키워드 ${keywords.length}개:`, keywords);

    return {
      postTitle,
      keywords,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * 백업 키워드 추출 함수 (ChatGPT 응답이 JSON이 아닐 때)
   */
  private static extractKeywordsFromText(text: string): string[] {
    const keywords: string[] = [];

    // 따옴표로 둘러싸인 키워드 추출
    const quotedMatches = text.match(/"([^"]+)"/g);
    if (quotedMatches) {
      keywords.push(...quotedMatches.map((match) => match.replace(/"/g, "")));
    }

    // 줄바꿈으로 구분된 키워드 추출
    const lines = text.split("\n");
    for (const line of lines) {
      const cleaned = line
        .trim()
        .replace(/^[-•*]\s*/, "")
        .replace(/["""]/g, "");
      if (
        cleaned.length > 1 &&
        cleaned.length < 50 &&
        !cleaned.includes(":")
      ) {
        keywords.push(cleaned);
      }
    }

    // 중복 제거 및 정제
    return [...new Set(keywords)]
      .filter((keyword) => keyword.length > 1)
      .slice(0, 15);
  }
}

