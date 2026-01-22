import "server-only";
import crypto from "crypto";

/**
 * 네이버 API 통합 라이브러리
 * Server-only 환경에서만 사용 가능
 */

// Base URL 상수
export const NAVER_API_URLS = {
  searchAd: "https://api.searchad.naver.com",
  searchOpen: "https://openapi.naver.com",
  datalab: "https://openapi.naver.com",
} as const;

// 타입 정의
export interface NaverAPICredentials {
  clientId: string;
  clientSecret: string;
  searchadAccessKey?: string;
  searchadSecretKey?: string;
  customerId?: string;
}

export interface NaverSearchItem {
  title: string;
  link: string;
  description: string;
  bloggername?: string;
  bloggerlink?: string;
  postdate?: string;
}

export interface BlogSearchOptions {
  display?: number;
  start?: number;
  sort?: "sim" | "date";
}

export interface KeywordVolumeData {
  keyword: string;
  monthlyPcSearchVolume: number;
  monthlyMobileSearchVolume: number;
  monthlyTotalSearchVolume: number;
  competitionLevel: string;
  avgCpc: number;
  competitionIndex: number;
  relatedKeywords?: string[];
  error?: string;
}

/**
 * 네이버 API 기본 관리자 클래스
 */
export class NaverAPIManager {
  protected credentials: NaverAPICredentials;

  constructor(credentials: NaverAPICredentials) {
    this.credentials = credentials;
  }

  /**
   * 검색광고 API 헤더 생성
   */
  protected getSearchAdHeaders(
    method: string,
    uri: string
  ): Record<string, string> {
    if (
      !this.credentials.searchadAccessKey ||
      !this.credentials.searchadSecretKey
    ) {
      throw new Error("검색광고 API 인증 정보가 필요합니다.");
    }

    const timestamp = Date.now().toString();
    const signatureString = `${timestamp}.${method}.${uri}`;
    const signature = crypto
      .createHmac("sha256", this.credentials.searchadSecretKey)
      .update(signatureString)
      .digest("base64");

    return {
      "X-Timestamp": timestamp,
      "X-API-KEY": this.credentials.searchadAccessKey,
      "X-Customer": this.credentials.customerId || "",
      "X-Signature": signature,
      "Content-Type": "application/json",
    };
  }

  /**
   * 오픈 API 헤더 생성
   */
  protected getOpenApiHeaders(): Record<string, string> {
    return {
      "X-Naver-Client-Id": this.credentials.clientId,
      "X-Naver-Client-Secret": this.credentials.clientSecret,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };
  }

  /**
   * 검색광고 API 요청
   */
  protected async searchAdRequest(
    method: string,
    url: string,
    params?: Record<string, any>
  ): Promise<any> {
    const uri = new URL(url).pathname;
    const headers = this.getSearchAdHeaders(method, uri);

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === "GET" && params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    console.log(`🔍 네이버 검색광고 API 요청: ${method} ${url}`);
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(
        `검색광고 API 요청 실패: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * 오픈 API 요청
   */
  protected async openApiRequest(
    method: string,
    url: string,
    params?: Record<string, any>
  ): Promise<any> {
    const headers = this.getOpenApiHeaders();

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === "GET" && params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    console.log(`🔍 네이버 오픈 API 요청: ${method} ${url}`);
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(
        `오픈 API 요청 실패: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }
}

/**
 * 네이버 블로그 검색 API 클래스
 */
export class NaverBlogSearchAPI extends NaverAPIManager {
  /**
   * 블로그 검색
   */
  async searchBlog(
    query: string,
    options: BlogSearchOptions = {}
  ): Promise<{
    items: NaverSearchItem[];
    total: number;
    start: number;
    display: number;
  }> {
    const url = `${NAVER_API_URLS.searchOpen}/v1/search/blog.json`;

    const params = {
      query: query.toString(),
      display: (options.display || 100).toString(),
      start: (options.start || 1).toString(),
      sort: options.sort || "sim",
    };

    const result = await this.openApiRequest("GET", url, params);

    return {
      items: result.items || [],
      total: result.total || 0,
      start: result.start || 1,
      display: result.display || 0,
    };
  }
}

/**
 * 네이버 검색광고 API 클래스
 */
export class NaverSearchAdAPI extends NaverAPIManager {
  /**
   * 월간 검색량 조회
   */
  async getMonthlySearchVolume(keywords: string[]): Promise<any> {
    const uri = "/keywordstool";
    const url = `${NAVER_API_URLS.searchAd}${uri}`;

    // 키워드에서 공백 제거
    const cleanedKeywords = Array.isArray(keywords)
      ? keywords.map((k) => k.replace(/\s+/g, ""))
      : [String(keywords).replace(/\s+/g, "")];

    const params = {
      hintKeywords: cleanedKeywords.join(","),
      showDetail: "1",
    };

    return await this.searchAdRequest("GET", url, params);
  }

  /**
   * 키워드 경쟁도 조회
   */
  async getCompetitionLevel(keyword: string): Promise<any> {
    const uri = "/keywordstool";
    const url = `${NAVER_API_URLS.searchAd}${uri}`;

    const cleanedKeyword = String(keyword).replace(/\s+/g, "");

    const params = {
      hintKeywords: cleanedKeyword,
      showDetail: "1",
    };

    return await this.searchAdRequest("GET", url, params);
  }

