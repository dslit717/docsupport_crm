import "server-only";
import OpenAI from "openai";

/**
 * OpenAI API 통합 라이브러리
 * Server-only 환경에서만 사용 가능
 */

export interface OpenAIConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface KeywordExtractionResult {
  postTitle: string;
  keywords: string[];
  extractedAt: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenAI API 클라이언트 생성
 */
export function createOpenAIClient(config?: OpenAIConfig): OpenAI {
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
export const openai = createOpenAIClient();

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

/**
 * OpenAI API 설정 확인
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * 블로그 포스트 제목에서 SEO 키워드 추출
 */
export async function extractKeywordsFromTitle(
  postTitle: string,
  options: ChatCompletionOptions = {}
): Promise<KeywordExtractionResult> {
  if (!postTitle?.trim()) {
    throw new Error("포스트 제목이 필요합니다.");
  }

  console.log(`키워드 추출 시작: ${postTitle}`);

  const openai = createOpenAIClient();

  // ChatGPT를 사용하여 키워드 추출
  const completion = await openai.chat.completions.create({
    model: options.model || "gpt-4-turbo",
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens || 500,
    messages: [
      {
        role: "system",
        content: `당신은 SEO 전문가입니다. 주어진 블로그 포스트 제목에서 네이버 검색에 사용될 수 있는 핵심 키워드들을 추출해주세요.

추출 규칙:
1. 검색 가능성이 높은 핵심 키워드 위주로 선택
2. 단일 단어와 2-3단어 조합 모두 포함
3. 의료/뷰티 관련 전문 용어 우선 고려
4. 지역명이 포함된 경우 지역 키워드도 추출
5. 5-15개 정도의 키워드 추출
6. JSON 배열 형태로만 응답 (설명 없이)
7. 제목의 글자 그대로 사용하고 단어를 수정하지 말것. ( 맞춤법 등도 수정 금지 )

응답 형식: ["키워드1", "키워드2", "키워드3", ...]`,
      },
      {
        role: "user",
        content: `다음 블로그 포스트 제목에서 검색 키워드를 추출해주세요: "${postTitle}"`,
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
    keywords = extractKeywordsFromText(content);
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
 * 일반적인 Chat Completion 요청
 */
export async function createChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const openai = createOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: options.model || "gpt-4-turbo",
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens || 1000,
    messages,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 응답이 비어있습니다.");
  }

  return content;
}

/**
 * 마케팅 분석 생성
 */
export async function generateMarketingAnalysis(
  companyName: string,
  industry: string,
  targetAudience: string,
  goals: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `당신은 마케팅 전략 전문가입니다. 회사의 정보를 바탕으로 효과적인 마케팅 분석을 제공해주세요.

분석에 포함할 내용:
1. 타겟 고객 분석
2. 경쟁사 분석
3. SWOT 분석
4. 마케팅 전략 추천
5. 예상 ROI 및 KPI

마케팅 분석은 실행 가능하고 구체적이어야 합니다.`,
    },
    {
      role: "user",
      content: `다음 회사에 대한 마케팅 분석을 작성해주세요:
- 회사명: ${companyName}
- 업종: ${industry}
- 타겟 고객: ${targetAudience}
- 목표: ${goals}`,
    },
  ];

  return createChatCompletion(messages, options);
}

/**
 * HR 분석 생성
 */
export async function generateHRAnalysis(
  companyName: string,
  industry: string,
  employeeCount: number,
  hrChallenges: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `당신은 인사 관리 전문가입니다. 회사의 정보를 바탕으로 효과적인 HR 분석을 제공해주세요.

분석에 포함할 내용:
1. 현재 HR 상황 분석
2. 인력 관리 전략
3. 채용 및 교육 계획
4. 직원 만족도 개선 방안
5. HR 시스템 개선 제안

HR 분석은 실행 가능하고 구체적이어야 합니다.`,
    },
    {
      role: "user",
      content: `다음 회사에 대한 HR 분석을 작성해주세요:
- 회사명: ${companyName}
- 업종: ${industry}
- 직원 수: ${employeeCount}명
- HR 과제: ${hrChallenges}`,
    },
  ];

  return createChatCompletion(messages, options);
}

/**
 * CEO 보고서 생성
 */
export async function generateCEOReport(
  companyName: string,
  industry: string,
  revenue: number,
  period: string,
  keyMetrics: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `당신은 경영 전략 컨설턴트입니다. 회사의 정보를 바탕으로 CEO를 위한 종합적인 경영 보고서를 작성해주세요.

보고서에 포함할 내용:
1. 경영 성과 요약
2. 주요 지표 분석
3. 시장 동향 및 경쟁사 분석
4. 리스크 요인 및 기회 요소
5. 향후 전략 제안

보고서는 경영진이 의사결정에 활용할 수 있도록 구체적이고 실행 가능해야 합니다.`,
    },
    {
      role: "user",
      content: `다음 회사에 대한 CEO 보고서를 작성해주세요:
- 회사명: ${companyName}
- 업종: ${industry}
- 매출: ${revenue}원
- 기간: ${period}
- 주요 지표: ${keyMetrics}`,
    },
  ];

  return createChatCompletion(messages, options);
}

