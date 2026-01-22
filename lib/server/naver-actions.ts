import "server-only";
import { crawlNaverPlaceReviews } from "./naver-place-crawler";

/**
 * 네이버 플레이스 리뷰 크롤링 서버 액션
 */
export async function crawlNaverPlaceReviewsAction(
  placeUrl: string,
  maxPages: number = 3
) {
  try {
    console.log("네이버 플레이스 리뷰 크롤링 액션 시작:", placeUrl);

    const result = await crawlNaverPlaceReviews(placeUrl, maxPages);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("네이버 플레이스 리뷰 크롤링 액션 오류:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";

    return {
      success: false,
      error: `네이버 플레이스 리뷰 크롤링 중 오류가 발생했습니다: ${errorMessage}`,
    };
  }
}