  /**
   * 연관 키워드 조회
   */
  async getRelatedKeywords(keyword: string): Promise<any> {
    const uri = "/keywordstool";
    const url = `${NAVER_API_URLS.searchAd}${uri}`;

    const cleanedKeyword = String(keyword).replace(/\s+/g, "");

    const params = {
      hintKeywords: cleanedKeyword,
      showDetail: "1",
    };

    return await this.searchAdRequest("GET", url, params);
  }
}

/**
 * 환경 변수에서 네이버 API 인증 정보 추출
 */
export function getNaverAPICredentials(): NaverAPICredentials {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const searchadAccessKey = process.env.NAVER_SEARCHAD_ACCESS_KEY;
  const searchadSecretKey = process.env.NAVER_SEARCHAD_SECRET_KEY;
  const customerId = process.env.NAVER_SEARCHAD_CUSTOMER_ID;

  if (!clientId || !clientSecret) {
    throw new Error(
      "네이버 오픈 API 인증 정보(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)가 설정되지 않았습니다."
    );
  }

  return {
    clientId,
    clientSecret,
    searchadAccessKey,
    searchadSecretKey,
    customerId,
  };
}

/**
 * 네이버 API 인증 정보 확인
 */
export function isNaverAPIConfigured(
  includeSearchAd: boolean = false
): boolean {
  try {
    const credentials = getNaverAPICredentials();
    if (includeSearchAd) {
      return !!(
        credentials.searchadAccessKey &&
        credentials.searchadSecretKey &&
        credentials.customerId
      );
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 네이버 검색광고 API 응답에서 검색량 데이터 추출
 */
export function extractVolumeData(
  apiResponse: any,
  keyword: string
): KeywordVolumeData {
  try {
    const keywordList = apiResponse.keywordList || [];

    // 정확히 일치하는 키워드 찾기
    let targetKeywordData = keywordList.find(
      (item: any) => item.relKeyword === keyword || item.keyword === keyword
    );

    // 정확한 매치가 없으면 첫 번째 결과 사용
    if (!targetKeywordData && keywordList.length > 0) {
      targetKeywordData = keywordList[0];
    }

    if (!targetKeywordData) {
      return {
        keyword,
        monthlyPcSearchVolume: 0,
        monthlyMobileSearchVolume: 0,
        monthlyTotalSearchVolume: 0,
        competitionLevel: "데이터 없음",
        avgCpc: 0,
        competitionIndex: 0,
        error: "검색량 데이터를 찾을 수 없습니다.",
      };
    }

    // 월간 검색량 추출
    const monthlyPcSearchVolume = parseInt(
      targetKeywordData.monthlyPcQcCnt || "0"
    );
    const monthlyMobileSearchVolume = parseInt(
      targetKeywordData.monthlyMobileQcCnt || "0"
    );
    const monthlyTotalSearchVolume =
      monthlyPcSearchVolume + monthlyMobileSearchVolume;

    const avgCpc = parseInt(targetKeywordData.avgCpc || "0");
    const competitionIndex = parseFloat(targetKeywordData.plAvgDepth || "0");

    // 경쟁도 레벨 계산
    const competitionLevel = calculateCompetitionLevel(
      competitionIndex,
      avgCpc
    );

    return {
      keyword,
      monthlyPcSearchVolume,
      monthlyMobileSearchVolume,
      monthlyTotalSearchVolume,
      competitionLevel,
      avgCpc,
      competitionIndex,
      relatedKeywords: keywordList
        .slice(1, 4)
        .map((item: any) => item.relKeyword || item.keyword)
        .filter(Boolean),
    };
  } catch (error) {
    console.error(`키워드 "${keyword}" 데이터 추출 오류:`, error);
    return {
      keyword,
      monthlyPcSearchVolume: 0,
      monthlyMobileSearchVolume: 0,
      monthlyTotalSearchVolume: 0,
      competitionLevel: "추출 실패",
      avgCpc: 0,
      competitionIndex: 0,
      error: "데이터 추출 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 경쟁도 레벨 계산
 */
export function calculateCompetitionLevel(
  competitionIndex: number,
  avgCpc: number
): string {
  if (competitionIndex === 0 && avgCpc === 0) return "데이터 없음";

  if (competitionIndex >= 8 || avgCpc >= 1000) return "매우 높음";
  if (competitionIndex >= 6 || avgCpc >= 500) return "높음";
  if (competitionIndex >= 4 || avgCpc >= 200) return "보통";
  if (competitionIndex >= 2 || avgCpc >= 100) return "낮음";
  return "매우 낮음";
}

/**
 * 포스트 URL에서 포스트 ID 추출
 */
export function extractPostId(url: string): string | null {
  try {
    const patterns = [
      // URL 패턴: https://m.blog.naver.com/blogId/{postId}?reffercode=1
      /\/([^\/]+)\/(\d+)(?:\?|$)/,
      // URL 패턴: https://m.blog.naver.com/PostView.naver?blogId=xxx&logNo=222222222
      /logNo=(\d+)/,
      // URL 패턴: https://blog.naver.com/PostView.nhn?blogId=xxx&logNo=222222222
      /logNo=(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // logNo 패턴인 경우
        if (pattern.source.includes("logNo")) {
          return match[1]; // logNo 값이 postId
        }
        // URL 경로 패턴인 경우
        else {
          return match[2]; // 두 번째 캡처 그룹이 postId
        }
      }
    }

    console.warn(`포스트 ID 추출 실패: ${url}`);
    return null;
  } catch (error) {
    console.error(`포스트 ID 추출 중 오류: ${url}`, error);
    return null;
  }
}

/**
 * HTML 텍스트 정제
 */
export function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // HTML 태그 제거
    .replace(/&[^;]+;/g, "") // HTML 엔티티 제거
    .toLowerCase()
    .trim();
}
