import "server-only";
import { extractWithFirecrawl } from "./firecrawl";
import { z } from "zod";

/**
 * 병원 정보 검색 라이브러리
 * Server-only 환경에서만 사용 가능
 */

// Zod 스키마 정의
const HospitalInfoSchema = z.object({
  place_url: z
    .string()
    .nullable()
    .describe(
      "네이버 플레이스 URL (/place/숫자 또는 /place/hospital/숫자 형태)"
    ),
  place_id: z.string().nullable().describe("네이버 플레이스 ID (숫자 부분만)"),
});

export type HospitalInfo = z.infer<typeof HospitalInfoSchema>;

export interface HospitalSearchResult {
  success: boolean;
  data?: {
    place_id: string;
    naver_place_url: string;
  };
  error?: string;
}

/**
 * 병원 이름과 주소로 네이버 플레이스 정보를 검색합니다.
 */
export async function findHospitalPlace(
  hospitalName: string,
  address: string
): Promise<HospitalSearchResult> {
  try {
    if (!hospitalName || !address) {
      return {
        success: false,
        error: "병원 이름과 주소가 필요합니다.",
      };
    }

    // 네이버 검색 URL 생성
    const searchQuery = `${hospitalName} ${address}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const naverSearchUrl = `https://m.search.naver.com/search.naver?query=${encodedQuery}`;

    console.log(`네이버 검색 URL: ${naverSearchUrl}`);

    const prompt = `
      find "a" html tag which class is "place_bluelink". Extract place_url information from the href. The place_id is the numeric part of the URL. Include the name, address, phone number, and category if available.
    `;

    // Firecrawl extract 호출
    const extractResult = await extractWithFirecrawl([naverSearchUrl], {
      prompt: prompt,
      schema: HospitalInfoSchema,
    });

    if (!extractResult.success) {
      console.error("Firecrawl 추출 실패:", extractResult.error);
      return {
        success: false,
        error: `병원 정보 추출 실패: ${extractResult.error}`,
      };
    }

    console.log("Firecrawl 추출 결과:", extractResult);

    // place URL에서 ID 추출
    let placeId = extractResult.data.place_id;

    if (!placeId) {
      return {
        success: false,
        error: "네이버 플레이스 정보를 찾을 수 없습니다.",
      };
    }

    // 네이버 플레이스 전체 URL 생성
    const naverPlaceUrl = `https://m.place.naver.com/hospital/${placeId}/home`;

    return {
      success: true,
      data: {
        place_id: placeId,
        naver_place_url: naverPlaceUrl,
      },
    };
  } catch (error) {
    console.error("병원 정보 검색 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 네이버 플레이스 ID로부터 병원 상세 URL을 생성합니다.
 */
export function generateHospitalPlaceUrl(placeId: string): string {
  return `https://m.place.naver.com/hospital/${placeId}/home`;
}

/**
 * 네이버 플레이스 URL에서 플레이스 ID를 추출합니다.
 */
export function extractPlaceId(placeUrl: string): string | null {
  const patterns = [
    /\/place\/(\d+)/,
    /\/place\/hospital\/(\d+)/,
    /placeId=(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = placeUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
