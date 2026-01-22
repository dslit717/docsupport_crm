import "server-only";
import {
  NaverBlogSearchAPI,
  NaverSearchAdAPI,
  NaverSearchItem,
  extractPostId,
  extractVolumeData,
  cleanText,
  getNaverAPICredentials,
  isNaverAPIConfigured,
} from "./naver-api";

/**
 * 키워드 분석 라이브러리
 * Server-only 환경에서만 사용 가능
 */

export interface KeywordAnalysis {
  keyword: string;
  rank: number;
  isFound: boolean;
  competitionLevel: string;
  topCompetitors: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  monthlyPcSearchVolume?: number;
  monthlyMobileSearchVolume?: number;
  monthlyTotalSearchVolume?: number;
  avgCpc?: number;
  searchAdCompetitionLevel?: string;
  relatedKeywords?: string[];
  error?: string;
}

export interface KeywordAnalysisResult {
  keywords: KeywordAnalysis[];
  summary: KeywordSummary;
  analyzedAt: string;
}

export interface KeywordSummary {
  totalKeywords: number;
  foundCount: number;
  topRankedCount: number;
  averageRank: number;
  bestKeywords: Array<{
    keyword: string;
    rank: number;
    competitionLevel: string;
  }>;
  potentialKeywords: Array<{
    keyword: string;
    searchVolume: number;
    competitionLevel: string;
  }>;
  recommendations: string[];
}

export interface KeywordVolumeResult {
  keywords: Array<{
    keyword: string;
    monthlyPcSearchVolume: number;
    monthlyMobileSearchVolume: number;
    monthlyTotalSearchVolume: number;
    competitionLevel: string;
    avgCpc: number;
    competitionIndex: number;
    relatedKeywords?: string[];
    error?: string;
  }>;
  totalKeywords: number;
  retrievedAt: string;
}

/**
 * 키워드 순위 분석
 */
