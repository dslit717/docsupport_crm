import "server-only";
import { createLLMClient } from "../client";
import { REVIEW_PROMPTS, createReviewReplyUserPrompt } from "../prompts";

/**
 * 리뷰 답글 생성 LLM 서비스
 */
export class ReviewService {
  /**
   * 네이버 플레이스 리뷰에 대한 병원 답글 생성
   */
  static async generateReviewReply(
    hospitalInfo: any,
    reviewContent: string,
    reviewerName: string
  ): Promise<string> {
    const client = createLLMClient();

    const messages = [
      {
        role: "system" as const,
        content: REVIEW_PROMPTS.reply.system,
      },
      {
        role: "user" as const,
        content: createReviewReplyUserPrompt(
          hospitalInfo,
          reviewContent,
          reviewerName
        ),
      },
    ];

    const response = await client.chat.completions.create({
      temperature: REVIEW_PROMPTS.reply.temperature,
      max_tokens: REVIEW_PROMPTS.reply.maxTokens,
      messages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("답글 생성 응답이 비어있습니다.");
    }

    return content;
  }
}

