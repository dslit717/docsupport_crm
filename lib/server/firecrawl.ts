import "server-only";

/**
 * Firecrawl API 클라이언트 라이브러리
 * Server-only 환경에서만 사용 가능
 */

export interface FirecrawlScrapeOptions {
  onlyMainContent?: boolean;
  maxAge?: number;
  formats?: string[];
}

export interface FirecrawlResponse {
  success: boolean;
  data?: {
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  };
  error?: string;
}

export interface FirecrawlExtractOptions {
  prompt: string;
  schema: any;
}

export interface FirecrawlExtractResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Firecrawl API를 사용하여 페이지를 스크래핑합니다.
 */
export async function scrapeWithFirecrawl(
  url: string,
  options: FirecrawlScrapeOptions = {}
): Promise<FirecrawlResponse> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY가 설정되지 않았습니다.");
  }

  try {
    const firecrawlUrl = "https://api.firecrawl.dev/v2/scrape";
    const requestOptions = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        onlyMainContent: options.onlyMainContent ?? true,
        maxAge: options.maxAge ?? 172800000, // 48시간
        formats: options.formats ?? ["html"],
      }),
    };

    console.log(`🔥 Firecrawl API 호출 시작: ${url}`);
    const response = await fetch(firecrawlUrl, requestOptions);

    if (!response.ok) {
      throw new Error(
        `Firecrawl API 오류: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      console.error("Firecrawl 스크래핑 실패:", result.error);
      return {
        success: false,
        error: result.error || "알 수 없는 스크래핑 오류",
      };
    }

    console.log(
      `✅ Firecrawl 스크래핑 성공 - HTML 길이: ${
        result.data?.html?.length || 0
      }`
    );

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Firecrawl 스크래핑 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * Firecrawl API를 사용하여 구조화된 데이터를 추출합니다.
 */
export async function extractWithFirecrawl(
  urls: string[],
  options: FirecrawlExtractOptions
): Promise<FirecrawlExtractResponse> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY가 설정되지 않았습니다.");
  }

  try {
    // FirecrawlAppV1 대신 직접 API 호출
    const firecrawlUrl = "https://api.firecrawl.dev/v2/extract";
    const requestOptions = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls,
        prompt: options.prompt,
        schema: options.schema,
      }),
    };

    console.log(`🔥 Firecrawl Extract API 호출 시작`);
    const response = await fetch(firecrawlUrl, requestOptions);

    if (!response.ok) {
      throw new Error(
        `Firecrawl Extract API 오류: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      console.error("Firecrawl 추출 실패:", result.error);
      return {
        success: false,
        error: result.error || "알 수 없는 추출 오류",
      };
    }

    console.log(`✅ Firecrawl 추출 성공`);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Firecrawl 추출 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * Firecrawl API 키가 설정되어 있는지 확인합니다.
 */
export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}