export async function analyzeKeywordRankings(
  keywords: string[],
  blogId: string,
  postUrl?: string
): Promise<KeywordAnalysisResult> {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    throw new Error("분석할 키워드가 필요합니다.");
  }

  if (!blogId) {
    throw new Error("블로그 ID가 필요합니다.");
  }

  console.log(`키워드 순위 분석 시작: ${keywords.length}개 키워드`);

  // 네이버 API 인증 정보
  const credentials = getNaverAPICredentials();

  // API 인스턴스 생성
  const blogSearchAPI = new NaverBlogSearchAPI(credentials);

  let searchAdAPI: NaverSearchAdAPI | null = null;
  if (isNaverAPIConfigured(true)) {
    searchAdAPI = new NaverSearchAdAPI(credentials);
  }

  const keywordAnalyses: KeywordAnalysis[] = [];

  // 각 키워드별로 순위 분석
  for (const keyword of keywords) {
    const cleanedKeyword = keyword.trim();
    try {
      console.log(`키워드 "${cleanedKeyword}" 분석 중...`);

      const analysis = await analyzeKeywordRanking(
        keyword,
        blogId,
        postUrl || "",
        blogSearchAPI
      );

      // 검색광고 API가 사용 가능한 경우 검색량 데이터 추가
      if (searchAdAPI) {
        try {
          const volumeData = await searchAdAPI.getMonthlySearchVolume([
            cleanedKeyword,
          ]);
          const extractedData = extractVolumeData(volumeData, keyword);

          analysis.monthlyPcSearchVolume = extractedData.monthlyPcSearchVolume;
          analysis.monthlyMobileSearchVolume =
            extractedData.monthlyMobileSearchVolume;
          analysis.monthlyTotalSearchVolume =
            extractedData.monthlyTotalSearchVolume;
          analysis.avgCpc = extractedData.avgCpc;
          analysis.searchAdCompetitionLevel = extractedData.competitionLevel;
          analysis.relatedKeywords = extractedData.relatedKeywords;
        } catch (volumeError) {
          console.error(`키워드 "${keyword}" 검색량 조회 실패:`, volumeError);
        }
      }

      keywordAnalyses.push(analysis);

      // API 호출 제한을 위한 딜레이 (100ms)
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`키워드 "${keyword}" 분석 오류:`, error);
      keywordAnalyses.push({
        keyword,
        rank: -1,
        isFound: false,
        competitionLevel: "알 수 없음",
        topCompetitors: [],
        error: error instanceof Error ? error.message : "분석 실패",
      });
    }
  }

  // 결과 요약 생성
  const summary = generateKeywordSummary(keywordAnalyses);

  return {
    keywords: keywordAnalyses,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * 개별 키워드 순위 분석
 */
async function analyzeKeywordRanking(
  keyword: string,
  blogId: string,
  postUrl: string,
  blogSearchAPI: NaverBlogSearchAPI
): Promise<KeywordAnalysis> {
  // 포스트 URL에서 포스트 ID 추출
  const targetPostId = extractPostId(postUrl);
  if (!targetPostId) {
    console.warn(`포스트 ID 추출 실패: ${postUrl}`);
  }

  console.log(
    `키워드 "${keyword}" 순위 분석 시작 (포스트 ID: ${targetPostId})`
  );

  // 블로그 검색 API 호출
  const searchData = await blogSearchAPI.searchBlog(
    keyword.replace(/\s+/g, ""),
    {
      display: 20,
      start: 1,
      sort: "sim",
    }
  );

  const results: NaverSearchItem[] = searchData.items || [];
  console.log(`키워드 "${keyword}" 검색 결과 ${results.length}개 발견`);

  // 순위 찾기 (포스트 ID 기반)
  let rank = -1;
  let isFound = false;

  for (let i = 0; i < results.length; i++) {
    const item: NaverSearchItem = results[i];
    if (item.link) {
      // 검색 결과의 링크에서 포스트 ID 추출
      const resultPostId = extractPostId(item.link);

      // 포스트 ID가 일치하는지 확인
      if (targetPostId && resultPostId === targetPostId) {
        rank = i + 1;
        isFound = true;
        console.log(
          `✅ 키워드 "${keyword}": 포스트 ID ${targetPostId} 발견됨 (${rank}위)`
        );
        break;
      }
    }
  }

  if (!isFound && targetPostId) {
    console.log(
      `❌ 키워드 "${keyword}": 포스트 ID ${targetPostId}가 검색 결과에서 발견되지 않음`
    );
  }

  // 경쟁자 분석
  const competitorCount = results.filter(
    (item: NaverSearchItem) => item.link && !item.link.includes(blogId)
  ).length;

  return {
    keyword,
    rank,
    isFound,
    competitionLevel: analyzeKeywordCompetition(
      results.length,
      competitorCount
    ),
    topCompetitors: results
      .filter(
        (item: NaverSearchItem) => item.link && !item.link.includes(blogId)
      )
      .slice(0, 3)
      .map((item: NaverSearchItem) => ({
        title: cleanText(item.title),
        url: item.link,
        description: cleanText(item.description),
      })),
  };
}

/**
 * 키워드 검색량 조회
 */
export async function getKeywordSearchVolume(
  keywords: string[]
): Promise<KeywordVolumeResult> {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    throw new Error("조회할 키워드가 필요합니다.");
  }

  if (!isNaverAPIConfigured(true)) {
    throw new Error("네이버 검색광고 API 인증 정보가 설정되지 않았습니다.");
  }

  console.log(`키워드 검색량 조회 시작: ${keywords.length}개 키워드`);

  // 네이버 API 인증 정보
  const credentials = getNaverAPICredentials();

  // SearchAdAPI 인스턴스 생성
  const searchAdAPI = new NaverSearchAdAPI(credentials);

  // 키워드별 검색량 조회
  const keywordVolumes = [];

  for (const keyword of keywords) {
    const cleanedKeyword = keyword.trim();
    try {
      console.log(`키워드 "${cleanedKeyword}" 검색량 조회 중...`);

      // 네이버 검색광고 API 호출 (정리된 키워드 사용)
      const data = await searchAdAPI.getMonthlySearchVolume([cleanedKeyword]);

      // API 응답에서 검색량 데이터 추출 (원본 키워드로 응답)
      const volumeData = extractVolumeData(data, keyword);
      keywordVolumes.push(volumeData);

      // API 호출 제한을 위한 딜레이 (200ms)
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`키워드 "${keyword}" 검색량 조회 오류:`, error);
      keywordVolumes.push({
        keyword,
        monthlyPcSearchVolume: 0,
        monthlyMobileSearchVolume: 0,
        monthlyTotalSearchVolume: 0,
        competitionLevel: "알 수 없음",
        avgCpc: 0,
        competitionIndex: 0,
        error: error instanceof Error ? error.message : "조회 실패",
      });
    }
  }

  console.log(`키워드 검색량 조회 완료: ${keywordVolumes.length}개 결과`);

  return {
    keywords: keywordVolumes,
    totalKeywords: keywords.length,
    retrievedAt: new Date().toISOString(),
  };
}

