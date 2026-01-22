import "server-only";
import { scrapeWithFirecrawl } from "./firecrawl";
import * as cheerio from "cheerio";

/**
 * 네이버 스마트 플레이스 리뷰 크롤링 라이브러리
 * Server-only 환경에서만 사용 가능
 */

export interface NaverPlaceReview {
  reviewerName: string;
  reviewerProfile?: string;
  reviewerStats?: {
    reviews: number;
    photos: number;
    followers?: number;
  };
  rating?: number;
  visitDate?: string;
  visitInfo?: {
    reservationType?: string; // "예약 후 이용" | "예약 없이 이용"
    waitTime?: string; // "30분 이내" | "1시간 이상" 등
    visitCount?: string; // "1번째 방문" 등
    verificationMethod?: string; // "영수증" 등
    visitDate?: string; // 방문일
  };
  content: string;
  photos?: string[];
  hasReply: boolean;
  reply?: {
    hospitalName: string;
    replyDate: string;
    content: string;
  };
  reactions?: number;
}

export interface NaverPlaceStats {
  totalVisitorReviews: number;
  totalBlogReviews: number;
  rating: number;
  placeId: string;
  placeName: string;
}

export interface NaverPlaceCrawlResult {
  success: boolean;
  data?: {
    stats: NaverPlaceStats;
    reviews: NaverPlaceReview[];
  };
  error?: string;
}

export interface NaverPlaceInfo {
  placeName: string;
  placeId: string;
  description?: string; // 소개말
  keywords?: string[]; // 대표키워드
}

export interface NaverPlaceInfoResult {
  success: boolean;
  data?: NaverPlaceInfo;
  error?: string;
}

/**
 * 네이버 플레이스 URL에서 Place ID 추출
 */
