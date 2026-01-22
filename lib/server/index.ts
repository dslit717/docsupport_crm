import "server-only";

/**
 * 서버 전용 라이브러리 인덱스
 * 모든 서버 라이브러리를 통합 export
 */

// Firecrawl 관련
export {
  scrapeWithFirecrawl,
  extractWithFirecrawl,
  isFirecrawlConfigured,
  type FirecrawlScrapeOptions,
  type FirecrawlResponse,
  type FirecrawlExtractOptions,
  type FirecrawlExtractResponse,
} from "./firecrawl";

// 병원 정보 검색 관련
export {
  findHospitalPlace,
  generateHospitalPlaceUrl,
  extractPlaceId,
  type HospitalInfo,
  type HospitalSearchResult,
} from "./hospital-finder";

// 네이버 API 관련
export {
  NaverAPIManager,
  NaverBlogSearchAPI,
  NaverSearchAdAPI,
  getNaverAPICredentials,
  isNaverAPIConfigured,
  extractVolumeData,
  calculateCompetitionLevel,
  extractPostId,
  cleanText,
  NAVER_API_URLS,
  type NaverAPICredentials,
  type NaverSearchItem,
  type BlogSearchOptions,
  type KeywordVolumeData,
} from "./naver-api";

// 키워드 분석 관련
export {
  analyzeKeywordRankings,
  getKeywordSearchVolume,
  analyzeKeywordCompetition,
  generateKeywordSummary,
  generateKeywordRecommendations,
  type KeywordAnalysis,
  type KeywordAnalysisResult,
  type KeywordSummary,
  type KeywordVolumeResult,
} from "./keyword-analysis";

// OpenAI API 관련
export {
  createOpenAIClient,
  isOpenAIConfigured,
  extractKeywordsFromTitle,
  createChatCompletion,
  generateMarketingAnalysis,
  generateHRAnalysis,
  generateCEOReport,
  generateMarketingData,
  generateHRData,
  generateCEOData,
  generateReviewReply,
  type OpenAIConfig,
  type KeywordExtractionResult,
  type ChatCompletionOptions,
} from "./openai-api";

// 네이버 플레이스 크롤링 관련
export {
  crawlNaverPlaceReviews,
  extractNaverPlaceId,
  generateNaverPlaceUrl,
  isValidNaverPlaceUrl,
  extractReviewKeywords,
  type NaverPlaceReview,
  type NaverPlaceStats,
  type NaverPlaceCrawlResult,
} from "./naver-place-crawler";

// 유튜브 채널 크롤링 관련
export {
  extractYoutubeChannelInfo,
  isValidYoutubeUrl,
  normalizeYoutubeUrl,
  generateYoutubeAnalysis,
  extractChannelInfoFromHtml,
  type YoutubeChannelInfo,
  type YoutubeAnalysisResult,
} from "./youtube-crawler";

// 유튜브 서버 액션
export {
  crawlYoutubeChannelAction,
  searchYoutubeChannelAction,
} from "./youtube-actions";

// 인스타그램 크롤링 관련
export {
  extractInstagramUsername,
  isValidInstagramUrl,
  isValidInstagramUsername,
  generateInstagramAnalysis,
  type InstagramProfileInfo,
  type InstagramAnalysisResult,
} from "./instagram-crawler";

// 인스타그램 서버 액션
export { crawlInstagramProfileAction } from "./instagram-actions";