/**
 * 데이터 생성 (마케팅용)
 */
export async function generateMarketingData(
  dataType: string,
  parameters: Record<string, any>,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `당신은 마케팅 데이터 분석가입니다. 요청된 유형의 마케팅 데이터를 생성해주세요.

데이터는 다음 형식으로 제공해주세요:
1. JSON 형태로 구조화된 데이터
2. 실제 마케팅에서 활용 가능한 현실적인 수치
3. 일관성 있는 데이터 구조
4. 명확한 설명과 함께

생성할 데이터는 실제 비즈니스에서 활용할 수 있을 정도로 정확하고 유용해야 합니다.`,
    },
    {
      role: "user",
      content: `다음 조건에 맞는 마케팅 데이터를 생성해주세요:
- 데이터 유형: ${dataType}
- 매개변수: ${JSON.stringify(parameters, null, 2)}`,
    },
  ];

  return createChatCompletion(messages, options);
}

/**
 * 데이터 생성 (HR용)
 */
export async function generateHRData(
  dataType: string,
  parameters: Record<string, any>,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `당신은 HR 데이터 분석가입니다. 요청된 유형의 HR 데이터를 생성해주세요.

데이터는 다음 형식으로 제공해주세요:
1. JSON 형태로 구조화된 데이터
2. 실제 HR 관리에서 활용 가능한 현실적인 수치
3. 일관성 있는 데이터 구조
4. 명확한 설명과 함께

생성할 데이터는 실제 인사 관리에서 활용할 수 있을 정도로 정확하고 유용해야 합니다.`,
    },
    {
      role: "user",
      content: `다음 조건에 맞는 HR 데이터를 생성해주세요:
- 데이터 유형: ${dataType}
- 매개변수: ${JSON.stringify(parameters, null, 2)}`,
    },
  ];

  return createChatCompletion(messages, options);
}

/**
 * 데이터 생성 (CEO용)
 */
export async function generateCEOData(
  dataType: string,
  parameters: Record<string, any>,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `당신은 경영 데이터 분석가입니다. 요청된 유형의 경영 데이터를 생성해주세요.

데이터는 다음 형식으로 제공해주세요:
1. JSON 형태로 구조화된 데이터
2. 실제 경영에서 활용 가능한 현실적인 수치
3. 일관성 있는 데이터 구조
4. 명확한 설명과 함께

생성할 데이터는 실제 경영 의사결정에서 활용할 수 있을 정도로 정확하고 유용해야 합니다.`,
    },
    {
      role: "user",
      content: `다음 조건에 맞는 경영 데이터를 생성해주세요:
- 데이터 유형: ${dataType}
- 매개변수: ${JSON.stringify(parameters, null, 2)}`,
    },
  ];

  return createChatCompletion(messages, options);
}

/**
 * 백업 키워드 추출 함수 (ChatGPT 응답이 JSON이 아닐 때)
 */
function extractKeywordsFromText(text: string): string[] {
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
    if (cleaned.length > 1 && cleaned.length < 50 && !cleaned.includes(":")) {
      keywords.push(cleaned);
    }
  }

  // 중복 제거 및 정제
  return [...new Set(keywords)]
    .filter((keyword) => keyword.length > 1)
    .slice(0, 15);
}

/**
 * 네이버 플레이스 리뷰에 대한 병원 답글 생성
 */
export async function generateReviewReply(
  hospitalInfo: any,
  reviewContent: string,
  reviewerName: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `당신은 의료기관의 고객 서비스 담당자입니다. 환자의 리뷰에 대해 따뜻하고 전문적인 답글을 작성해주세요.

답글 작성 가이드라인:
1. 정중하고 따뜻한 어조로 작성
2. 환자의 이름을 언급하며 개인적인 관심 표현
3. 긍정적인 리뷰에는 감사 인사
4. 부정적인 피드백에는 개선 의지와 사과 표현
5. 병원의 전문성과 치료 철학 간접적으로 언급
6. 향후 방문 독려 또는 추가 문의 안내
7. 200자 내외로 간결하게 작성
8. 의료진이나 병원장 명의로 작성하는 것처럼 표현`,
    },
    {
      role: "user",
      content: `병원 정보:
- 병원명: ${hospitalInfo.name}
- 병원 유형: ${hospitalInfo.type}
- 진료과목: ${
        hospitalInfo.departments
          ? hospitalInfo.departments.join(", ")
          : "종합진료"
      }

리뷰어: ${reviewerName}
리뷰 내용: "${reviewContent}"

위 리뷰에 대한 병원의 전문적이고 따뜻한 답글을 작성해주세요.`,
    },
  ];

  return await createChatCompletion(messages, options);
}
