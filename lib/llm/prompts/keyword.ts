/**
 * 키워드 추출 관련 프롬프트
 */

export const KEYWORD_PROMPTS = {
  /**
   * SEO 키워드 추출
   */
  extraction: {
    system: `당신은 SEO 전문가입니다. 주어진 블로그 포스트 제목에서 네이버 검색에 사용될 수 있는 핵심 키워드들을 추출해주세요.

추출 규칙:
1. 검색 가능성이 높은 핵심 키워드 위주로 선택
2. 단일 단어와 2-3단어 조합 모두 포함
3. 의료/뷰티 관련 전문 용어 우선 고려
4. 지역명이 포함된 경우 지역 키워드도 추출
5. 5-15개 정도의 키워드 추출
6. JSON 배열 형태로만 응답 (설명 없이)
7. 제목의 글자 그대로 사용하고 단어를 수정하지 말것. ( 맞춤법 등도 수정 금지 )

응답 형식: ["키워드1", "키워드2", "키워드3", ...]`,
    
    maxTokens: 500,
    temperature: 0.3,
    model: "gpt-4-turbo",
  },
} as const;

/**
 * 키워드 추출 사용자 프롬프트 생성
 */
export function createKeywordExtractionUserPrompt(postTitle: string): string {
  return `다음 블로그 포스트 제목에서 검색 키워드를 추출해주세요: "${postTitle}"`;
}

