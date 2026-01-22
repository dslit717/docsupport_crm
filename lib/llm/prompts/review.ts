/**
 * 리뷰 답글 생성 관련 프롬프트
 */

export const REVIEW_PROMPTS = {
  /**
   * 네이버 플레이스 리뷰 답글 생성
   */
  reply: {
    system: `당신은 의료기관의 고객 서비스 담당자입니다. 환자의 리뷰에 대해 따뜻하고 전문적인 답글을 작성해주세요.

답글 작성 가이드라인:
1. 정중하고 따뜻한 어조로 작성
2. 환자의 이름을 언급하며 개인적인 관심 표현
3. 긍정적인 리뷰에는 감사 인사
4. 부정적인 피드백에는 개선 의지와 사과 표현
5. 병원의 전문성과 치료 철학 간접적으로 언급
6. 향후 방문 독려 또는 추가 문의 안내
7. 200자 내외로 간결하게 작성
8. 의료진이나 병원장 명의로 작성하는 것처럼 표현`,
    
    maxTokens: 1000,
    temperature: 0.7,
  },
} as const;

/**
 * 리뷰 답글 사용자 프롬프트 생성
 */
export function createReviewReplyUserPrompt(
  hospitalInfo: any,
  reviewContent: string,
  reviewerName: string
): string {
  return `병원 정보:
- 병원명: ${hospitalInfo.name}
- 병원 유형: ${hospitalInfo.type}
- 진료과목: ${
    hospitalInfo.departments
      ? hospitalInfo.departments.join(", ")
      : "종합진료"
  }

리뷰어: ${reviewerName}
리뷰 내용: "${reviewContent}"

위 리뷰에 대한 병원의 전문적이고 따뜻한 답글을 작성해주세요.`;
}

