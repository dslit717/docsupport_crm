"use server";

import { scrapeWithFirecrawl } from "./firecrawl";
import {
  extractChannelInfoFromHtml,
  extractYoutubeChannelInfo,
  normalizeYoutubeUrl,
  isValidYoutubeUrl,
  type YoutubeChannelInfo,
  type YoutubeAnalysisResult,
} from "./youtube-crawler";

/**
 * SERPAPI를 사용하여 YouTube 채널 정보를 검색합니다.
 */
async function fetchYoutubeChannelWithSerpAPI(
  channelUrl: string
): Promise<YoutubeChannelInfo> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY가 설정되지 않았습니다.");
  }

  // URL인지 채널명인지 확인
  let searchQuery: string;
  let isUrl = false;

  try {
    const channelInfo = extractYoutubeChannelInfo(channelUrl);
    if (channelInfo) {
      // URL인 경우
      isUrl = true;
      searchQuery =
        channelInfo.type === "handle"
          ? channelInfo.id.replace("@", "")
          : channelInfo.id;
    } else {
      // URL이 아닌 경우 (채널명으로 간주)
      searchQuery = channelUrl.replace("@", "").trim();
    }
  } catch (error) {
    // URL 파싱 실패 시 채널명으로 간주
    searchQuery = channelUrl.replace("@", "").trim();
  }

  if (!searchQuery) {
    throw new Error("검색할 채널명을 입력해주세요.");
  }

  const serpApiUrl = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(
    searchQuery
  )}&api_key=${apiKey}`;

  console.log(`🔍 SERPAPI YouTube 검색: ${searchQuery}`);
  const response = await fetch(serpApiUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`SERPAPI 오류: ${response.status} ${response.statusText}`);
  }

  if (!data.channel_results || data.channel_results.length === 0) {
    throw new Error("채널을 찾을 수 없습니다.");
  }

  // 정확한 채널 찾기
  let targetChannel = data.channel_results[0]; // 기본적으로 첫 번째 결과 사용

  if (isUrl) {
    // URL인 경우 handle이 정확히 일치하는 채널 찾기
    const channelInfo = extractYoutubeChannelInfo(channelUrl);
    if (channelInfo && channelInfo.type === "handle") {
      const exactMatch = data.channel_results.find(
        (channel: any) => channel.handle === channelInfo.id
      );
      if (exactMatch) {
        targetChannel = exactMatch;
      }
    }
  } else {
    // 채널명인 경우 가장 관련성 높은 채널 선택
    // 검색어와 제목이 가장 유사한 채널 찾기
    const searchLower = searchQuery.toLowerCase();
    const bestMatch = data.channel_results.find((channel: any) => {
      const titleLower = channel.title.toLowerCase();
      return (
        titleLower.includes(searchLower) || searchLower.includes(titleLower)
      );
    });
    if (bestMatch) {
      targetChannel = bestMatch;
    }
  }

  return {
    channelName: targetChannel.title || "알 수 없는 채널",
    subscriberCount: formatSubscriberCount(
      targetChannel.subscribers?.toString() || "0"
    ),
    description: targetChannel.description || "채널 설명이 없습니다.",
    thumbnailUrl: targetChannel.thumbnail || "",
    channelUrl: targetChannel.link || channelUrl,
    videoCount: "정보 없음", // SERPAPI에서는 동영상 수를 제공하지 않음
  };
}

/**
 * 구독자 수를 형식화합니다.
 */
function formatSubscriberCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * 유튜브 채널 정보를 크롤링합니다. (서버 액션)
 */
export async function crawlYoutubeChannelAction(
  channelUrl: string
): Promise<YoutubeAnalysisResult> {
  try {
    // URL 정규화
    const normalizedUrl = normalizeYoutubeUrl(channelUrl);

    if (!isValidYoutubeUrl(normalizedUrl)) {
      return {
        channelInfo: {
          channelName: "오류",
          subscriberCount: "오류",
          description: "유효하지 않은 YouTube URL입니다.",
          thumbnailUrl: "",
          channelUrl: channelUrl,
        },
        error: "유효하지 않은 YouTube URL입니다.",
      };
    }

    console.log("Crawling YouTube channel:", normalizedUrl);

    // SERPAPI를 우선적으로 사용하여 채널 정보 가져오기
    let channelInfo: YoutubeChannelInfo;

    try {
      channelInfo = await fetchYoutubeChannelWithSerpAPI(normalizedUrl);
    } catch (serpApiError) {
      console.warn("SERPAPI 실패, Firecrawl 시도:", serpApiError);

      // SERPAPI 실패 시 Firecrawl 시도
      try {
        const crawlResult = await scrapeWithFirecrawl(normalizedUrl, {
          formats: ["html"],
          onlyMainContent: false, // YouTube는 전체 페이지가 필요할 수 있음
        });

        if (!crawlResult.success) {
          throw new Error(
            crawlResult.error || "Failed to crawl YouTube channel"
          );
        }

        // HTML에서 채널 정보 추출
        channelInfo = extractChannelInfoFromHtml(
          crawlResult.data.html || "",
          normalizedUrl
        );
      } catch (crawlError) {
        console.warn("Firecrawl도 실패, 기본 정보로 대체:", crawlError);

        // 모든 방법 실패 시 URL에서 기본 정보 추출
        const channelIdInfo = extractYoutubeChannelInfo(channelUrl);
        channelInfo = {
          channelName: channelIdInfo
            ? `채널 (${channelIdInfo.id})`
            : "알 수 없는 채널",
          subscriberCount: "정보 없음",
          description:
            "YouTube 접근 제한으로 인해 상세 정보를 가져올 수 없습니다. SERPAPI 키가 올바르게 설정되어 있는지 확인해주세요.",
          thumbnailUrl: "",
          channelUrl: normalizedUrl,
          videoCount: "정보 없음",
        };
      }
    }

    // 기본값 설정
    if (channelInfo.channelName === "정보 없음") {
      channelInfo.channelName = "채널명을 가져올 수 없습니다";
    }

    if (channelInfo.description === "정보 없음") {
      channelInfo.description = "채널 설명을 가져올 수 없습니다";
    }

    console.log("YouTube channel info extracted:", {
      channelName: channelInfo.channelName,
      subscriberCount: channelInfo.subscriberCount,
      hasDescription: channelInfo.description !== "정보 없음",
      hasThumbnail: !!channelInfo.thumbnailUrl,
    });

    return {
      channelInfo: channelInfo,
    };
  } catch (error) {
    console.error("Error crawling YouTube channel:", error);

    return {
      channelInfo: {
        channelName: "오류",
        subscriberCount: "오류",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        thumbnailUrl: "",
        channelUrl: channelUrl,
      },
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

/**
 * 채널명으로 YouTube 채널을 검색합니다. (서버 액션)
 */
export async function searchYoutubeChannelAction(
  channelName: string
): Promise<YoutubeAnalysisResult> {
  try {
    if (!channelName.trim()) {
      return {
        channelInfo: {
          channelName: "오류",
          subscriberCount: "오류",
          description: "채널명을 입력해주세요.",
          thumbnailUrl: "",
          channelUrl: "",
        },
        error: "채널명을 입력해주세요.",
      };
    }

    console.log("Searching YouTube channel:", channelName);

    // SERPAPI로 채널 검색 (채널명 직접 전달)
    const channelInfo = await fetchYoutubeChannelWithSerpAPI(channelName);

    return {
      channelInfo: channelInfo,
    };
  } catch (error) {
    console.error("Error searching YouTube channel:", error);

    return {
      channelInfo: {
        channelName: "오류",
        subscriberCount: "오류",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        thumbnailUrl: "",
        channelUrl: "",
      },
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}