/**
 * 키워드 경쟁도 분석
 */
export function analyzeKeywordCompetition(
  totalResults: number,
  competitorCount: number
): string {
  if (totalResults < 50) return "낮음";
  if (totalResults < 200) return "보통";
  if (competitorCount > totalResults * 0.8) return "매우 높음";
  if (competitorCount > totalResults * 0.6) return "높음";
  return "보통";
}

/**
 * 키워드 분석 요약 생성
 */
export function generateKeywordSummary(
  analyses: KeywordAnalysis[]
): KeywordSummary {
  const foundKeywords = analyses.filter((a) => a.isFound);
  const topRanked = foundKeywords.filter((a) => a.rank <= 10);
  const avgRank =
    foundKeywords.length > 0
      ? Math.round(
          foundKeywords.reduce((sum, a) => sum + a.rank, 0) /
            foundKeywords.length
        )
      : 0;

  const bestKeywords = analyses
    .filter((a) => a.isFound && a.rank <= 20)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  const potentialKeywords = analyses
    .filter((a) => !a.isFound && a.competitionLevel === "낮음")
    .sort(
      (a, b) =>
        (b.monthlyTotalSearchVolume || 0) - (a.monthlyTotalSearchVolume || 0)
    )
    .slice(0, 3);

  return {
    totalKeywords: analyses.length,
    foundCount: foundKeywords.length,
    topRankedCount: topRanked.length,
    averageRank: avgRank,
    bestKeywords: bestKeywords.map((k) => ({
      keyword: k.keyword,
      rank: k.rank,
      competitionLevel: k.competitionLevel,
    })),
    potentialKeywords: potentialKeywords.map((k) => ({
      keyword: k.keyword,
      searchVolume: k.monthlyTotalSearchVolume || 0,
      competitionLevel: k.competitionLevel,
    })),
    recommendations: generateKeywordRecommendations(analyses),
  };
}

/**
 * 키워드 기반 추천 생성
 */
export function generateKeywordRecommendations(
  analyses: KeywordAnalysis[]
): string[] {
  const recommendations = [];
  const foundKeywords = analyses.filter((a) => a.isFound);
  const notFoundKeywords = analyses.filter((a) => !a.isFound);

  if (foundKeywords.length === 0) {
    recommendations.push(
      "🔍 검색 결과에 노출되지 않은 키워드가 많습니다. 콘텐츠 SEO 최적화가 필요합니다."
    );
  } else if (foundKeywords.length < analyses.length * 0.3) {
    recommendations.push(
      "📝 키워드 밀도를 높이고 제목과 본문에 핵심 키워드를 더 많이 포함하세요."
    );
  }

  const topRanked = foundKeywords.filter((a) => a.rank <= 5);
  if (topRanked.length > 0) {
    recommendations.push(
      `🎉 "${topRanked[0].keyword}" 등 ${topRanked.length}개 키워드가 상위 5위 내에 있습니다!`
    );
  }

  const lowCompetition = analyses.filter((a) => a.competitionLevel === "낮음");
  if (lowCompetition.length > 0) {
    recommendations.push(
      `🎯 "${lowCompetition[0].keyword}" 등 경쟁이 낮은 키워드를 활용해 더 많은 콘텐츠를 작성하세요.`
    );
  }

  const highCompetition = foundKeywords.filter(
    (a) => a.competitionLevel === "매우 높음"
  );
  if (highCompetition.length > 0) {
    recommendations.push(
      "⚡ 경쟁이 매우 높은 키워드는 롱테일 키워드로 세분화하는 것을 고려하세요."
    );
  }

  if (notFoundKeywords.length > analyses.length * 0.7) {
    recommendations.push(
      "📈 블로그 포스트의 키워드 최적화와 백링크 구축이 시급합니다."
    );
  }

  return recommendations;
}