export function extractNaverPlaceId(url: string): string | null {
  try {
    // URL 패턴: https://m.place.naver.com/hospital/1513557735/review/visitor
    const patterns = [
      /\/hospital\/(\d+)\//, // 병원
      /\/place\/(\d+)\//, // 일반 플레이스
      /\/restaurant\/(\d+)\//, // 음식점
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    console.warn(`Place ID 추출 실패: ${url}`);
    return null;
  } catch (error) {
    console.error(`Place ID 추출 중 오류: ${url}`, error);
    return null;
  }
}

/**
 * 네이버 플레이스 URL 생성
 */
export function generateNaverPlaceUrl(
  placeId: string,
  type: "visitor" | "ugc" = "visitor"
): string {
  return `https://m.place.naver.com/hospital/${placeId}/review/${type}?entry=pll&type=list`;
}

/**
 * 네이버 플레이스 리뷰 통계 추출
 */
function extractPlaceStats(
  $: cheerio.CheerioAPI,
  placeId: string
): NaverPlaceStats {
  const placeName = $("h1").first().text().trim() || "알 수 없음";

  // 방문자 리뷰 수 추출
  let totalVisitorReviews = 0;
  const visitorReviewElement = $('a[href*="/review/visitor"]');
  if (visitorReviewElement.length > 0) {
    const visitorText = visitorReviewElement.text();
    const visitorMatch = visitorText.match(/방문자\s*리뷰\s*(\d+)/);
    if (visitorMatch) {
      totalVisitorReviews = parseInt(visitorMatch[1]);
    }
  }

  // 블로그 리뷰 수 추출
  let totalBlogReviews = 0;
  const blogReviewElement = $('a[href*="/review/ugc"]');
  if (blogReviewElement.length > 0) {
    const blogText = blogReviewElement.text();
    const blogMatch = blogText.match(/블로그\s*리뷰\s*(\d+)/);
    if (blogMatch) {
      totalBlogReviews = parseInt(blogMatch[1]);
    }
  }

  // 별점 추출 (있다면)
  let rating = 0;
  const ratingElement = $('.place_rating, .rating, [class*="rating"]');
  if (ratingElement.length > 0) {
    const ratingText = ratingElement.text();
    const ratingMatch = ratingText.match(/([\d.]+)/);
    if (ratingMatch) {
      rating = parseFloat(ratingMatch[1]);
    }
  }

  return {
    totalVisitorReviews,
    totalBlogReviews,
    rating,
    placeId,
    placeName,
  };
}

/**
 * 리뷰 데이터 추출
 */
function extractReviews($: cheerio.CheerioAPI): NaverPlaceReview[] {
  const reviews: NaverPlaceReview[] = [];

  // 리뷰 리스트 찾기
  const reviewList = $('#_review_list li, .review_list li, [id*="review"] li');

  reviewList.each((index, element) => {
    try {
      const $review = $(element);

      // 리뷰어 정보 추출
      const reviewerName = $review
        .find('.pui__NMi-Dp, [class*="reviewer"], [class*="name"]')
        .first()
        .text()
        .trim();
      if (!reviewerName) return; // 리뷰어 이름이 없으면 스킵

      const reviewerProfile =
        $review.find('a[href*="/my/"]').attr("href") || undefined;

      // 리뷰어 통계 추출
      let reviewerStats: NaverPlaceReview["reviewerStats"] = undefined;
      const statsElements = $review.find('.pui__WN-kAf, [class*="stats"]');
      if (statsElements.length > 0) {
        let reviews = 0;
        let photos = 0;
        let followers = 0;

        statsElements.each((_, statEl) => {
          const statText = $(statEl).text();
          if (statText.includes("리뷰")) {
            const match = statText.match(/리뷰\s*(\d+)/);
            if (match) reviews = parseInt(match[1]);
          } else if (statText.includes("사진")) {
            const match = statText.match(/사진\s*(\d+)/);
            if (match) photos = parseInt(match[1]);
          } else if (statText.includes("팔로워")) {
            const match = statText.match(/팔로워\s*(\d+)/);
            if (match) followers = parseInt(match[1]);
          }
        });

        if (reviews > 0 || photos > 0 || followers > 0) {
          reviewerStats = { reviews, photos };
          if (followers > 0) reviewerStats.followers = followers;
        }
      }

      // 방문 정보 추출
      let visitInfo: NaverPlaceReview["visitInfo"] = undefined;
      const visitElements = $review.find('.pui__V8F9nN, [class*="visit"]');
      if (visitElements.length > 0) {
        visitInfo = {};
        visitElements.each((_, visitEl) => {
          const visitText = $(visitEl).text();
          if (visitText.includes("예약")) {
            visitInfo!.reservationType = visitText.includes("예약 후")
              ? "예약 후 이용"
              : "예약 없이 이용";
          } else if (visitText.includes("대기")) {
            const match = visitText.match(/대기\s*시간\s*(.+)/);
            if (match) visitInfo!.waitTime = match[1].trim();
          }
        });
      }

      // 방문일과 방문 횟수 추출
      let visitDate: string | undefined;
      let visitCount: string | undefined;
      let verificationMethod: string | undefined;

      const dateElements = $review.find('.pui__gfuUIT, [class*="date"], time');
      dateElements.each((_, dateEl) => {
        const dateText = $(dateEl).text();
        if (dateText.match(/\d+\.\d+\./)) {
          visitDate = dateText;
        } else if (dateText.includes("방문")) {
          visitCount = dateText;
        } else if (dateText.includes("영수증") || dateText.includes("인증")) {
          verificationMethod = dateText;
        }
      });

      if (visitDate || visitCount || verificationMethod) {
        if (!visitInfo) visitInfo = {};
        if (visitDate) visitInfo.visitDate = visitDate;
        if (visitCount) visitInfo.visitCount = visitCount;
        if (verificationMethod)
          visitInfo.verificationMethod = verificationMethod;
      }

      // 리뷰 내용 추출
      const contentElement = $review
        .find('.pui__vn15t2, [class*="content"], [class*="text"]')
        .first();
      const content = contentElement.text().trim();
      if (!content) return; // 내용이 없으면 스킵

      // 사진 추출
      const photos: string[] = [];
      const photoElements = $review.find(
        'img[src*="pup-review"], img[class*="review"], .place_thumb img'
      );
      photoElements.each((_, photoEl) => {
        const src = $(photoEl).attr("src");
        if (src && src.startsWith("http")) {
          photos.push(src);
        }
      });

      // 답글 확인 및 추출
      let hasReply = false;
      let reply: NaverPlaceReview["reply"] = undefined;

      const replyElement = $review.find(
        '.pui__GbW8H7, [class*="reply"], [class*="response"]'
      );
      if (replyElement.length > 0) {
        hasReply = true;
        const hospitalName = replyElement
          .find('.pui__XE54q7, [class*="hospital"], [class*="business"]')
          .text()
          .trim();
        const replyDate = replyElement
          .find('.pui__4APmFd, time, [class*="date"]')
          .text()
          .trim();
        const replyContent = replyElement
          .find('.pui__J0tczd, [class*="content"]')
          .text()
          .trim();

        if (hospitalName && replyContent) {
          reply = {
            hospitalName,
            replyDate,
            content: replyContent,
          };
        }
      }

      const review: NaverPlaceReview = {
        reviewerName,
        reviewerProfile,
        reviewerStats,
        visitDate,
        visitInfo,
        content,
        photos: photos.length > 0 ? photos : undefined,
        hasReply,
        reply,
      };

      reviews.push(review);
    } catch (error) {
      console.error(`리뷰 ${index} 파싱 오류:`, error);
    }
  });

  return reviews;
}

/**
 * 네이버 플레이스 리뷰 크롤링
 */
export async function crawlNaverPlaceReviews(
  placeUrl: string,
  maxPages: number = 3
): Promise<NaverPlaceCrawlResult> {
  try {
    console.log(`네이버 플레이스 리뷰 크롤링 시작: ${placeUrl}`);

    // Place ID 추출
    const placeId = extractNaverPlaceId(placeUrl);
    if (!placeId) {
      return {
        success: false,
        error: "유효하지 않은 네이버 플레이스 URL입니다.",
      };
    }

    // 방문자 리뷰 페이지 크롤링
    const visitorUrl = generateNaverPlaceUrl(placeId, "visitor");
    const scrapeResult = await scrapeWithFirecrawl(visitorUrl, {
      formats: ["html"],
    });

    if (!scrapeResult.success || !scrapeResult.data?.html) {
      return {
        success: false,
        error: scrapeResult.error || "페이지 크롤링에 실패했습니다.",
      };
    }

    const $ = cheerio.load(scrapeResult.data.html);

    // 통계 정보 추출
    const stats = extractPlaceStats($, placeId);

    // 리뷰 추출
    const reviews = extractReviews($);

    console.log(
      `크롤링 완료: 리뷰 ${reviews.length}개, 방문자 리뷰 총 ${stats.totalVisitorReviews}개, 블로그 리뷰 총 ${stats.totalBlogReviews}개`
    );

    return {
      success: true,
      data: {
        stats,
        reviews,
      },
    };
  } catch (error) {
    console.error("네이버 플레이스 리뷰 크롤링 오류:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";

    return {
      success: false,
      error: `네이버 플레이스 리뷰 크롤링 중 오류가 발생했습니다: ${errorMessage}`,
    };
  }
}

/**
 * 네이버 플레이스 정보 페이지 크롤링
 */
export async function crawlNaverPlaceInfo(
  placeUrl: string
): Promise<NaverPlaceInfoResult> {
  try {
    console.log(`네이버 플레이스 정보 크롤링 시작: ${placeUrl}`);

    // Place ID 추출
    const placeId = extractNaverPlaceId(placeUrl);
    if (!placeId) {
      return {
        success: false,
        error: "유효하지 않은 네이버 플레이스 URL입니다.",
      };
    }

    // 정보 페이지 URL 생성
    const infoUrl = `https://m.place.naver.com/hospital/${placeId}/information`;

    const scrapeResult = await scrapeWithFirecrawl(infoUrl, {
      formats: ["html"],
    });

    if (!scrapeResult.success || !scrapeResult.data?.html) {
      return {
        success: false,
        error: scrapeResult.error || "페이지 크롤링에 실패했습니다.",
      };
    }

    const $ = cheerio.load(scrapeResult.data.html);

    // 병원명 추출
    const placeName = $("h1").first().text().trim() || "알 수 없음";

    // 소개말 추출
    let description: string | undefined;
    const descriptionElement = $(
      '.AX_W3._6sPQ, [class*="description"], [class*="intro"]'
    );
    if (descriptionElement.length > 0) {
      description = descriptionElement.text().trim();
    }

    // 대표키워드 추출
    const keywords: string[] = [];
    const keywordElements = $(
      '.qzSg4 .PM0JZ, [class*="keyword"] span, [class*="tag"] span'
    );
    keywordElements.each((_, element) => {
      const keyword = $(element).text().trim();
      if (keyword) {
        keywords.push(keyword);
      }
    });

    console.log(
      `정보 크롤링 완료: ${placeName}, 소개말: ${
        description?.length || 0
      }자, 키워드: ${keywords.length}개`
    );

    return {
      success: true,
      data: {
        placeName,
        placeId,
        description: description || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
      },
    };
  } catch (error) {
    console.error("네이버 플레이스 정보 크롤링 오류:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";

    return {
      success: false,
      error: `네이버 플레이스 정보 크롤링 중 오류가 발생했습니다: ${errorMessage}`,
    };
  }
}

/**
 * 네이버 플레이스 URL 유효성 검사
 */
export function isValidNaverPlaceUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "m.place.naver.com" &&
      /\/(hospital|place|restaurant)\/\d+/.test(urlObj.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * 리뷰 감정 분석을 위한 키워드 추출
 */
export function extractReviewKeywords(reviews: NaverPlaceReview[]): {
  positive: string[];
  negative: string[];
  neutral: string[];
} {
  const positiveKeywords = new Set<string>();
  const negativeKeywords = new Set<string>();
  const neutralKeywords = new Set<string>();

  const positiveTerms = [
    "좋",
    "만족",
    "친절",
    "깨끗",
    "편안",
    "추천",
    "최고",
    "훌륭",
    "감사",
    "완벽",
    "멋진",
    "괜찮",
    "효과",
    "개선",
    "치료",
    "정확",
    "꼼꼼",
  ];

  const negativeTerms = [
    "별로",
    "나쁘",
    "불친절",
    "실망",
    "아쉽",
    "불편",
    "비싸",
    "오래",
    "불만",
    "문제",
    "어려",
    "힘들",
    "안좋",
    "부족",
    "늦",
    "복잡",
  ];

  reviews.forEach((review) => {
    const content = review.content.toLowerCase();

    positiveTerms.forEach((term) => {
      if (content.includes(term)) {
        positiveKeywords.add(term);
      }
    });

    negativeTerms.forEach((term) => {
      if (content.includes(term)) {
        negativeKeywords.add(term);
      }
    });
  });

  return {
    positive: Array.from(positiveKeywords),
    negative: Array.from(negativeKeywords),
    neutral: [], // 추후 확장 가능
  };
}
